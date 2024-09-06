const {User}= require("../Model/user.model")
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, "thisisjwttokenwewiluse", {
      expiresIn: '30d', // Set token expiry
  });
};

// Create data
const Login=async (req, res) => {
  try {
    const newData = new Data(req.body);
    await newData.save();
    res.status(200).json(newData);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
// Create data
const Update= async (req, res) => {
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
};

// Get all data
const Clients= async (req, res) => {
  const { username, password } = req.query;
  try {
    const allData = await Data.findOne({ username: username });
    res.status(200).json(allData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  
  try {
      const userExists = await User.findOne({ email });
      if (userExists) {
          return res.status(400).json({ message: 'User already exists' });
      }
      
      const user = await User.create({
          name,
          email,
          password
      });
      
      res.status(201).json({
          _id: user._id,
          name: user.name,
          email: user.email,
      });
  } catch (error) {
      res.status(500).json({ message: 'Error registering user', error });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
      const user = await User.findOne({ email });
      
      if (user && (await user.matchPassword(password))) {
          res.json({
              _id: user._id,
              name: user.name,
              email: user.email,
              token: generateToken(user._id),  // Send the JWT token in the response
          });
      } else {
          res.status(401).json({ message: 'Invalid email or password' });
      }
  } catch (error) {
      res.status(500).json({ message: 'Error logging in user', error });
  }
};

module.exports={Login,Update,Clients,registerUser,loginUser}