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
// Get dashboard stats
router.get("/stats/:userId", async (req, res) => {
    try {
        const Analysis = require("../models/Analysis");
        const userId = req.params.userId;

        const progressEntries = await Progress.find({ userId }).sort({ date: 1 });
        const analyses = await Analysis.find({ userId });

        const totalEntries = progressEntries.length;
        const totalAnalyses = analyses.length;

        const avgRating = totalEntries > 0
            ? (progressEntries.reduce((sum, e) => sum + e.rating, 0) / totalEntries).toFixed(1)
            : 0;

        // Calculate streak
        let streak = 0;
        if (progressEntries.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const dates = progressEntries
                .map(e => {
                    const d = new Date(e.date);
                    d.setHours(0, 0, 0, 0);
                    return d.getTime();
                })
                .sort((a, b) => b - a);

            const uniqueDates = [...new Set(dates)];
            let expectedDate = today.getTime();

            for (const date of uniqueDates) {
                if (date === expectedDate) {
                    streak++;
                    expectedDate -= 86400000;
                } else if (date === expectedDate + 86400000) {
                    streak++;
                    expectedDate = date - 86400000;
                } else {
                    break;
                }
            }
        }

        res.json({
            totalEntries,
            totalAnalyses,
            avgRating,
            streak
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error" });
    }
});


module.exports = router;