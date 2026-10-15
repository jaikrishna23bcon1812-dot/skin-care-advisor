const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    age: Number,
    skinType: String,
    profilePhoto: String,
    isAdmin: { type: Boolean, default: false },
    reminderEnabled: {
        type: Boolean,
        default: false
    },
    reminderTime: {
        type: String,
        default: "09:00"
    },
    lastReminderSent: {
        type: Date,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
