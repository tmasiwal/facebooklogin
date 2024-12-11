const { Task } = require("../Model/task.model");

const ScheduleTask = async (req, res) => {
  const { userId, action, time } = req.body;

  try {
    const newTask = new Task({
      userId,
      action,
      scheduledTime: new Date(time),
      status: "pending",
    });
    await newTask.save();
    res.status(200).json({ message: "Task scheduled", task: newTask });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const CanceleTask = async (req, res) => {
  const { userId, action } = req.body;

  try {
    const task = await Task.findOne({
      userId,
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
};

const axios = require("axios");
const Contact = require("../Model/contact.model"); // Adjust this path
const MessageModel = require("../Model/message.model");

// Function to fetch the template only once
async function fetchTemplate(templateId) {
  try {
    const response = await axios.get(
      `https://interakt-amped-express.azurewebsites.net/api/v17.0/308727328997268/message_templates/id/${templateId}`,
      {
        headers: {
          "x-access-token": "7SFRQSvyqow0hNMOGRkzSAoA5Prwh6JU",
          "x-waba-id": "308727328997268",
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching template:",
      error.response?.data || error.message
    );
    throw error;
  }
}

// Function to send WhatsApp message using the template
async function sendDynamicWhatsAppMessage(
  recipientPhone,
  templateData,
  attributes,
  contactAttributes,
  Ids,
  broadcastId
) {
 
  try {
    const { name, language, components } = templateData;
console.log(Ids)
    // Prepare the base payload
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipientPhone,
      type: "template",
      template: {
        name: name,
        language: { code: language },
        components: [],
      },
    };

    // Function to get attribute value (from contact first, then default attributes)
    const getAttributeValue = (key, fallbackArray) =>
      contactAttributes[key] || fallbackArray.shift();

    // Loop through components to dynamically add them to the payload
    components.forEach((component) => {
      if (component.type === "HEADER" && attributes.header) {
        const headerValue = getAttributeValue("header", [...attributes.header]);

        // Handle header formats like IMAGE, VIDEO, DOCUMENT
        if (component.format === "IMAGE") {
          payload.template.components.push({
            type: "header",
            parameters: [
              {
                type: "image",
                image: { link: headerValue },
              },
            ],
          });
        } else if (component.format === "VIDEO") {
          payload.template.components.push({
            type: "header",
            parameters: [
              {
                type: "video",
                video: { link: headerValue },
              },
            ],
          });
        } else if (component.format === "DOCUMENT") {
          payload.template.components.push({
            type: "header",
            parameters: [
              {
                type: "document",
                document: { link: headerValue },
              },
            ],
          });
        }
      } else if (component.type === "BODY" && attributes.body) {
        // Replace placeholders in the body text (e.g., {{1}}, {{2}})
        let bodyText = component.text;
        const bodyValues = attributes.body.map((key) =>
          getAttributeValue(key, [...attributes.body])
        );

        bodyValues.forEach((value, index) => {
          const placeholder = `{{${index + 1}}}`;
          bodyText = bodyText.replace(placeholder, value);
        });

        payload.template.components.push({
          type: "body",
          parameters: [{ type: "text", text: bodyText }],
        });
      }
    });

    // Send the request to the Interakt API
    console.log("Final Payload:", JSON.stringify(payload, null, 2));
    const response = await axios.post(
      `https://amped-express.interakt.ai/api/v17.0/${Ids.phone_number_id}/messages`,
      payload,
      {
        headers: {
          "x-access-token": "7SFRQSvyqow0hNMOGRkzSAoA5Prwh6JU",
          "x-waba-id": Ids.waba_id,
          "Content-Type": "application/json",
        },
      }
    );
    const { contacts, messages } = response.data;
    const contact = contacts[0]; // Assuming you have only one contact in the array
    const message = messages[0]; // Assuming you have only one message in the array
  
    // Create a new message entry in the database
    const newMessage = new MessageModel({
      phone_number_id: Ids.phone_number_id, 
      direction: 'sent', 
      waba_id:Ids.wa_id,
      to: payload.to, 
      id: message.id, 
      timestamp: Date.now(),
      status: 'sent', 
      failure_reason: null, 
      broadcastId:broadcastId,
    });
  
    // Save the message to the database
    await newMessage.save();
    console.log(`Message sent successfully to ${recipientPhone}`);
  } catch (error) {
    console.log(error)
    console.error(
      `Error sending message to ${recipientPhone}:`,
      error.response?.data || error.message
    );
  }
}

// Function to send messages to all contacts based on provided IDs
async function sendMessagesToSelectedContacts(
  templateId,
  contactIds,
  attributes,
  Ids,
  broadcastId
) {
  try {
    // Fetch the template once
    const templateData = await fetchTemplate(templateId);
    console.log("Template fetched successfully:", templateData.name);



    for (const contactid of contactIds) {
      const contact = await Contact.findById(contactid);
      const phone = contact.phone;
      const contactAttributes = contact.contactAttributes || [];

      // Map the contact attributes for quick lookup
      const attributeMap = contactAttributes.reduce((acc, attr) => {
        acc[attr.key] = attr.value;
        return acc;
      }, {});

      console.log(`Sending message to: ${phone}`);
      await sendDynamicWhatsAppMessage(
        phone,
        templateData,
        attributes,
        attributeMap,
        Ids,
        broadcastId
      );
    }

    console.log("All messages sent successfully.");
    return true;
  } catch (error) {
    console.error("Error sending messages:", error.message);
  }
}

// // Example usage
// const templateId = '1308823763449725';
// const contactIds = ['66dfcbc855f7ef388357b287', '66dc0462fb45e45d4986bd1b']; // Replace with actual contact IDs
// const attributes = {
//   header: ['https://brodcastwatsapp.blob.core.windows.net/tempateimage/newvdeo.mp4'], // Header key or default value

//   // Body keys or default values
//   body: ['Pankaj'],
// };

// sendMessagesToSelectedContacts(templateId, contactIds, attributes);

module.exports = { ScheduleTask, CanceleTask, sendMessagesToSelectedContacts };
