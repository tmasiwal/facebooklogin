const mongoose = require("mongoose");
const Contact = require("./contact.model");

// Define the TemplateSchedule schema
const TemplateScheduleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  broadcastName: { type: String, required: true },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Template",
    required: true,
  },
  contactId: [{ type: String, required: true }],
  attributes: [
    {
      key: { type: String}, 
      value: { type: [{ type: String}]}, 
    },
  ],
  scheduleTime: { type: String, required: true },
  status: {
    type: String,
    enum: ["scheduled", "completed", "failed"],
    default: "scheduled",
  },
  createdAt: { type: Date, default: Date.now() },
});

// Create the model
const TemplateSchedule = mongoose.model(
  "TemplateSchedule",
  TemplateScheduleSchema
);

module.exports = TemplateSchedule;
