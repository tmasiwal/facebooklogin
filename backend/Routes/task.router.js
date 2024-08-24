const express = require("express");
const {ScheduleTask,CanceleTask}= require("../Controllar/task.controllar")

const router = express.Router();


router.report("/scheduleTask").post(ScheduleTask);
router.report("/canceledTask").post(CanceleTask);

 module.exports = router;