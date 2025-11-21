const User = require("../models/user");
const path = require('path')

const getProfile = (req, res, next) => {
  res.sendFile(path.join(__dirname, "../", "public", "views", "profile.html"));
};

const getProfileData = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Server error fetching user data" });
  }
};

const updateProfile =  async (req, res) => {
  try {
    const { name, bloodGroup, location } = req.body;

    // Validate location format if provided
    if (location) {
      if (
        location.type !== "Point" ||
        !Array.isArray(location.coordinates) ||
        location.coordinates.length !== 2
      ) {
        return res.status(400).json({ message: "Invalid location format" });
      }
    }

    // Find user by id and update allowed fields
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { 
        ...(name && { name }),
        ...(bloodGroup && { bloodGroup }),
        ...(location && { location })
      },
      { new: true } // Return the updated document
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error updating profile" });
  }
};

module.exports = { getProfile,getProfileData,updateProfile};

// const findNearbyDonors = async(req, res) => {
//   try {
//     let { longitude, latitude, bloodGroup, maxDistance } = req.query;
//     if (!longitude || !latitude || !bloodGroup) {
//       return res.status(400).json({ error: "Missing query parameters" });
//     }
//     longitude = parseFloat(longitude);
//     latitude = parseFloat(latitude);
//     maxDistance = parseInt(maxDistance) || 10000; // default 10km

//     const donors = await User.find({
//       role: "donor",
//       bloodGroup,
//       location: {
//         $near: {
//           $geometry: { type: "Point", coordinates: [longitude, latitude] },
//           $maxDistance: maxDistance,
//         },
//       },
//     }).select("name bloodGroup location email");

//     res.json(donors);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to fetch nearby donors" });
//   }
// };