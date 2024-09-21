const jwt = require('jsonwebtoken');
const User = require('../Model/user.model');

const protect = async (req, res, next) => {
   
//   console.log(req.headers)
    if (req.headers.authorization ) {
        try {
            token = req.headers.authorization// Extract token from header
            // const decoded = jwt.verify(token, "thisisjwttokenwewiluse"); // Verify token

            // // Find the user by ID (the ID is stored in the token)
            // req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }else{
        res.status(401).json({ message: 'Not authorized, no token' });
    }

    // if (!token) {
    //    
    // }
};

module.exports = { protect };
