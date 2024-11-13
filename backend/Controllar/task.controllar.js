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
  contactAttributes
) {
  try {
    const { name, language, components } = templateData;

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

        // Determine the format of the header (IMAGE, VIDEO, DOCUMENT, or TEXT)
        if (component.format === "IMAGE" && headerValue.startsWith("http")) {
          payload.template.components.push({
            type: "header",
            parameters: [
              {
                type: "image",
                image: { link: headerValue },
              },
            ],
          });
        } else if (component.format === "VIDEO" && headerValue.startsWith("http")) {
          payload.template.components.push({
            type: "header",
            parameters: [
              {
                type: "video",
                video: { link: headerValue },
              },
            ],
          });
        } else if (component.format === "DOCUMENT" && headerValue.startsWith("http")) {
          payload.template.components.push({
            type: "header",
            parameters: [
              {
                type: "document",
                document: { link: headerValue },
              },
            ],
          });
        } else {
          // Default to text if it's not a link or other known format
          payload.template.components.push({
            type: "header",
            parameters: [{ type: "text", text: headerValue }],
          });
        }
      } else if (component.type === "BODY" && attributes.body) {
        const bodyParameters = attributes.body.map((key) => ({
          type: "text",
          text: getAttributeValue(key, [...attributes.body]),
        }));

        // Add the body component to the payload
        payload.template.components.push({
          type: "body",
          parameters: bodyParameters,
        });
      }
    });

    console.log("Final Payload:", JSON.stringify(payload, null, 2));

    // Send the request to the Interakt API
    const response = await axios.post(
      "https://amped-express.interakt.ai/api/v17.0/425551820647436/messages",
      payload,
      {
        headers: {
          "x-access-token": "7SFRQSvyqow0hNMOGRkzSAoA5Prwh6JU",
          "x-waba-id": "310103775524526",
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`Message sent successfully to ${recipientPhone}`);
  } catch (error) {
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
  attributes
) {
  try {
    // Fetch the template once
    const templateData = await fetchTemplate(templateId);
    console.log("Template fetched successfully:", templateData.name);

    for (const contactId of contactIds) {
      const contact = await Contact.findById(contactId);
      const phone = contact.phone;
      const contactAttributes = contact.contactAttributes || [];

      // Map the contact attributes for quick lookup
      const attributeMap = contactAttributes.reduce((acc, attr) => {
        acc[attr.key] = attr.value;
        return acc;
      }, {});

      // Prepare final attributes
      const finalAttributes = {
        header: attributes.header,
        body: attributes.body.map((key) => attributeMap[key] || key),
      };

      console.log(`Sending message to: ${phone}`);
      await sendDynamicWhatsAppMessage(
        phone,
        templateData,
        finalAttributes,
        attributeMap
      );
    }

    console.log("All messages sent successfully.");
  } catch (error) {
    console.error("Error sending messages:", error.message);
  }
}

// Example usage
// const templateId = "1308823763449725";
// const contactIds = ["66dc0399fb45e45d4986bd13", "66dc0462fb45e45d4986bd1b"];
// const attributes = {
//   header: ["https://brodcastwatsapp.blob.core.windows.net/tempateimage/newvdeo.mp4"], // Can be a link for image/video/document or plain text
//   body: ["Pankaj"], // Body text
// };

// sendMessagesToSelectedContacts(templateId, contactIds, attributes);




module.exports = { ScheduleTask, CanceleTask, sendMessagesToSelectedContacts };
