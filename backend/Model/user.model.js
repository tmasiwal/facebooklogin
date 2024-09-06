const mongoose = require("mongoose");
// const Schema = mongoose.Schema;
// const dataSchema = new Schema({
//   username: String,
//   password: String,
//   email: String,
//   data: Object,
// });

// Create a model
// const User = mongoose.model("onboarding", dataSchema);

const bcrypt = require('bcrypt');

// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    data: { type: Object},
}, { timestamps: true });

// Password Hashing
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
// module.exports = User;
module.exports ={User}