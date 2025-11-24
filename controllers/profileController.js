const User = require("../models/user");
const path = require('path');

// Serve the profile page
const getProfile = (req, res, next) => {
  res.sendFile(path.join(__dirname, "../", "public", "views", "profile.html"));
};

// Get current user data (excluding password)
const getProfileData = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Server error fetching user data" });
  }
};

// Update user profile (including phonenumber)
const updateProfile = async (req, res) => {
  try {
    const { name, bloodGroup, location, phonenumber } = req.body;

    // Build update object dynamically (only include provided fields)
    const updates = {};

    if (name?.trim()) updates.name = name.trim();
    if (bloodGroup) updates.bloodGroup = bloodGroup;

    // Validate and update phonenumber
    if (phonenumber !== undefined) {
      const phoneStr = phonenumber.toString().trim();
      if (!phoneStr) {
        return res.status(400).json({ message: "Phone number cannot be empty" });
      }
      if (!/^\d{10}$/.test(phoneStr)) {
        return res.status(400).json({ message: "Phone number must be exactly 10 digits" });
      }
      updates.phonenumber = Number(phoneStr);
    }

    // Validate location if provided
    if (location) {
      if (
        !location.type ||
        location.type !== "Point" ||
        !Array.isArray(location.coordinates) ||
        location.coordinates.length !== 2 ||
        typeof location.coordinates[0] !== "number" ||
        typeof location.coordinates[1] !== "number"
      ) {
        return res.status(400).json({ message: "Invalid location format. Must be { type: 'Point', coordinates: [lng, lat] }" });
      }
      updates.location = {
        type: "Point",
        coordinates: location.coordinates
      };
    }

    // If no valid fields to update
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields provided to update" });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    });

  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error updating profile",
      error: error.message 
    });
  }
};

module.exports = { 
  getProfile, 
  getProfileData, 
  updateProfile 
};