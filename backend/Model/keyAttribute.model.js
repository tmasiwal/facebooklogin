const mongoose = require('mongoose');

// Define the KeyAttribute schema
const keyAttributeSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },  // Enforcing unique constraint on key
  value: { type: String, required: true }
});

const KeyAttribute = mongoose.model('KeyAttribute', keyAttributeSchema);

module.exports = KeyAttribute;
