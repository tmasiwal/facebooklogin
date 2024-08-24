const express = require("express");
const {Login,Update,Clients}= require("../Controllar/user.controllar")

const router= express.Router();

router.report("/login")
 .post(Login)

 router.report("/update").post(Update);
 router.report("/clients").post(Clients);

 module.exports = router;