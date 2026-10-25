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
            vanity: newUser.vanity || [],
            lifestyleLogs: newUser.lifestyleLogs || [],
            progressPhotos: newUser.progressPhotos || { baseline: "", current: "" },
            user: {
                id: newUser._id,
                email: newUser.email,
                name: newUser.name,
                streak: newUser.streak,
                lastStreakDate: newUser.lastStreakDate,
                amCompleted: newUser.amCompleted,
                pmCompleted: newUser.pmCompleted,
                vanity: newUser.vanity || [],
                lifestyleLogs: newUser.lifestyleLogs || [],
                progressPhotos: newUser.progressPhotos || { baseline: "", current: "" },
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
            vanity: user.vanity || [],
            lifestyleLogs: user.lifestyleLogs || [],
            progressPhotos: user.progressPhotos || { baseline: "", current: "" },
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                streak: user.streak,
                lastStreakDate: user.lastStreakDate,
                amCompleted: user.amCompleted,
                pmCompleted: user.pmCompleted,
                vanity: user.vanity || [],
                lifestyleLogs: user.lifestyleLogs || [],
                progressPhotos: user.progressPhotos || { baseline: "", current: "" },
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

// Authentication Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "No token provided", message: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "defaultsecret");
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid token", message: "Invalid or expired token" });
    }
}

// GET /api/auth/profile (Get full user profile including vanity, lifestyleLogs, progressPhotos, streak)
router.get("/profile", authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json({
            id: user._id,
            email: user.email,
            name: user.name,
            streak: user.streak || 0,
            lastStreakDate: user.lastStreakDate || null,
            amCompleted: !!user.amCompleted,
            pmCompleted: !!user.pmCompleted,
            vanity: user.vanity || [],
            lifestyleLogs: user.lifestyleLogs || [],
            progressPhotos: user.progressPhotos || { baseline: "", current: "" },
            user,
        });
    } catch (error) {
        return res.status(500).json({ error: "Failed to retrieve profile", message: error.message });
    }
});

// GET /api/auth/me (Get profile and streak data for logged in user)
router.get("/me", authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json({
            id: user._id,
            email: user.email,
            name: user.name,
            streak: user.streak || 0,
            lastStreakDate: user.lastStreakDate || null,
            amCompleted: !!user.amCompleted,
            pmCompleted: !!user.pmCompleted,
            vanity: user.vanity || [],
            lifestyleLogs: user.lifestyleLogs || [],
            progressPhotos: user.progressPhotos || { baseline: "", current: "" },
            user,
        });
    } catch (error) {
        return res.status(500).json({ error: "Failed to retrieve user info", message: error.message });
    }
});

// PUT /api/auth/sync (Accepts { vanity, lifestyleLogs, progressPhotos } and merges/updates MongoDB)
router.put("/sync", authenticateToken, async (req, res) => {
    try {
        const { vanity, lifestyleLogs, progressPhotos, streak, lastStreakDate, amCompleted, pmCompleted } = req.body;
        const updateFields = {};

        if (Array.isArray(vanity)) {
            updateFields.vanity = vanity.map(item => ({
                name: String(item.name || ""),
                category: String(item.category || ""),
                pao: Number(item.pao ?? item.paoMonths ?? 6),
                dateOpened: String(item.dateOpened || "")
            }));
        }

        if (Array.isArray(lifestyleLogs)) {
            updateFields.lifestyleLogs = lifestyleLogs.map(log => ({
                date: String(log.date || ""),
                sleep: String(log.sleep || ""),
                stress: String(log.stress || ""),
                triggers: Array.isArray(log.triggers) ? log.triggers.map(String) : (Array.isArray(log.dietTriggers) ? log.dietTriggers.map(String) : []),
                feel: String(log.feel || log.skinFeel || "")
            }));
        }

        if (progressPhotos && typeof progressPhotos === "object") {
            const currentPhotos = {};
            if (progressPhotos.baseline !== undefined) currentPhotos.baseline = String(progressPhotos.baseline);
            if (progressPhotos.current !== undefined) currentPhotos.current = String(progressPhotos.current);
            updateFields.progressPhotos = currentPhotos;
        }

        if (typeof streak === "number") updateFields.streak = streak;
        if (lastStreakDate !== undefined) updateFields.lastStreakDate = lastStreakDate;
        if (typeof amCompleted === "boolean") updateFields.amCompleted = amCompleted;
        if (typeof pmCompleted === "boolean") updateFields.pmCompleted = pmCompleted;

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateFields },
            { returnDocument: "after" }
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json({
            message: "User profile data synced successfully",
            vanity: updatedUser.vanity || [],
            lifestyleLogs: updatedUser.lifestyleLogs || [],
            progressPhotos: updatedUser.progressPhotos || { baseline: "", current: "" },
            streak: updatedUser.streak,
            lastStreakDate: updatedUser.lastStreakDate,
            amCompleted: updatedUser.amCompleted,
            pmCompleted: updatedUser.pmCompleted,
            user: updatedUser,
        });
    } catch (error) {
        console.error("Cloud sync error:", error);
        return res.status(500).json({ error: "Failed to sync user data", details: error.message });
    }
});

// PUT /api/auth/streak (Sync streak data with MongoDB Atlas)
router.put("/streak", authenticateToken, async (req, res) => {
    try {
        const { streak, lastStreakDate, amCompleted, pmCompleted } = req.body;
        const updateFields = {};
        if (typeof streak === "number") updateFields.streak = streak;
        if (lastStreakDate !== undefined) updateFields.lastStreakDate = lastStreakDate;
        if (typeof amCompleted === "boolean") updateFields.amCompleted = amCompleted;
        if (typeof pmCompleted === "boolean") updateFields.pmCompleted = pmCompleted;

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
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
        return res.status(500).json({ error: "Failed to sync streak", details: error.message });
    }
});

module.exports = router;
