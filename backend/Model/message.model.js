const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  phone_number_id: {
    type: String,
    required: true,
  },
  waba_id: {
    type: String,
    required: true,
  },
 broadcastId: 
  { type: mongoose.Schema.Types.ObjectId, ref: "TemplateSchedule"},
    
  
  direction: {
    type: String,
    enum: ['sent', 'received'], 
    required: true,
    default:'sent',
  },
  from: {
    type: String, 
   
  },
  to: {
    type: String, 
   
  },
  id: {
    type: String, 
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
    default: () => Date.now(),
},
status: {
    type: String,
    enum: ['sent', 'delivered', 'read',"replied", 'failed'],
    default: 'sent',
  },
  failure_reason: {
    type: String,
    default: null,
  },
  metadata: {
    type: Map,
    of: String,
  },
  
});

const MessageModel = mongoose.model('Message', MessageSchema);

module.exports = MessageModel;
