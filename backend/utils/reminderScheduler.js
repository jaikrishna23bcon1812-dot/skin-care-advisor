const cron = require("node-cron");
const User = require("../models/User");
const { sendReminderEmail } = require("./emailService");

function startReminderScheduler() {
    cron.schedule("* * * * *", async () => {
        try {
            const now = new Date();
            const currentTime = 
                String(now.getHours()).padStart(2, "0") + ":" + 
                String(now.getMinutes()).padStart(2, "0");

            const users = await User.find({
                reminderEnabled: true,
                reminderTime: currentTime
            });

            if (users.length === 0) return;

            console.log(`📧 Sending ${users.length} reminder(s) at ${currentTime}`);

            for (const user of users) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (user.lastReminderSent && user.lastReminderSent >= today) {
                    continue;
                }

                const result = await sendReminderEmail(user, null);

                if (result.success) {
                    user.lastReminderSent = new Date();
                    await user.save();
                    console.log(`✅ Sent to ${user.email}`);
                }
            }

        } catch (error) {
            console.error("Scheduler error:", error.message);
        }
    });

    console.log("⏰ Reminder scheduler started");
}

module.exports = { startReminderScheduler };
