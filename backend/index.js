// Import dependencies
const express = require("express");
const mongoose = require("mongoose");
var cors = require("cors");
require("dotenv").config();

// Create Express app
const app = express();
app.use(cors());
// Middleware
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Define a schema
const Schema = mongoose.Schema;
const dataSchema = new Schema({
  name: String,
  data: Object,
});

// Create a model
const Data = mongoose.model("onboarding", dataSchema);

// Routes
// Create data
app.post("/login", async (req, res) => {
  try {
    const newData = new Data(req.body);
    await newData.save();
    res.status(201).json(newData);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all data
app.get("/clients", async (req, res) => {
  try {
    const allData = await Data.find();
    res.json(allData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
