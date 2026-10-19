const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, "Password is required"],
    },
    streak: {
        type: Number,
        default: 0,
    },
    lastStreakDate: {
        type: String,
        default: null,
    },
    amCompleted: {
        type: Boolean,
        default: false,
    },
    pmCompleted: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    // Optional compatibility fields
    name: {
        type: String,
        default: "",
    },
    reminderEnabled: {
        type: Boolean,
        default: false,
    },
    reminderTime: {
        type: String,
        default: "09:00",
    },
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
