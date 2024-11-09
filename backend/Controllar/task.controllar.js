const {Task} =require("../Model/task.model")


const ScheduleTask = async (req, res) =>{
const { username, action, time } = req.body;

try {
  const newTask = new Task({
    username,
    action,
    scheduledTime: new Date(time),
    status: "pending",
  });
  await newTask.save();
  res.status(200).json({ message: "Task scheduled", task: newTask });
} catch (err) {
  res.status(400).json({ message: err.message });
}
}


const CanceleTask = async (req, res) =>{
    const { username, action } = req.body;

    try {
      const task = await Task.findOne({
        username,
        action,
        status: "pending",
      });

      if (task) {
        task.status = "canceled";
        await task.save();
        res.status(200).json({ message: "Task canceled" });
      } else {
        res.status(404).json({ message: "No pending task found to cancel" });
      }
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
}


function formatWhatsAppTemplate(template, to, parameters) {
  const formattedTemplate = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "template",
    template: {
      name: template.name,
      language: { code: template.language || "en_US" },
      components: []
    }
  };

  // Header Component
  const headerComponent = template.components.find(c => c.type === "HEADER");
  if (headerComponent) {
    const headerParams = { type: headerComponent.format.toLowerCase() };
    
    if (headerComponent.format === "IMAGE" || headerComponent.format === "VIDEO" || headerComponent.format === "DOCUMENT") {
      // Add media link based on header format (image, video, or document)
      headerParams[headerComponent.format.toLowerCase()] = { link: parameters.headerMediaLink };
    } else if (headerComponent.format === "TEXT" && headerComponent.example) {
      // If header is text with an example, use example values
      const exampleText = headerComponent.example.header_text[0].map(text => ({ type: "text", text }));
      formattedTemplate.template.components.push({ type: "header", parameters: exampleText });
    }
    
    formattedTemplate.template.components.push({ type: "header", parameters: [headerParams] });
  }

  // Body Component
  const bodyComponent = template.components.find(c => c.type === "BODY");
  if (bodyComponent && bodyComponent.example) {
    const exampleValues = bodyComponent.example.body_text[0];
    
    const bodyParams = bodyComponent.text.split(/{{(\d+)}}/).map((part, index) => {
      if (index % 2 === 1) {
        const varIndex = parseInt(part, 10) - 1;
        return { type: "text", text: exampleValues[varIndex] };
      }
      return { type: "text", text: part };
    }).filter(param => param.text); // Remove any empty text parameters
    
    formattedTemplate.template.components.push({ type: "body", parameters: bodyParams });
  }

  // Buttons Component
  const buttonComponent = template.components.find(c => c.type === "BUTTONS");
  if (buttonComponent) {
    const buttonParams = buttonComponent.buttons.map(button => {
      if (button.type === "QUICK_REPLY") {
        return { type: "quick_reply", text: button.text };
      } else if (button.type === "CALL_TO_ACTION") {
        const buttonDetail = { type: "call_to_action" };
        if (button.subtype === "PHONE_NUMBER") {
          buttonDetail.phone_number = parameters.phoneNumber;
        } else if (button.subtype === "URL") {
          buttonDetail.url = button.dynamic ? parameters.dynamicUrl : button.url;
        }
        return buttonDetail;
      }
      return null;
    }).filter(Boolean);
    formattedTemplate.template.components.push({ type: "button", parameters: buttonParams });
  }

  return formattedTemplate;
}


// async function sendWhatsAppMessage(template, recipientPhone) {
//   // const accessToken = 'YOUR_WHATSAPP_API_TOKEN'; // Replace with your actual token
//   // const url = `https://graph.facebook.com/v17.0/${template.id}/messages`;

//   // Determine the type of message to send
//   const headerType = template.components.find(comp => comp.type === 'HEADER')?.format;
//   const headerExample = template.components.find(comp => comp.type === 'HEADER')?.example;
//   const bodyText = template.components.find(comp => comp.type === 'BODY')?.text;
//   const bodyExample = template.components.find(comp => comp.type === 'BODY')?.example?.body_text?.[0] || [];

//   // Prepare data based on header type
//   let headerData = {};
//   if (headerType === 'DOCUMENT' && headerExample) {
//       headerData = {
//           type: 'document',
//           document: {
//               link: headerExample.header_handle[0],
//               filename: 'Receipt.pdf',
//           }
//       };
//   } else if (headerType === 'VIDEO' && headerExample) {
//       headerData = {
//           type: 'video',
//           video: {
//               link: headerExample.header_handle[0],
//           }
//       };
//   } else if (headerType === 'IMAGE' && headerExample) {
//       headerData = {
//           type: 'image',
//           image: {
//               link: headerExample.header_handle[0],
//           }
//       };
//   }

//   // Prepare body data with placeholders
//   const bodyTextFormatted = bodyExample.reduce((text, value, index) => {
//       return text.replace(`{{${index + 1}}}`, value);
//   }, bodyText);

//   const messagePayload = {
//       messaging_product: 'whatsapp',
//       to: recipientPhone,
//       type: headerData.type || 'text',
//       [headerData.type]: headerData[headerData.type] || undefined,
//       text: headerData.type ? undefined : {
//           body: bodyTextFormatted
//       }
//   };

//   // Add components if button template exists
//   if (template.components.some(comp => comp.type === 'BUTTONS')) {
//       messagePayload.template = {
//           name: template.name,
//           language: { code: template.language || 'en' },
//           components: template.components.map(component => {
//               return {
//                   type: component.type,
//                   sub_type: component.format || 'text',
//                   parameters: component.text ? [{
//                       type: 'text',
//                       text: component.text
//                   }] : undefined,
//               };
//           })
//       };
//   }

//   // Send the message via WhatsApp API
//   try {
//       // const response = await axios.post(url, messagePayload, {
//       //     headers: {
//       //         'Authorization': `Bearer ${accessToken}`,
//       //         'Content-Type': 'application/json'
//       //     }
//       // });
//       console.log('Message sent successfully:', messagePayload);
//   } catch (error) {
//       console.error('Error sending message:', error.response?.data || error.message);
//   }
// }
const axios = require('axios');

async function sendDynamicWhatsAppMessage(recipientPhone, templateData) {
  // Destructure necessary fields from templateData
  const { name, language, components } = templateData;

  // Prepare the base payload
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipientPhone,
    type: 'template',
    template: {
      name: name,
      language: { code: language },
      components: [],
    },
  };

  // Loop through components to dynamically add them to the payload
  components.forEach((component) => {
    if (component.type === 'HEADER') {
      // Handle different header formats like IMAGE, VIDEO, DOCUMENT
      if (component.format === 'IMAGE') {
        payload.template.components.push({
          type: 'header',
          parameters: [
            {
              type: 'image',
              image: {
                link: component.example.header_handle[0],
              },
            },
          ],
        });
      } else if (component.format === 'VIDEO') {
        payload.template.components.push({
          type: 'header',
          parameters: [
            {
              type: 'video',
              video: {
                link: component.example.header_handle[0],
              },
            },
          ],
        });
      } else if (component.format === 'DOCUMENT') {
        payload.template.components.push({
          type: 'header',
          parameters: [
            {
              type: 'document',
              document: {
                link: component.example.header_handle[0],
              },
            },
          ],
        });
      }
    } else if (component.type === 'BODY') {
      // Handle body with text placeholders
      const bodyText = component.text;
      const bodyExample = component.example?.body_text?.[0];

      // Replace placeholders in body text with actual values from the example
      let formattedBodyText = bodyText;
      if (bodyExample && Array.isArray(bodyExample)) {
        bodyExample.forEach((text, index) => {
          formattedBodyText = formattedBodyText.replace(`{{${index + 1}}}`, text);
        });
      }

      // Add the formatted body text to the payload
      payload.template.components.push({
        type: 'body',
        parameters: [
          {
            type: 'text',
            text: formattedBodyText,
          },
        ],
      });
    }
  });

  try {
    // Send the request to the Interakt API (commented out for testing)
    // const response = await axios.post(
    //   'https://amped-express.interakt.ai/api/v17.0/425551820647436/messages',
    //   payload,
    //   {
    //     headers: {
    //       'x-access-token': '7SFRQSvyqow0hNMOGRkzSAoA5Prwh6JU',
    //       'x-waba-id': '310103775524526',
    //       'Content-Type': 'application/json',
    //     },
    //   }
    // );

    console.log('Message sent successfully:', payload);
    console.log('Message sent successfully:', payload.template.components[1]);
  } catch (error) {
    console.error('Error sending message:', error.response?.data || error.message);
  }
}

// Example usage:

// Sample template fetched from your data
const exampleTemplate =  {
  "name": "video_test",
  "parameter_format": "POSITIONAL",
  "components": [
      {
          "type": "HEADER",
          "format": "VIDEO",
          "example": {
              "header_handle": [
                  "https://scontent.whatsapp.net/v/t61.29466-34/463432389_1308823770116391_3767634705839020423_n.mp4?ccb=1-7&_nc_sid=8b1bef&_nc_ohc=R9GdSDck5AgQ7kNvgEKQii-&_nc_zt=28&_nc_ht=scontent.whatsapp.net&edm=AH51TzQEAAAA&_nc_gid=AGZr1KY2fUCKJZ2GiSnjCqz&oh=01_Q5AaIK8oQsDGAr_G8eeil0NJGVa9Xb-ZRXgPQDoIIsPleaIs&oe=675639AC"
              ]
          }
      },
      {
          "type": "BODY",
          "text": "Hello {{1}}. Your video is now LIVE, enjoy our services!",
          "example": {
              "body_text": [
                  [
                      "Name"
                  ]
              ]
          }
      }
  ],
  "language": "en",
  "status": "APPROVED",
  "category": "MARKETING",
  "id": "1308823763449725"
}

sendDynamicWhatsAppMessage('9522189879', exampleTemplate);



module.exports ={ScheduleTask,CanceleTask}