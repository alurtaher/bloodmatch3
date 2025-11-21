const express = require("express");
const { protect } = require("../middleware/auth");
const { getProfile,getProfileData,updateProfile} = require("../controllers/profileController");

const router = express.Router();

router.get("/", getProfile);

// GET logged-in user data
router.get("/data", protect, getProfileData);

router.put("/update", protect, updateProfile);

module.exports = router;