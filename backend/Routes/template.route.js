// routes/templateRouter.js
const express = require('express');
const templateController = require('../Controllar/template.controllar');

const templateRouter = express.Router();
// get api start 

templateRouter.get('/template_analytics', templateController.getTemplateAnalytics);
templateRouter.get('/message_templates', templateController.getMessageTemplates);
templateRouter.post('/createtemplete', templateController.createTemplate);
templateRouter.get('/analytics', templateController.getAnalytics);
templateRouter.get('/contacts', templateController.getAllContacts);
templateRouter.get('/contacts/:phone', templateController.getContactByPhone);
templateRouter.get('/contacts/user/:userId', templateController.getContactsByUser);
// post api start 
templateRouter.post('/schedule', templateController.scheduleTemplate);
templateRouter.post('/contacts', templateController.createContact);
templateRouter.post('/message_send', templateController.sendMessage );
// put api start 

templateRouter.put('/contacts/:id',templateController.updateContact);

// delete api start 

templateRouter.delete('/contacts/:phone/attributes/:key', templateController.deleteContactAttribute);
templateRouter.delete('/contacts/:phone', templateController.deleteContact);
templateRouter.delete('/contacts', templateController.deleteAllContacts);
module.exports = templateRouter;



  
