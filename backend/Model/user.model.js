const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const dataSchema = new Schema({
  username: String,
  password: String,
  email: String,
  data: Object,
});

// Create a model
const User = mongoose.model("onboarding", dataSchema);


module.exports ={User}