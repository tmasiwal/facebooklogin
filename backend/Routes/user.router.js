// const express = require("express");
// const {Login,Update,Clients,registerUser,loginUser}= require("../Controllar/user.controllar")
const express = require('express');
const { registerUser, loginUser ,Clients} = require('../Controllar/user.controllar');
const router = express.Router();

// Register Route
router.post('/register', registerUser);

// Login Route
router.post('/login', loginUser);
router.get('/clients', Clients);

module.exports = router;
