const mongoose= require("mongoose")
const taskSchema = new mongoose.Schema({
  userId: String,
  action: String,
  scheduledTime: Date,
  status: { type: String, default: "pending" }, // 'pending', 'completed', 'canceled'
});

const Task = mongoose.model("Task", taskSchema);

 module.exports ={Task}
