const mongoose = require('mongoose');

const contactAttributeSchema = new mongoose.Schema({
  key: { type: String, required: true },
  value: { type: String, required: true }
});

const contactSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  dateCreated: { type: Date, default: Date.now },
  broadcast: { type: Boolean, default: false },
  sms: { type: Boolean, default: false },
  contactAttributes: [contactAttributeSchema]
});

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;
