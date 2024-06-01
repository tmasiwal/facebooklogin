// Import dependencies
const express = require("express");
const mongoose = require("mongoose");
var cors = require("cors");
require("dotenv").config();
const axios = require("axios");
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
  username: String,
  password: String,
  email: String,
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
    res.status(200).json(newData);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
// Create data
app.post("/update", async (req, res) => {
  try {
    const user = await Data.findOne({ username: req.body.username });
    console.log(user);
    if (user) {
      if (req.body.password == user.password) {
        await Data.updateOne(
          { username: user.username },
          { data: req.body.data }
        );
        res.status(200).json({ message: "success" });
      } else {
        res.status(404).json({ message: "Wrong username or password" });
      }
    } else {
      res.status(400).json({ message: "no user found please Register first!" });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all data
app.get("/clients", async (req, res) => {
  const { username, password } = req.query;
  try {
    const allData = await Data.findOne({ username: username });
    res.status(200).json(allData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/message_templates", async (req, res) => {
  const { wabaID, x_access_token } = req.query; // Corrected destructuring
  try {
    const response = await axios.get(
      `https://interakt-amped-express.azurewebsites.net/api/v17.0/${wabaID}/message_templates`,
      {
        headers: {
          "x-access-token": x_access_token,
          "x-waba-id": wabaID,
          "Content-Type": "application/json",
        }, // Corrected headers
      }
    );
    res.status(200).json(response.data); // Sending response data
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.post("/message_send", async (req, res) => {
  const { wabaID, x_access_token, phone_number_id } = req.query;
  const  payload  = req.body;
  // console.log(payload);
  try {
    const response = await axios.post(
      `https://interakt-amped-express.azurewebsites.net/api/v17.0/${phone_number_id}/messages`,
      payload,
      {
        headers: {
          "x-access-token": x_access_token,
          "x-waba-id": wabaID,
          "Content-Type": "application/json",
        }, // Corrected headers
      }
    );
    res.status(200).json(response.data); // Sending response data
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/tp_signup", async (req, res) => {
  const {  x_access_token } = req.query;
  const payload = req.body;
  // console.log(payload);
  try {
    const response = await axios.post(
      `http://api.interakt.ai/v1/organizations/tp-signup/`,
      payload,
      {
        headers: {
          Authorization: x_access_token,
          
          "Content-Type": "application/json",
        }, // Corrected headers
      }
    );
    res.status(200).json(response.data); // Sending response data
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
