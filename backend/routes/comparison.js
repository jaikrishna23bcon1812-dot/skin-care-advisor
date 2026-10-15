const express = require("express");
const router = express.Router();
const Comparison = require("../models/Comparison");

// Add new comparison
router.post("/add", async (req, res) => {
    try {
        const { userId, beforeImage, afterImage, beforeDate, afterDate, title, notes } = req.body;

        if (!userId || !beforeImage || !afterImage) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const comparison = await Comparison.create({
            userId,
            beforeImage,
            afterImage,
            beforeDate: beforeDate || "Day 1",
            afterDate: afterDate || "Today",
            title: title || "My Skin Journey",
            notes: notes || ""
        });

        res.status(201).json({
            message: "Comparison saved!",
            comparison
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error" });
    }
});

// Get all comparisons for user
router.get("/:userId", async (req, res) => {
    try {
        const comparisons = await Comparison.find({ userId: req.params.userId })
            .sort({ createdAt: -1 });

        res.json({ comparisons });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error" });
    }
});

// Delete comparison
router.delete("/:id", async (req, res) => {
    try {
        await Comparison.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;