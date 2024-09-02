const mongoose = require('mongoose');

// Define the example schema for header and body examples
const ExampleSchema = new mongoose.Schema({
  header_text: [String],
  body_text: [[String]]
});

// Define the component schema
const ComponentSchema = new mongoose.Schema({
  type: { type: String, required: true },
  format: { type: String },
  text: { type: String, required: true },
  example: ExampleSchema
});

// Define the main template schema
const TemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  language: { type: String, required: true },
  category: { type: String, required: true },
  components: { type: [ComponentSchema], required: true }
});

// Create the model
const Template = mongoose.model('Template', TemplateSchema);

module.exports = Template;
