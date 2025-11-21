// const jwt = require("jsonwebtoken");
// const User = require('../models/user')

// const protect = (req, res, next) => {
//   const authHeader = req.headers.authorization || "";
//   if (!authHeader.startsWith("Bearer ")) {
//     return res.status(401).json({ message: "No token, authorization denied" });
//   }

//   const token = authHeader.split(" ")[1];

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     next();
//   } catch {
//     res.status(403).json({ message: "Invalid or expired token" });
//   }
// };

// const authorizeRoles = async (req, res, next) => {
//   if (!req.user.role) {
//     return res.status(403).json({ message: "Access denied" });
//   }
//   const user = await User.findOne({_id: req.user.id});
//   if(req.user.isPremiumUser){
//     next()
//   }
//   console.log("prmium user is "+ req.user)
//   // return res.status(200).json({"requser":req.user});
//   return res.status(403).json({ message: "This service is only for premium users Access denied" });
// };

// module.exports = { protect, authorizeRoles };
const jwt = require("jsonwebtoken");
const User = require('../models/user');

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(403).json({ message: "Invalid or expired token" });
  }
};

const requirePremium = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user && user.isPremiumUser) {
      return next();
    }
    return res.status(403).json({
      message: "This service is only for premium users. Access denied."
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { protect, requirePremium };