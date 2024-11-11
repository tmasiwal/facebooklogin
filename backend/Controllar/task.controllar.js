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


const axios = require('axios');
const mongoose = require('mongoose');
const KeyAttribute = require('../Model/keyAttribute.model'); // Ensure this path is correct
const Contact = require('../Model/contact.model'); // Adjust the path as necessary

async function sendDynamicWhatsAppMessage(recipientPhone, templateId, contactAttributes) {
  try {
    // Fetch template data
    const templateResponse = await axios.get(
      `https://interakt-amped-express.azurewebsites.net/api/v17.0/308727328997268/message_templates/id/${templateId}`,
      {
        headers: {
          'x-access-token': '7SFRQSvyqow0hNMOGRkzSAoA5Prwh6JU',
          'x-waba-id': '308727328997268',
          'Content-Type': 'application/json',
        },
      }
    );

    const templateData = templateResponse.data;
    const { name, language, components } = templateData;

    // Fetch keys from the database
    const existingKeys = await KeyAttribute.find({
      key: { $in: contactAttributes?.map(attr => attr.key) }
    }).select('key value');

    // Convert the fetched keys to a map for easier lookup
    const keyMap = existingKeys.reduce((map, obj) => {
      map[obj.key] = obj.value;
      return map;
    }, {});

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

        // Prepare body parameters array
        const bodyParams = [];
        if (bodyExample && Array.isArray(bodyExample) && bodyExample.length > 0) {
          bodyExample.forEach((key, index) => {
            // Check if the key exists in the keyMap, otherwise use the default text
            const replacementText = keyMap[key] || key;
            bodyParams.push({ type: 'text', text: replacementText });
          });

          // Add the body component to the payload
          payload.template.components.push({
            type: 'body',
            parameters: bodyParams,
          });
        }
      }
    });

    // Send the request to the Interakt API
    const response = await axios.post(
      'https://amped-express.interakt.ai/api/v17.0/425551820647436/messages',
      payload,
      {
        headers: {
          'x-access-token': '7SFRQSvyqow0hNMOGRkzSAoA5Prwh6JU',
          'x-waba-id': '310103775524526',
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Message sent successfully:', response.data);
  } catch (error) {
    console.error('Error sending message:', error.response?.data || error.message);
  }
}

async function sendMessagesToAllContacts(userId, templateId) {
  try {
    // Fetch all contacts for the given userId
    const contacts = await Contact.find({ userId });

    if (contacts.length === 0) {
      console.log('No contacts found for the given userId.');
      return;
    }

    // Loop through each contact and send a message
    for (const contact of contacts) {
      const phone = contact.phone;
      const contactAttributes = contact.contactAttributes || [];
      console.log(`Sending message to: ${phone}`);
      await sendDynamicWhatsAppMessage(phone, templateId, contactAttributes);
    }

    console.log('All messages sent successfully.');
  } catch (error) {
    console.error('Error sending messages:', error.message);
  }
}

// Example usage
const userId = '66d9561438c83c4774d9d9e5'; 
const templateId = '1052164973255418';
sendMessagesToAllContacts(userId, templateId);


module.exports ={ScheduleTask,CanceleTask}