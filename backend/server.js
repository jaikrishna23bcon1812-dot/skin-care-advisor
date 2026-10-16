require("dotenv").config();
const express    = require("express");
const mongoose   = require("mongoose");
const cors       = require("cors");
const helmet     = require("helmet");
const rateLimit  = require("express-rate-limit");
const authRoutes = require("./routes/auth");

const app = express();

// ============ SECURITY MIDDLEWARE ============
app.use(helmet());                               // Secure HTTP headers
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Strict rate limiter for auth routes (brute-force protection)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,   // 15-minute window
    max: 10,                     // max 10 requests per window per IP
    standardHeaders: true,       // Return limit info in `RateLimit-*` headers
    legacyHeaders: false,        // Disable deprecated `X-RateLimit-*` headers
    message: {
        error: "Too many attempts. Please try again after 15 minutes."
    }
});

app.get("/", (req, res) => {
    res.json({ message: "AI Skin Care Advisor API is running" });
});

// ============ HEALTH CHECK (cold-start ping) ============
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ============ ROUTES ============
// Auth routes with limiter applied to login & register only
app.use("/api/auth/login",    authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/analysis", require("./routes/analysis"));
app.use("/api/progress", require("./routes/progress"));
app.use("/api/reminder", require("./routes/reminder"));
app.use("/api/comparison", require("./routes/comparison"));
app.use("/api/community", require("./routes/community"));

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