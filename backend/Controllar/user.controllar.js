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
    const newData = new User(req.body);
    await newData.save();
    res.status(200).json(newData);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
// Create data
const Update= async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    console.log(user);
    if (user) {
      if (req.body.password == user.password) {
        await User.updateOne(
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
    const allData = await User.findOne({ username: username });
    res.status(200).json(allData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if email or username already exists
    const emailExists = await User.findOne({ email });
    const usernameExists = await User.findOne({ username });

    if (emailExists) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    if (usernameExists) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Create a new user
    const user = await User.create({
      username,
      email,
      password,
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: 'Error registering user', error });
  }
};


const loginUser = async (req, res) => {
  const { identifier, password } = req.body;

  try {
    // Find the user by email or username
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (user && (await user.matchPassword(password))) {
      const userResponse = { ...user._doc }; // Extract the Mongoose document
      delete userResponse.password;

      res.status(200).json({
        ...userResponse,
        token: generateToken(user._id), // Include the JWT token
      });
    } else {
      res.status(401).json({ message: "Invalid email/username or password" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Error logging in user", error });
  }
};




module.exports={Login,Update,Clients,registerUser,loginUser}

