const {Task} =require("../Model/task.model")


const ScheduleTask = async (req, res) =>{
const { username, action, time } = req.body;

try {
  const newTask = new Task({
    username,
    action,
    scheduledTime: new Date(time),
    status: "pending",
  });
  await newTask.save();
  res.status(200).json({ message: "Task scheduled", task: newTask });
} catch (err) {
  res.status(400).json({ message: err.message });
}
}


const CanceleTask = async (req, res) =>{
    const { username, action } = req.body;

    try {
      const task = await Task.findOne({
        username,
        action,
        status: "pending",
      });

      if (task) {
        task.status = "canceled";
        await task.save();
        res.status(200).json({ message: "Task canceled" });
      } else {
        res.status(404).json({ message: "No pending task found to cancel" });
      }
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
}


module.exports ={ScheduleTask,CanceleTask}