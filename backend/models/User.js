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
        required: function () {
            return !this.googleId;
        },
    },
    googleId: {
        type: String,
        sparse: true,
    },
    picture: {
        type: String,
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
    vanity: [
        {
            name: { type: String, default: "" },
            category: { type: String, default: "" },
            pao: { type: Number, default: 6 },
            dateOpened: { type: String, default: "" },
        }
    ],
    lifestyleLogs: [
        {
            date: { type: String, default: "" },
            sleep: { type: String, default: "" },
            stress: { type: String, default: "" },
            triggers: [{ type: String }],
            feel: { type: String, default: "" },
        }
    ],
    progressPhotos: {
        baseline: { type: String, default: "" },
        current: { type: String, default: "" },
    },
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
