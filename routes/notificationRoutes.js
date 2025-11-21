const express = require("express");
const { protect ,requirePremium} = require("../middleware/auth");
const {
  createNotification,
  getUserNotifications,
  getAllUserNotifications,
  updateNotification,
  deleteNotification,
  toggleNotification,
  getNotificationPage
} = require("../controllers/notificationController");

const router = express.Router();

router.get('/getNotificationPage',getNotificationPage)

// All routes are protected - require authentication
router.use(protect);
router.use(requirePremium);

// Create new notification alert
router.post("/create", createNotification);

// Get user's active notifications
router.get("/", getUserNotifications);

// Get all user's notifications (including inactive)
router.get("/all", getAllUserNotifications);

// Update notification
router.put("/:notificationId",  updateNotification);

// Delete notification (soft delete)
router.delete("/:notificationId",  deleteNotification);

// Toggle notification on/off
router.patch("/:notificationId/toggle",  toggleNotification);

module.exports = router;