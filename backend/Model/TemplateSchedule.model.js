const mongoose = require('mongoose');

// Define the TemplateSchedule schema
const TemplateScheduleSchema = new mongoose.Schema({
  templateId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Template', required: true }],
  scheduleTime: { type: Date, required: true },
  status: { type: String, enum: ['scheduled', 'completed', 'failed'], default: 'scheduled' },
  createdAt: { type: Date, default: Date.now }
});

// Create the model
const TemplateSchedule = mongoose.model('TemplateSchedule', TemplateScheduleSchema);

module.exports = TemplateSchedule;
