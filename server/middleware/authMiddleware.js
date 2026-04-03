const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user in the database
      const currentUser = await User.findById(decoded.id).select('-password');

      // 🚨 CRITICAL FIX: If the DB was cleared but the browser still has a token, block it!
      if (!currentUser) {
        return res.status(401).json({ message: 'User no longer exists. Please log out and log in again.' });
      }

      // Attach valid user to request and proceed
      req.user = currentUser;
      return next(); 

    } catch (error) {
      console.error("Token Verification Failed:", error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };