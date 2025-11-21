const Notification = require("../models/Notification");
const User = require("../models/user");
const path = require('path')

// Create notification alert
const createNotification = async (req, res) => {
  try {
    const { bloodGroup, searchRole, maxDistance } = req.body;
    const userId = req.user.id;

    // Validation
    if (!bloodGroup || !searchRole) {
      return res.status(400).json({ 
        error: "Blood group and search role are required" 
      });
    }

    // Validate blood group
    const validBloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    if (!validBloodGroups.includes(bloodGroup)) {
      return res.status(400).json({ 
        error: "Invalid blood group. Must be one of: " + validBloodGroups.join(", ") 
      });
    }

    // Validate search role
    if (!["donor", "recipient"].includes(searchRole)) {
      return res.status(400).json({ 
        error: "Search role must be either 'donor' or 'recipient'" 
      });
    }

    // Check if notification already exists for this user with same criteria
    const existingNotification = await Notification.findOne({
      userId,
      bloodGroup,
      searchRole,
      isActive: true,
    });

    if (existingNotification) {
      return res.status(400).json({ 
        message: "You already have an active notification for this criteria",
        notification: existingNotification
      });
    }

    // Create new notification
    const notification = await Notification.create({
      userId,
      bloodGroup,
      searchRole,
      maxDistance: maxDistance || 10000,
    });

    res.status(201).json({
      success: true,
      message: "Notification alert created successfully! You'll receive emails when matches are found.",
      notification,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ error: "Failed to create notification" });
  }
};

// Get user's active notifications
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await Notification.find({ 
      userId, 
      isActive: true 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// Get all notifications (including inactive)
const getAllUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("Error fetching all notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// Update notification
const updateNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    const { bloodGroup, searchRole, maxDistance, isActive } = req.body;

    const notification = await Notification.findOne({
      _id: notificationId,
      userId,
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    // Update fields if provided
    if (bloodGroup) notification.bloodGroup = bloodGroup;
    if (searchRole) notification.searchRole = searchRole;
    if (maxDistance) notification.maxDistance = maxDistance;
    if (typeof isActive === 'boolean') notification.isActive = isActive;

    await notification.save();

    res.json({
      success: true,
      message: "Notification updated successfully",
      notification,
    });
  } catch (error) {
    console.error("Error updating notification:", error);
    res.status(500).json({ error: "Failed to update notification" });
  }
};

// Delete notification (soft delete - set isActive to false)
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isActive: false },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
};

// Toggle notification active status
const toggleNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      _id: notificationId,
      userId,
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    notification.isActive = !notification.isActive;
    await notification.save();

    res.json({
      success: true,
      message: `Notification ${notification.isActive ? 'activated' : 'deactivated'} successfully`,
      notification,
    });
  } catch (error) {
    console.error("Error toggling notification:", error);
    res.status(500).json({ error: "Failed to toggle notification" });
  }
};

const getNotificationPage = async(req,res)=>{
    res.sendFile(path.join(__dirname, "../", "public", "views", "notifications.html"));
}

module.exports = {
  createNotification,
  getUserNotifications,
  getAllUserNotifications,
  updateNotification,
  deleteNotification,
  toggleNotification,
  getNotificationPage
};