const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// POST /api/auth/register
router.post("/register", async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "Please provide both email and password",
                message: "Please provide both email and password",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: "Password must be at least 6 characters long",
                message: "Password must be at least 6 characters long",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({
                error: "User already exists with this email",
                message: "User already exists with this email",
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            email: normalizedEmail,
            password: hashedPassword,
            name: name || normalizedEmail.split("@")[0],
            streak: 0,
            lastStreakDate: null,
            amCompleted: false,
            pmCompleted: false,
            createdAt: new Date(),
        });

        const token = jwt.sign(
            { id: newUser._id, email: newUser.email },
            process.env.JWT_SECRET || "defaultsecret",
            { expiresIn: "7d" }
        );

        return res.status(201).json({
            message: "User registered successfully",
            token,
            email: newUser.email,
            streak: newUser.streak,
            lastStreakDate: newUser.lastStreakDate,
            amCompleted: newUser.amCompleted,
            pmCompleted: newUser.pmCompleted,
            user: {
                id: newUser._id,
                email: newUser.email,
                name: newUser.name,
                streak: newUser.streak,
                lastStreakDate: newUser.lastStreakDate,
                amCompleted: newUser.amCompleted,
                pmCompleted: newUser.pmCompleted,
            },
        });
    } catch (error) {
        console.error("Register Error:", error);
        return res.status(500).json({
            error: "Server error during registration",
            message: error.message,
        });
    }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "Please provide email and password",
                message: "Please provide email and password",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({
                error: "Invalid email or password",
                message: "Invalid email or password",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                error: "Invalid email or password",
                message: "Invalid email or password",
            });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET || "defaultsecret",
            { expiresIn: "7d" }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            email: user.email,
            streak: user.streak,
            lastStreakDate: user.lastStreakDate,
            amCompleted: user.amCompleted,
            pmCompleted: user.pmCompleted,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                streak: user.streak,
                lastStreakDate: user.lastStreakDate,
                amCompleted: user.amCompleted,
                pmCompleted: user.pmCompleted,
            },
        });
    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({
            error: "Server error during login",
            message: error.message,
        });
    }
});

// GET /api/auth/me (Get profile and streak data for logged in user)
router.get("/me", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "No token provided" });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "defaultsecret");

        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json({
            email: user.email,
            name: user.name,
            streak: user.streak,
            lastStreakDate: user.lastStreakDate,
            amCompleted: user.amCompleted,
            pmCompleted: user.pmCompleted,
            user,
        });
    } catch (error) {
        return res.status(401).json({ error: "Invalid token" });
    }
});

// PUT /api/auth/streak (Sync streak data with MongoDB Atlas)
router.put("/streak", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "No token provided" });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "defaultsecret");

        const { streak, lastStreakDate, amCompleted, pmCompleted } = req.body;
        const updateFields = {};
        if (typeof streak === "number") updateFields.streak = streak;
        if (lastStreakDate !== undefined) updateFields.lastStreakDate = lastStreakDate;
        if (typeof amCompleted === "boolean") updateFields.amCompleted = amCompleted;
        if (typeof pmCompleted === "boolean") updateFields.pmCompleted = pmCompleted;

        const updatedUser = await User.findByIdAndUpdate(
            decoded.id,
            updateFields,
            { returnDocument: "after" }
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json({
            message: "Streak synced successfully",
            streak: updatedUser.streak,
            lastStreakDate: updatedUser.lastStreakDate,
            amCompleted: updatedUser.amCompleted,
            pmCompleted: updatedUser.pmCompleted,
            user: updatedUser,
        });
    } catch (error) {
        return res.status(401).json({ error: "Failed to sync streak", details: error.message });
    }
});

module.exports = router;
