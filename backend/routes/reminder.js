const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { sendReminderEmail } = require("../utils/emailService");

router.post("/test/:userId", async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const result = await sendReminderEmail(user, null);
        if (result.success) {
            res.json({ message: "Test email sent to " + user.email });
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error" });
    }
});

router.put("/preferences", async (req, res) => {
    try {
        const { userId, reminderEnabled, reminderTime } = req.body;
        if (!userId) {
            return res.status(400).json({ error: "User ID required" });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        if (reminderEnabled !== undefined) {
            user.reminderEnabled = reminderEnabled;
        }
        if (reminderTime) {
            user.reminderTime = reminderTime;
        }
        await user.save();
        res.json({
            message: "Preferences updated",
            reminderEnabled: user.reminderEnabled,
            reminderTime: user.reminderTime
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error" });
    }
});

router.get("/preferences/:userId", async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json({
            reminderEnabled: user.reminderEnabled || false,
            reminderTime: user.reminderTime || "09:00"
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
