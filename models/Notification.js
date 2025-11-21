const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    bloodGroup: {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    searchRole: {
      type: String,
      enum: ["donor", "recipient"],
      required: true,
    },
    maxDistance: {
      type: Number,
      default: 10000, // in meters (10 km)
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastChecked: {
      type: Date,
      default: Date.now,
    },
    emailsSent: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Index for efficient queries
notificationSchema.index({ userId: 1, isActive: 1 });
notificationSchema.index({ bloodGroup: 1, searchRole: 1 });

module.exports = mongoose.model("Notification", notificationSchema);