// routes/templateRouter.js
const express = require('express');
const templateController = require('../Controllar/template.controllar');
const { protect } = require('../Midelware/protact');
const templateRouter = express.Router();
// get api start 
const multer = require('multer');
const path = require('path');
const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');
const fs = require('fs');
require('dotenv').config();

// Azure Blob Storage configuration from .env
const AZURE_STORAGE_ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const AZURE_STORAGE_ACCOUNT_KEY = process.env.AZURE_STORAGE_ACCOUNT_KEY;
const AZURE_STORAGE_CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME;

// Set up Azure Blob Service Client
const sharedKeyCredential = new StorageSharedKeyCredential(AZURE_STORAGE_ACCOUNT_NAME, AZURE_STORAGE_ACCOUNT_KEY);
const blobServiceClient = new BlobServiceClient(
  `https://${AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
  sharedKeyCredential
);
// Multer configuration for file uploads (temporary storage in 'uploads' folder)
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    // Use the original name for storage
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });
// Sample data structure to hold uploaded images info (you can replace this with a database)
let uploadedImages = [];

function sanitizeBlobName(name) {
  // Replace invalid characters with underscores or remove them
  return name.replace(/[<>:"\/\\|?*\x00-\x1F]/g, '_'); // Replaces invalid characters with an underscore
}

// Route to handle file upload and upload it to Azure Blob Storage
templateRouter.post('/uploadfile', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    // Get the uploaded file path and sanitize the blob name
    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    const blobName = sanitizeBlobName(req.file.originalname);

    // Determine the content type based on file extension
    let contentType;
    if (fileExtension === '.jpg' || fileExtension === '.jpeg' || fileExtension === '.png') {
      contentType = 'image/jpeg';
    } else if (fileExtension === '.gif') {
      contentType = 'image/gif';
    } else if (fileExtension === '.mp4') {
      contentType = 'video/mp4';
    } else if (fileExtension === '.pdf') {
      contentType = 'application/pdf';
    } else if (fileExtension === '.doc' || fileExtension === '.docx') {
      contentType = 'application/msword';
    } else {
      contentType = req.file.mimetype; // Fallback to detected MIME type
    }

    // Get the container client for Azure Blob Storage
    const containerClient = blobServiceClient.getContainerClient(AZURE_STORAGE_CONTAINER_NAME);
    await containerClient.createIfNotExists();

    // Get the block blob client and upload the file to Azure Blob Storage
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadFile(filePath, {
      blobHTTPHeaders: { blobContentType: contentType },
    });

    // Optionally, delete the file from local storage after upload
    fs.unlinkSync(filePath); // Deletes the file after successful upload

    // Save the uploaded file data (for example, in memory or database)
    const uploadedFileData = {
      fileName: blobName,
      fileUrl: blockBlobClient.url,
    };

    // Send the URL of the uploaded blob to the user
    res.status(200).send({
      message: 'File uploaded successfully!',
      fileUrl: blockBlobClient.url,
      fileType: contentType,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).send('Error uploading file.');
  }
});


templateRouter.get('/template_analytics', templateController.getTemplateAnalytics);
templateRouter.get('/message_templates', templateController.getMessageTemplates);
templateRouter.get('/analytics', templateController.getAnalytics);
templateRouter.get('/contacts', templateController.getAllContacts);
templateRouter.get('/contacts/:phone', templateController.getContactByPhone);
templateRouter.get('/contacts/user/:userId', templateController.getContactsByUser);
templateRouter.get('/all-attributes', templateController.getAllContactAttributesByUserId);
templateRouter.get('/unique-attributes',templateController.getAllUniqueAttributes);
templateRouter.get('/getBroadcast/:userId',templateController.getBroadcast);
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
templateRouter.delete('/contacts/:Id', templateController.deleteContact);
templateRouter.delete('/contacts', templateController.deleteAllContacts);
templateRouter.delete('/delete_broadcast/:broadcastId', templateController.deleteBroadcast)
module.exports = templateRouter;



  
