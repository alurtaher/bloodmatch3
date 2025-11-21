const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const path = require('path')

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const getStartPage = (req, res, next) => {
  res.sendFile(path.join(__dirname, "../", "public", "views", "start.html"));
};

const getDashboardPage = (req, res, next) => {
  res.sendFile(path.join(__dirname, "../", "public", "views", "dashboard.html"));
};

const getSignupPage = (req, res, next) => {
  res.sendFile(path.join(__dirname, "../", "public", "views", "signup.html"));
};

const getLoginPage = (req, res, next) => {
  res.sendFile(path.join(__dirname, "../", "public", "views", "login.html"));
};

const registerUser = async (req, res) => {
  try {
    const { name, email,phonenumber, password, role, bloodGroup, location } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists please login" });

    if (
      !location ||
      location.type !== "Point" ||
      !Array.isArray(location.coordinates) ||
      location.coordinates.length !== 2
    ) {
      return res.status(400).json({ message: "Invalid location format" });
    }

    const user = await User.create({
      name,
      phonenumber,
      email,
      password,
      role,
      bloodGroup,
      location,
    });

    res.status(201).json({
      token: generateToken(user._id, user.role),
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        location: user.location,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

  res.json({
    token: generateToken(user._id, user.role),
    user: { id: user._id, name: user.name, role: user.role, location: user.location },
  });
};

module.exports = {getSignupPage,getStartPage,registerUser,getLoginPage, loginUser,getDashboardPage};