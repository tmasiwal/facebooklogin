// routes/templateRouter.js
const express = require('express');
const templateController = require('../Controllar/template.controllar');

const templateRouter = express.Router();

templateRouter.post('/createtemplete', templateController.createTemplate);
templateRouter.post('/schedule', templateController.scheduleTemplate);
templateRouter.get('/analytics', templateController.getAnalytics);
templateRouter.post('/contacts', templateController.createContact);
templateRouter.get('/template_analytics', templateController.getTemplateAnalytics);
templateRouter.get('/message_templates', templateController.getMessageTemplates);
templateRouter.post('/message_send', templateController.sendMessage );
module.exports = templateRouter;



  
