

// controllers/templateController.js
const Template = require('../Model/templent.model');
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

   

    let { start, end, granularity ="DAILY", template_ids } = req.query;
    if (typeof template_ids === 'string') {
  template_ids = JSON.parse(template_ids);
}

// Join the array into a string
template_ids = template_ids.join(',');
    const fields = `template_analytics.start(${start}).end(${end}).granularity(${granularity}).template_ids(${template_ids})`;


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


   

    const data = response.data["template_analytics"].data[0];

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

    const contact = new Contact({
      userId,
      name,
      phone,
      broadcast,
      sms,
      contactAttributes
    });

    await contact.save();
    res.status(201).json(contact);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const scheduleTemplate = async (req, res) => {
  try {
    const { templateName, scheduleTime } = req.body;

    // Find the template by name
    const template = await Template.findOne({ name: templateName });
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Create a new schedule for the template
    const newSchedule = new TemplateSchedule({
      templateId: template._id,
      scheduleTime: new Date(scheduleTime)
    });

    await newSchedule.save();

    res.status(201).json({ message: 'Template scheduled successfully', schedule: newSchedule });
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
  const { wabaID, x_access_token, phone_number_id } = req.query;
  const payload = req.body;

  try {
    const response = await axios.post(
      `https://interakt-amped-express.azurewebsites.net/api/v17.0/${phone_number_id}/messages`,
      payload,
      {
        headers: {
          "x-access-token": x_access_token,
          "x-waba-id": wabaID,
          "Content-Type": "application/json",
        },
      }
    );
    res.status(200).json(response.data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};




const updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const updatedContact = await Contact.findOneAndUpdate({ id }, updatedData, { new: true });
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
    const { phone, key } = req.params;

    const contact = await Contact.findOne({ phone });
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    contact.contactAttributes = contact.contactAttributes.filter(attr => attr.key !== key);
    await contact.save();

    res.status(200).json({ message: 'Contact attribute deleted', contact });
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
  getContactsByUser
};

