const express = require("express");
const router = express.Router();
const Progress = require("../models/Progress");

// Add progress entry
router.post("/add", async (req, res) => {
    try {
        const { userId, date, notes, rating } = req.body;

        if (!userId || !date || !notes) {
            return res.status(400).json({ error: "All fields required" });
        }

        const entry = await Progress.create({
            userId,
            date,
            notes,
            rating: rating || 3
        });

        res.status(201).json({
            message: "Progress added",
            entry
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error" });
    }
});

// Get all progress for a user
router.get("/:userId", async (req, res) => {
    try {
        const entries = await Progress.find({ userId: req.params.userId })
            .sort({ date: 1 });

        res.json({ entries });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error" });
    }
});

// Delete progress entry
router.delete("/:id", async (req, res) => {
    try {
        await Progress.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;