require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const analysisRouter = require("./routes/analysis");

const app = express();

// Security Headers
app.use(helmet());

// Cross-Origin Resource Sharing
app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
    })
);

app.use(express.json());

// Strict Rate Limiting for Authentication / Sensitive endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: { error: "Too many authentication attempts. Please try again in 15 minutes." },
});
app.use("/api/auth", authLimiter);

// Health check endpoint for Render cold starts
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Core AI Analysis Route
app.use("/api/analysis", analysisRouter);

// Mock Like Endpoint for Community Posts
app.post("/api/community/posts/:id/like", (req, res) => {
    // Returns pseudo-random incremented likes count
    const newCount = Math.floor(Math.random() * 20) + 30;
    res.status(200).json({ success: true, likesCount: newCount });
});

// Centralized error handler
app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server actively running on port ${PORT}`);
});