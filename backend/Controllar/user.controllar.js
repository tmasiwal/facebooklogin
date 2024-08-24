const {User}= require("../Model/user.model")

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


module.exports={Login,Update,Clients}