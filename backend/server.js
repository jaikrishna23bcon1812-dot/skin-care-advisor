require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const analysisRouter = require("./routes/analysis");

const app = express();

// Connect to MongoDB Atlas
if (process.env.MONGO_URI) {
    mongoose
        .connect(process.env.MONGO_URI)
        .then(() => console.log("Connected to MongoDB Atlas successfully"))
        .catch((err) => console.error("MongoDB Atlas connection error:", err.message));
} else {
    console.warn("MONGO_URI is not defined in environment variables");
}

// Security Headers
app.use(helmet());

// Cross-Origin Resource Sharing
app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Strict Rate Limiting for Authentication / Sensitive endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { error: "Too many authentication attempts. Please try again in 15 minutes." },
});
app.use("/api/auth", authLimiter);

// Mount Auth Router
app.use("/api/auth", require("./routes/auth"));

// Serve frontend static assets
app.use(express.static(path.join(__dirname, "../frontend")));

// Health check endpoint for Render cold starts
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Friendly service discovery route
app.get("/api-status", (req, res) => {
    res.json({ message: "SkinCare AI API is running", health: "/health" });
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