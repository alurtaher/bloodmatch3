const cron = require("node-cron");
const Notification = require("../models/Notification");
const User = require("../models/user");
const sendEmail = require("../utils/sendEmail");

console.log("Current server time:", new Date());

const notificationCronJob = () => {
  // Schedule to run every 30 minutes
  // For testing: "*/1 * * * *" (every minute)
  // For production: "*/30 * * * *" (every 30 minutes)
  cron.schedule("*/30 * * * *", async () => {
    try {
      const now = new Date();
      console.log(`[${now.toLocaleString()}] Running BloodMatch notification check...`);

      // Find all active notifications
      const notifications = await Notification.find({ 
        isActive: true 
      }).populate("userId");

      if (notifications.length === 0) {
        console.log("No active notifications found.");
        return;
      }

      console.log(`Found ${notifications.length} active notification(s)`);

      for (const notification of notifications) {
        const user = notification.userId;
        
        if (!user || !user.email) {
          console.log(`Skipping notification ${notification._id}: User not found or no email`);
          continue;
        }

        // Search for matching blood donors/recipients near the user's location
        const matches = await User.find({
          role: notification.searchRole, // "donor" or "recipient"
          bloodGroup: notification.bloodGroup,
          location: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: user.location.coordinates,
              },
              $maxDistance: notification.maxDistance, // in meters
            },
          },
          _id: { $ne: user._id }, // Exclude the user themselves
        })
          .limit(5)
          .select("name bloodGroup email location");

        // If matches found, send email notification
        if (matches.length > 0) {
          const roleText = notification.searchRole === "donor" ? "Donors" : "Recipients";
          
          const matchList = matches
            .map((m, i) => `<li style="margin: 8px 0;"><strong>${m.name}</strong> - Blood Group: <span style="color: #b91c1c; font-weight: bold;">${m.bloodGroup}</span></li>`)
            .join("");

          const subject = `🩸 BloodMatch Alert: ${matches.length} ${roleText} Found Nearby!`;
          
          const htmlContent = `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fef2f2; padding: 20px; border-radius: 10px;">
              <div style="background: linear-gradient(145deg, #b91c1c 0%, #1e40af 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🩸 BloodMatch</h1>
              </div>
              
              <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <h2 style="color: #b91c1c; margin-top: 0;">Hi ${user.name},</h2>
                <p style="font-size: 16px; line-height: 1.6; color: #333;">
                  Great news! We found <strong style="color: #b91c1c;">${matches.length}</strong> ${roleText.toLowerCase()} with blood group 
                  <strong style="color: #b91c1c;">${notification.bloodGroup}</strong> near your location.
                </p>
                
                <h3 style="color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px;">Matches Found:</h3>
                <ul style="line-height: 1.8; padding-left: 20px;">
                  ${matchList}
                </ul>
                
                <p style="font-size: 16px; line-height: 1.6; color: #333; margin-top: 20px;">
                  Login to BloodMatch now to view their profiles and connect with them immediately!
                </p>
                
                <div style="text-align: center; margin-top: 30px;">
                  <a href="http://localhost:3000/login" style="display: inline-block; background-color: #b91c1c; color: white; padding: 14px 40px; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 12px rgba(185, 28, 28, 0.3);">
                    View Matches Now
                  </a>
                </div>
                
                <p style="margin-top: 40px; color: #666; font-size: 14px; line-height: 1.6;">
                  Regards,<br/>
                  <strong style="color: #b91c1c;">BloodMatch Team</strong>
                </p>
              </div>
              
              <div style="margin-top: 20px; text-align: center;">
                <p style="font-size: 12px; color: #999; line-height: 1.5;">
                  You're receiving this because you set up a notification alert for blood group ${notification.bloodGroup}.<br/>
                  Distance: ${notification.maxDistance / 1000} km | Role: ${notification.searchRole}
                </p>
              </div>
            </div>
          `;

          await sendEmail(user.email, subject, htmlContent);

          // Update lastChecked timestamp
          notification.lastChecked = now;
          notification.isActive = false;
          await notification.save();

          console.log(`Email sent to ${user.email} - ${matches.length} match(es) found`);
        } else {
          console.log(`No matches found for ${user.email} (Blood Group: ${notification.bloodGroup})`);
        }
      }
      
      console.log("Notification check completed successfully.");
    } catch (error) {
      console.error("Notification cron job error:", error);
    }
  });

  console.log("BloodMatch notification cron job initialized (runs every 30 minutes)");
};

module.exports = notificationCronJob;