const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");

// In-Memory Storage Adapter for local development or when MONGO_URI is omitted
const inMemoryUsers = new Map();

function isMongoConnected() {
    return mongoose.connection && mongoose.connection.readyState === 1;
}

async function findUserByEmail(email) {
    if (isMongoConnected()) {
        return await User.findOne({ email });
    }
    return inMemoryUsers.get(email) || null;
}

async function findUserById(id) {
    if (isMongoConnected()) {
        return await User.findById(id);
    }
    for (const u of inMemoryUsers.values()) {
        if (String(u._id) === String(id) || String(u.id) === String(id)) {
            return u;
        }
    }
    return null;
}

async function createUser(userData) {
    if (isMongoConnected()) {
        return await User.create(userData);
    }
    const id = "user_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    const user = {
        _id: id,
        id: id,
        ...userData,
        vanity: userData.vanity || [],
        lifestyleLogs: userData.lifestyleLogs || [],
        progressPhotos: userData.progressPhotos || { baseline: "", current: "" },
        async save() {
            inMemoryUsers.set(this.email, this);
            return this;
        }
    };
    inMemoryUsers.set(user.email, user);
    return user;
}

async function updateUserById(id, updateFields) {
    if (isMongoConnected()) {
        return await User.findByIdAndUpdate(id, updateFields, { returnDocument: "after" }).select("-password");
    }
    const user = await findUserById(id);
    if (!user) return null;
    const fields = updateFields.$set ? { ...updateFields, ...updateFields.$set } : { ...updateFields };
    delete fields.$set;
    Object.assign(user, fields);
    if (user.save) await user.save();
    return user;
}

async function deleteUserById(id) {
    if (isMongoConnected()) {
        return await User.findByIdAndDelete(id);
    }
    for (const [email, u] of inMemoryUsers.entries()) {
        if (String(u._id) === String(id) || String(u.id) === String(id)) {
            inMemoryUsers.delete(email);
            return u;
        }
    }
    return null;
}

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
        const existingUser = await findUserByEmail(normalizedEmail);
        if (existingUser) {
            return res.status(400).json({
                error: "User already exists with this email",
                message: "User already exists with this email",
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await createUser({
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
        const user = await findUserByEmail(normalizedEmail);
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
        const user = await findUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const cleanUser = { ...user };
        if (cleanUser.toObject) cleanUser = user.toObject();
        delete cleanUser.password;

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
            user: cleanUser,
        });
    } catch (error) {
        return res.status(500).json({ error: "Failed to retrieve profile", message: error.message });
    }
});

// GET /api/auth/me (Get profile and streak data for logged in user)
router.get("/me", authenticateToken, async (req, res) => {
    try {
        const user = await findUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const cleanUser = { ...user };
        if (cleanUser.toObject) cleanUser = user.toObject();
        delete cleanUser.password;

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
            user: cleanUser,
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

        const updatedUser = await updateUserById(req.user.id, { $set: updateFields });

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

        const updatedUser = await updateUserById(req.user.id, updateFields);

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

// ============================================================================
// GDPR / PRIVACY COMPLIANCE & USER PROFILE DATA MANAGEMENT ENDPOINTS
// ============================================================================

// PUT /api/auth/change-password
router.put("/change-password", authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword) {
            return res.status(400).json({
                error: "Current password is required",
                message: "Current password is required"
            });
        }

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                error: "New password must be at least 6 characters long",
                message: "New password must be at least 6 characters long"
            });
        }

        const user = await findUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "User not found", message: "User not found" });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                error: "Current password is incorrect",
                message: "Current password is incorrect"
            });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        if (user.save) {
            await user.save();
        }

        return res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        console.error("Change Password Error:", error);
        return res.status(500).json({
            error: "Failed to update password",
            message: error.message
        });
    }
});

// DELETE /api/auth/progress-photos
router.delete("/progress-photos", authenticateToken, async (req, res) => {
    try {
        const updatedUser = await updateUserById(
            req.user.id,
            { $set: { progressPhotos: { baseline: "", current: "" } } }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found", message: "User not found" });
        }

        return res.status(200).json({ message: "Progress photos deleted from cloud storage" });
    } catch (error) {
        console.error("Delete Progress Photos Error:", error);
        return res.status(500).json({
            error: "Failed to delete progress photos",
            message: error.message
        });
    }
});

// GET /api/auth/export-data
router.get("/export-data", authenticateToken, async (req, res) => {
    try {
        const user = await findUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "User not found", message: "User not found" });
        }

        const exportData = {
            exportMetadata: {
                appName: "SkinCare AI",
                compliance: "GDPR Article 20 - Right to Data Portability",
                exportedAt: new Date().toISOString()
            },
            profile: {
                id: user._id,
                name: user.name || "",
                email: user.email,
                createdAt: user.createdAt,
                memberSince: user.createdAt
            },
            routineHistory: {
                streak: user.streak || 0,
                lastStreakDate: user.lastStreakDate || null,
                amCompleted: !!user.amCompleted,
                pmCompleted: !!user.pmCompleted,
                reminderEnabled: !!user.reminderEnabled,
                reminderTime: user.reminderTime || "09:00"
            },
            vanityShelf: user.vanity || [],
            lifestyleLogs: user.lifestyleLogs || [],
            progressPhotos: {
                baseline: user.progressPhotos?.baseline || "",
                current: user.progressPhotos?.current || ""
            }
        };

        res.setHeader("Content-Disposition", 'attachment; filename="skincare-ai-user-data.json"');
        res.setHeader("Content-Type", "application/json");
        return res.status(200).send(JSON.stringify(exportData, null, 2));
    } catch (error) {
        console.error("Export Data Error:", error);
        return res.status(500).json({
            error: "Failed to export data",
            message: error.message
        });
    }
});

// DELETE /api/auth/account
router.delete("/account", authenticateToken, async (req, res) => {
    try {
        const { confirmation } = req.body || {};
        if (confirmation && confirmation !== "DELETE") {
            return res.status(400).json({
                error: "Invalid confirmation. Type DELETE to confirm.",
                message: "Invalid confirmation code"
            });
        }

        const deletedUser = await deleteUserById(req.user.id);
        if (!deletedUser) {
            return res.status(404).json({ error: "User not found", message: "User not found" });
        }

        return res.status(200).json({ message: "Account and all associated clinical data permanently deleted" });
    } catch (error) {
        console.error("Delete Account Error:", error);
        return res.status(500).json({
            error: "Failed to delete account",
            message: error.message
        });
    }
});

module.exports = router;
