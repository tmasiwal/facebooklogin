

// controllers/templateController.js
const Template = require('../Model/templent.model');
const axios = require('axios');
const TemplateSchedule = require('../Model/TemplateSchedule.model');
const Contact = require('../Model/contact.model');

const getTemplateAnalytics = async (req, res) => {
  const { wabaID, x_access_token, start, end, granularity = "DAILY", template_ids } = req.query;

  try {
    const response = await axios.get(
      `https://interakt-amped-express.azurewebsites.net/api/v17.0/308727328997268?fields=template_analytics.start(${start}).end(${end}).granularity(${granularity}).template_ids${template_ids.join(",")})`,
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

const getAnalytics = async (req, res) => {
  try {
    const { template_analytics, start, end, granularity, template_ids } = req.query;
    const fields = `${template_analytics}.start(${start}).end(${end}).granularity(${granularity}).template_ids(${template_ids})`;

    const response = await axios.get('https://interakt-amped-express.azurewebsites.net/api/v17.0/308727328997268', {
      headers: {
        "x-waba-id": "308727328997268",
        "x-access-token": "7SFRQSvyqow0hNMOGRkzSAoA5Prwh6JU",
        "Content-Type": "application/json",
      },
      params: { fields },
    });

    const data = response.data[template_analytics].data[0];
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
    const contactData = req.body;
    const newContact = new Contact(contactData);
    await newContact.save();
    res.status(201).json(newContact);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    res.status(200).json(response.data);
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


module.exports = {
  createTemplate,
  scheduleTemplate,
  getAnalytics,
  createContact,
  getTemplateAnalytics,
  getMessageTemplates,
  sendMessage
};

