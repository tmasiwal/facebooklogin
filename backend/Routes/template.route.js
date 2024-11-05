// routes/templateRouter.js
const express = require('express');
const templateController = require('../Controllar/template.controllar');
const { protect } = require('../Midelware/protact');
const templateRouter = express.Router();
// get api start 

templateRouter.get('/template_analytics', templateController.getTemplateAnalytics);
templateRouter.get('/message_templates', templateController.getMessageTemplates);
templateRouter.get('/analytics', templateController.getAnalytics);
templateRouter.get('/contacts', templateController.getAllContacts);
templateRouter.get('/contacts/:phone', templateController.getContactByPhone);
templateRouter.get('/contacts/user/:userId', templateController.getContactsByUser);
templateRouter.get('/all-attributes', templateController.getAllContactAttributesByUserId);
templateRouter.get('/unique-attributes',templateController.getAllUniqueAttributes);
// post api start 
templateRouter.post('/createtemplete', templateController.createTemplate);
templateRouter.post('/schedule', templateController.scheduleTemplate);
templateRouter.post('/contacts', templateController.createContact);
templateRouter.post('/bulkContacts', templateController.createContactsBulk);
templateRouter.post('/message_send', templateController.sendMessage );
// put api start 

templateRouter.put('/updatecontact/:_id',templateController.updateContact);
templateRouter.put('/update_schedule/:broadcastId',templateController.updateBroadcast);

// delete api start 

templateRouter.delete('/contacts/:userId/:phone/attributes/:key', templateController.deleteContactAttribute);
templateRouter.delete('/contacts/:phone', templateController.deleteContact);
templateRouter.delete('/contacts', templateController.deleteAllContacts);
templateRouter.delete('/delete_broadcast/:broadcastId', templateController.deleteBroadcast)
module.exports = templateRouter;



  
