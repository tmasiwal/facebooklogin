// Import dependencies
const express = require("express");
const mongoose = require("mongoose");
const TemplateSchedule = require("./Model/TemplateSchedule.model");
const cron = require("node-cron");
const Template = require("./Model/templent.model");
var cors = require("cors");
require("dotenv").config();
const axios = require("axios");

const { Task } = require("./Model/task.model");
// Create Express app
const app = express();
app.use(cors());
// Middleware
app.use(express.json());
const Contact = require("./Model/contact.model");
// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
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

// // Create a model
const Data = mongoose.model("onboarding", dataSchema);

// Routes
const userRouter = require("./Routes/user.router");
const taskRouter = require("./Routes/task.router");
const templateRouter = require("./Routes/template.route");
const {
  sendMessagesToSelectedContacts,
} = require("./Controllar/task.controllar");
app.use("/user", userRouter);
app.use("/task", taskRouter);
app.use("/template", templateRouter);
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

app.post("/tp_signup", async (req, res) => {
  const { x_access_token } = req.query;
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

async function sendWhatsAppMessage(contact, messageBody) {
  const payload = {
    messaging_product: "whatsapp",
    to: contact,
    type: "text",
    text: {
      body: messageBody,
    },
  };

  try {
    const response = await axios.post(
      `https://interakt-amped-express.azurewebsites.net/api/v17.0/331012110095607/messages`,
      payload,
      {
        headers: {
          "x-access-token": process.env.ACCESS_TOKEN,
          "x-waba-id": process.env.WABA_ID,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`Message sent to ${contact}: Status ${response.status}`);
    return true;
  } catch (error) {
    console.error(`Failed to send message to ${contact}:`, error.message);
    return false;
  }
}

// Cron job that runs every minute to process scheduled broadcasts
cron.schedule("* * * * *", async () => {
  console.log("Checking for scheduled broadcasts...");

  function formatDateToIST(date) {
    // Convert to Indian Standard Time (IST)
    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    };

    // Format date in IST
    const istDate = new Intl.DateTimeFormat("en-GB", options).format(date);

    // Reformat to desired ISO-like format
    const [day, month, year, hour, minute] = istDate.split(/[\s,/:]+/);
    return `${year}-${month}-${day}T${hour}:${minute}`;
  }

  const now = new Date();
  console.log(formatDateToIST(now));
  try {
    // Find all broadcasts that are scheduled to be sent and haven't been completed yet
    const broadcasts = await TemplateSchedule.find({
      status: "scheduled",
      scheduleTime: formatDateToIST(now),
    });

    console.log(broadcasts);
    if (broadcasts.length === 0) {
      console.log("No broadcasts to process");
      return;
    }

    // Loop through each broadcast
    for (const broadcast of broadcasts) {
      // Example usage
      // const templateId = '1308823763449725';
      // const contactIds = ['66dfcbc855f7ef388357b287', '66dc0462fb45e45d4986bd1b']; // Replace with actual contact IDs
      // const attributes = {
      //   header: ['https://brodcastwatsapp.blob.core.windows.net/tempateimage/newvdeo.mp4'], // Header key or default value

      //   // Body keys or default values
      //   body: ['Pankaj'],
      // };

      // let result = sendMessagesToSelectedContacts(templateId, contactIds, attributes);

      let result = await sendMessagesToSelectedContacts(
        broadcast.templateId,
        broadcast.contactId,
        broadcast.attributes
      );
      if (result) {
        broadcast.status = "completed";
        await broadcast.save();
        console.log(`Broadcast ${broadcast._id} marked as completed`);
      } else {
        continue;
      }
    }
  } catch (error) {
    console.error("Error processing broadcasts:", error.message);
  }
});

app.all("*", (req, res) => {
  res.send("no route found");
});
// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
