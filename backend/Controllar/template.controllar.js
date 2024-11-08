

// controllers/templateController.js
const Template = require('../Model/templent.model');
const KeyAttribute = require('../Model/keyAttribute.model');
require('dotenv').config();
const axios = require('axios');
const TemplateSchedule = require('../Model/TemplateSchedule.model');
const Contact = require('../Model/contact.model');
const {User}= require("../Model/user.model")
const getTemplateAnalytics = async (req, res) => {
  try {
    // Extract start, end, and template_ids from query parameters
    const { start, end, template_ids } = req.query;

    // Ensure the necessary query parameters are provided
    if (!start || !end || !template_ids) {
      return res.status(400).send({ message: 'Missing required query parameters: start, end, or template_ids' });
    }

    // Make the GET request to the external API
    const response = await axios.get(`https://interakt-amped-express.azurewebsites.net/api/v17.0/${process.env.WABA_ID}`, {
      params: {
        fields: `template_analytics.start(${start}).end(${end}).granularity(DAILY).template_ids(${template_ids})`,
      },
      headers: {
        'x-waba-id': process.env.WABA_ID,
        'Content-Type': 'application/json',
        'x-access-token': process.env.ACCESS_TOKEN,
      }
    });

    // Initialize aggregation variables
    let allSent = 0, allRead = 0, allClicked = 0, allDelivered = 0;

    // Iterate over the data points in the response to calculate totals
    response.data.template_analytics.data.forEach(item => {
      item.data_points.forEach(point => {
        allSent += point.sent || 0;
        allRead += point.read || 0;
        allDelivered += point.delivered || 0;

        // Calculate clicks (if any)
        if (point.clicked) {
          allClicked += point.clicked.reduce((acc, click) => acc + click.count, 0);
        }
      });
    });

    // Return aggregated data and original response
    res.status(200).json({
      allSent,
      allRead,
      allClicked,
      allDelivered,
      originalResponse: response.data,  // Original response from API
    });

  } catch (error) {
    console.log('Error fetching template analytics:', error.message);
    res.status(500).send({ message: 'Internal server error' });
  }
};





const getAnalytics = async (req, res) => {
  try {

    const { start, end, template_ids } = req.query;

    // Ensure the necessary query parameters are provided
    if (!start || !end || !template_ids) {
      return res.status(400).send({ message: 'Missing required query parameters: start, end, or template_ids' });
    }

    // Make the GET request to the external API
    const response = await axios.get(`https://interakt-amped-express.azurewebsites.net/api/v17.0/${process.env.WABA_ID}`, {
      params: {
        fields: `template_analytics.start(${start}).end(${end}).granularity(DAILY).template_ids(${template_ids})`,
      },
      headers: {
        'x-waba-id': process.env.WABA_ID,
        'Content-Type': 'application/json',
        'x-access-token': process.env.ACCESS_TOKEN,
      }
    });

    let allSent = 0, allRead = 0, allClicked = 0, allDelivered = 0;

    data.data_points.forEach(point => {
      allSent += point.sent;
      allRead += point.read || 0;
      allDelivered += point.delivered || 0;
      if (point.clicked) {
        allClicked += point.clicked.reduce((acc, click) => acc + click.count, 0);
      }
    });

    res.json({
      allSent,
      allRead,
      allClicked,
      allDelivered,
      originalResponse: response.data,
    });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
};



const createContact = async (req, res) => {
  try {
    const { userId, name, phone, broadcast, sms, contactAttributes } = req.body;

    // Ensure the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate and save unique contact attributes
    const existingKeys = await KeyAttribute.find({ key: { $in: contactAttributes.map(attr => attr.key) } }).select('key');
    const existingKeysSet = new Set(existingKeys.map(attr => attr.key));

    const newAttributes = contactAttributes.filter(attr => !existingKeysSet.has(attr.key));
    
    // Save new key attributes
    if (newAttributes.length > 0) {
      await KeyAttribute.insertMany(newAttributes);
    }

    const contact = new Contact({
      userId,
      name,
      phone,
      broadcast,
      sms,
      contactAttributes
    });

    await contact.save();
    res.status(201).json({"message":"contact create succesfully"});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const createContactsBulk = async (req, res) => {
  try {
    const { userId, contacts } = req.body; // Expecting an array of contacts

    // Ensure the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create a Set to track unique keys for attributes
    const allContactAttributes = contacts.flatMap(contact => contact.contactAttributes);
    const existingKeys = await KeyAttribute.find({ key: { $in: allContactAttributes.map(attr => attr.key) } }).select('key');
    const existingKeysSet = new Set(existingKeys.map(attr => attr.key));

    // Prepare to save new attributes and contacts
    const newAttributes = [];
    const newContacts = [];

    for (const contact of contacts) {
      // Validate contact data
      const { name, phone, broadcast, sms, contactAttributes } = contact;

      // Check for unique attributes and collect new ones
      const uniqueAttributes = contactAttributes.filter(attr => !existingKeysSet.has(attr.key));

      // Add unique attributes to the array
      newAttributes.push(...uniqueAttributes);

      // Prepare the contact for saving
      newContacts.push({
        userId,
        name,
        phone,
        broadcast,
        sms,
        contactAttributes
      });
    }

    // Save new key attributes if any
    if (newAttributes.length > 0) {
      await KeyAttribute.insertMany(newAttributes);
    }

    // Save all new contacts at once
    await Contact.insertMany(newContacts);

    res.status(201).json({ message: "Contacts created successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




const scheduleTemplate = async (req, res) => {
  try {
    const { userId, broadcastName, templateId, contact, scheduleTime,contactAttributes } = req.body;

    const newSchedule = new TemplateSchedule({
      userId,
      broadcastName,
      templateId: templateId, 
      contact:contact, 
      contactAttributes:contactAttributes,                   
      scheduleTime: scheduleTime
    });

    await newSchedule.save();

    res.status(201).json({"message":"contact scheduleTemplate succesfully"});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createTemplate = async (req, res) => {
  const payload = req.body;

  try {
    const result = await axios.post(
      `https://interakt-amped-express.azurewebsites.net/api/v17.0/308727328997268/message_templates`,
      payload,
      {
        headers: {
          "x-waba-id": "308727328997268",
          "x-access-token": "7SFRQSvyqow0hNMOGRkzSAoA5Prwh6JU",
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Template saved successfully:", result.data);
    const templateData = new Template(payload);

    const templatedata = await templateData.save();

    res.status(200).send({ message: "Template saved successfully", result: result.data });
  } catch (error) {
    console.error("Error creating template:", error.message);

    const errorMessage = error.response ? error.response.data : error.message;

    res.status(500).json({ message: "Error creating template", error: errorMessage });
  }
};
const getMessageTemplates = async (req, res) => {
  const { wabaID, x_access_token } = req.query;

  try {
    const response = await axios.get(
      `https://interakt-amped-express.azurewebsites.net/api/v17.0/${wabaID}/message_templates`,
      {
        headers: {
          "x-access-token": x_access_token,
          "x-waba-id": wabaID,
          "Content-Type": "application/json",
        },
      }
    );

    // Filter templates where status is "APPROVED" and return their IDs
    const approvedTemplateIDs = response.data.data
      .filter(template => template.status === "APPROVED")
      .map(template => template.id);

    // Return both the approvedTemplateIDs and the original response data
    res.status(200).json({
      approvedTemplateIDs,
      responseData: response.data
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const sendMessage = async (req, res) => {
  // const { wabaID, x_access_token, phone_number_id } = req.query;
  const payload =  {
    messaging_product: "whatsapp",
    to: "919522189879",
    type: "text",
    text: {
      body: "hii"  // Message content
    }
  };

  // const template = await Template.findOne({ _id: templateId });
  //   if (!template) {
  //     return res.status(404).json({ message: 'Template not found' });
  //   }
  //   if(template){

  //     console.log("line no 167",template)
  //     // const existingKeys = await KeyAttribute.find({ key: { $in: contactAttributes.map(attr => attr.key) } }).select('key');
  //     // console.log(existingKeys)
    
  //     for(let i=0;i<contact.length;i++){
  //       const payload =  {
  //         messaging_product: "whatsapp",
  //         to: contact[i],
  //         type: "text",
  //         text: {
  //           body: "hii"  
  //         }
  //       };
  //       let datares = await axios.post(
  //         `https://interakt-amped-express.azurewebsites.net/api/v17.0/331012110095607/messages`,
  //         payload,
  //         {
  //           headers: {
  //             "x-access-token": process.env.ACCESS_TOKEN,
  //             "x-waba-id": process.env.WABA_ID,
  //             "Content-Type": "application/json",
  //           },
  //         }
  //       );
  //       console.log(datares.status)
  //     }
  //     res.status(201).json({ message: 'Template scheduled successfully'});

  //   }
  try {
    const response = await axios.post(
      `https://interakt-amped-express.azurewebsites.net/api/v17.0/331012110095607/messages`,
      payload,
      {
        headers: {
          "x-access-token": process.env.ACCESS_TOKEN,
          "x-waba-id": process.env.WABA_ID,
          "Content-Type": "application/json",
        },
      }
    );
    res.status(200).json(response.data);
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ message: err.message });
  }
};



const updateContact = async (req, res) => {
  try {
    const { _id } = req.params;
    const updatedData = req.body;
    console.log(updatedData,_id)


    const updatedContact = await Contact.findOneAndUpdate({ _id:_id }, { $set: updatedData }, 
      { new: true, runValidators: true });

    if (!updatedContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.status(200).json(updatedContact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteContactAttribute = async (req, res) => {
  try {
    const { userId, phone, key } = req.params;

    // Find the contact with the specific userId and phone
    const contact = await Contact.findOne({ phone, userId }).select('contactAttributes');
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Check if the attribute exists
    const attributeExists = contact.contactAttributes.some(attr => attr.key === key);
    if (!attributeExists) {
      return res.status(404).json({ error: `Attribute '${key}' not found` });
    }

    // Remove the specific attribute
    contact.contactAttributes = contact.contactAttributes.filter(attr => attr.key !== key);

    // Save the contact after modification
    await contact.save();

    res.status(200).json({ message: `Contact attribute '${key}' deleted`, contact });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const deleteContact = async (req, res) => {
  try {
    const { phone } = req.params;

    const deletedContact = await Contact.findOneAndDelete({ phone });
    if (!deletedContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.status(200).json({ message: 'Contact deleted', deletedContact });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteAllContacts = async (req, res) => {
  try {
    await Contact.deleteMany({});
    res.status(200).json({ message: 'All contacts deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({});
    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getContactByPhone = async (req, res) => {
  try {
    const { phone } = req.params;
    const contact = await Contact.findOne({ phone });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.status(200).json(contact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getContactsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const contacts = await Contact.find({ userId });
    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllContactAttributesByUserId = async (req, res) => {
  try {
    const { userId } = req.query;

    // Log the received userId for debugging
    console.log('Received userId:', userId);

    if (!userId) {
      return res.status(400).json({ message: 'userId is required in query parameters' });
    }

    // Find all contacts for the given userId and return only the contactAttributes field
    const contacts = await Contact.find({ userId })
    console.log(contacts)

    // Log the retrieved contacts for debugging
    console.log('Contacts found:', contacts);

    if (!contacts || contacts.length === 0) {
      return res.status(404).json({ message: 'No contacts found for this user' });
    }

    // Extract contactAttributes from each contact and put them in an array
    const allContactAttributes = contacts.map(contact => contact.contactAttributes).flat();

    res.status(200).json({ contactAttributes: allContactAttributes });
  } catch (error) {
    console.error('Error in fetching contacts:', error);
    res.status(500).json({ error: error.message });
  }
};

const getAllUniqueAttributes = async (req, res) => {
  try {
    // Retrieve all key attributes from the KeyAttribute model
    const uniqueAttributes = await KeyAttribute.find({}).select('key value');

    // Check if no attributes are found
    if (uniqueAttributes.length === 0) {
      return res.status(404).json({ message: 'No unique attributes found' });
    }

    // Return the list of unique attributes
    res.status(200).json({ uniqueAttributes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateBroadcast = async (req, res) => {
  const { broadcastId } = req.params; // Get broadcast ID from URL params
  const { newScheduleTime, newBroadcastName } = req.body; // Get new schedule time and new broadcast name from request body

  try {
    // Find the broadcast by ID
    const broadcast = await TemplateSchedule.findById(broadcastId);

    // If broadcast not found, return 404 error
    if (!broadcast) {
      return res.status(404).json({ message: 'Broadcast not found' });
    }

    // Check if the status is 'pending'
    if (broadcast.status !== 'scheduled') {
      return res.status(400).json({ message: 'Can only update broadcasts with status "scheduled"' });
    }

    // Update scheduleTime and broadcastName if the status is 'pending'
    const updatedBroadcast = await TemplateSchedule.findByIdAndUpdate(
      broadcastId,
      {
        scheduleTime: newScheduleTime,
        broadcastName: newBroadcastName
      },
      { new: true } // Return the updated document
    );

    // Respond with success message and updated document
    return res.status(200).json({
      message: 'Schedule time and broadcast name updated successfully',
      updatedBroadcast
    });
  } catch (error) {
    // Handle errors during the update process
    return res.status(500).json({
      message: 'Error updating broadcast',
      error: error.message
    });
  }
};

const deleteBroadcast = async (req, res) => {
  const { broadcastId } = req.params; // Get broadcast ID from URL parameters

  try {
    // Find the broadcast by ID and delete it
    const deletedBroadcast = await TemplateSchedule.findByIdAndDelete(broadcastId);

    // If the broadcast is not found, return a 404 error
    if (!deletedBroadcast) {
      return res.status(404).json({ message: 'Broadcast not found' });
    }

    // If the broadcast was deleted, return a success message
    return res.status(200).json({ message: 'Broadcast deleted successfully' });
  } catch (error) {
    // Handle errors during the delete process
    return res.status(500).json({ message: 'Error deleting broadcast', error: error.message });
  }
};
module.exports = {
  createTemplate,
  scheduleTemplate,
  getAnalytics,
  createContact,
  getTemplateAnalytics,
  getMessageTemplates,
  sendMessage,
  updateContact,
  deleteContactAttribute,
  deleteContact,
  deleteAllContacts,
  getAllContacts,
  getContactByPhone,
  getContactsByUser,
  getAllContactAttributesByUserId,
  getAllUniqueAttributes,
  updateBroadcast,
  deleteBroadcast,
  createContactsBulk
};

