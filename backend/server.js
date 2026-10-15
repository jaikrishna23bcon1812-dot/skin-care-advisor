require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.get("/", (req, res) => {
    res.json({ message: "AI Skin Care Advisor API is running" });
});

// ============ ROUTES ============
app.use("/api/auth", authRoutes);
app.use("/api/analysis", require("./routes/analysis"));
app.use("/api/progress", require("./routes/progress"));
app.use("/api/reminder", require("./routes/reminder"));
app.use("/api/comparison", require("./routes/comparison"));

// ============ SERVER STARTUP ============
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected");

        // Start reminder scheduler (safe fallback if files missing)
        try {
            const { startReminderScheduler } = require("./utils/reminderScheduler");
            startReminderScheduler();
        } catch (err) {
            console.log("Reminder scheduler not available:", err.message);
        }

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.log("MongoDB connection failed");
        console.error(err.message);
    });