const express = require("express");
const {ScheduleTask,CanceleTask}= require("../Controllar/task.controllar")

const router = express.Router();


router.post("/scheduleTask", ScheduleTask); // Changed from .report() to .post()
router.post("/canceledTask", CanceleTask);  // Changed from .report() to .post()

 module.exports = router;