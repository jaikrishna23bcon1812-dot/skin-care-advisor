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

// Get all products (static list)
router.get("/products/list", async (req, res) => {
    try {
        const products = [
            // Cleansers
            {
                id: 1,
                name: "Cetaphil PRO Oil-Removing Foam",
                brand: "Cetaphil",
                category: "Cleanser",
                skinTypes: ["oily", "combination"],
                price: "₹549",
                description: "Gentle foaming cleanser for oily and acne-prone skin",
                link: "https://www.amazon.in/s?k=cetaphil+pro+oil+removing"
            },
            {
                id: 2,
                name: "Cetaphil Gentle Skin Cleanser",
                brand: "Cetaphil",
                category: "Cleanser",
                skinTypes: ["dry", "sensitive", "combination"],
                price: "₹399",
                description: "Soap-free, fragrance-free daily cleanser",
                link: "https://www.amazon.in/s?k=cetaphil+gentle+skin+cleanser"
            },
            // Serums
            {
                id: 3,
                name: "The Ordinary Niacinamide 10% + Zinc 1%",
                brand: "The Ordinary",
                category: "Serum",
                skinTypes: ["oily", "combination"],
                price: "₹550",
                description: "Reduces pore size and controls sebum",
                link: "https://www.amazon.in/s?k=ordinary+niacinamide"
            },
            {
                id: 4,
                name: "Minimalist Vitamin C 10% Face Serum",
                brand: "Minimalist",
                category: "Serum",
                skinTypes: ["all"],
                price: "₹599",
                description: "Brightens skin and reduces pigmentation",
                link: "https://www.amazon.in/s?k=minimalist+vitamin+c"
            },
            {
                id: 5,
                name: "The Ordinary Hyaluronic Acid 2% + B5",
                brand: "The Ordinary",
                category: "Serum",
                skinTypes: ["dry", "sensitive"],
                price: "₹690",
                description: "Deep hydration with hyaluronic acid",
                link: "https://www.amazon.in/s?k=ordinary+hyaluronic+acid"
            },
            // Moisturizers
            {
                id: 6,
                name: "Neutrogena Hydro Boost Water Gel",
                brand: "Neutrogena",
                category: "Moisturizer",
                skinTypes: ["oily", "combination"],
                price: "₹750",
                description: "Oil-free gel moisturizer with hyaluronic acid",
                link: "https://www.amazon.in/s?k=neutrogena+hydro+boost"
            },
            {
                id: 7,
                name: "CeraVe Moisturizing Cream",
                brand: "CeraVe",
                category: "Moisturizer",
                skinTypes: ["dry", "sensitive"],
                price: "₹850",
                description: "Rich cream with ceramides and hyaluronic acid",
                link: "https://www.amazon.in/s?k=cerave+moisturizing+cream"
            },
            // Sunscreens
            {
                id: 8,
                name: "La Roche-Posay Anthelios UV Protect SPF 50+",
                brand: "La Roche-Posay",
                category: "Sunscreen",
                skinTypes: ["all"],
                price: "₹1,299",
                description: "Lightweight broad-spectrum sunscreen",
                link: "https://www.amazon.in/s?k=la+roche+posay+anthelios"
            },
            {
                id: 9,
                name: "Aqualogica Radiance+ Dewy Sunscreen SPF 50+",
                brand: "Aqualogica",
                category: "Sunscreen",
                skinTypes: ["all"],
                price: "₹399",
                description: "No white cast sunscreen with vitamin C",
                link: "https://www.amazon.in/s?k=aqualogica+sunscreen"
            },
            // Treatments
            {
                id: 10,
                name: "Differin Gel 0.1% Adapalene",
                brand: "Differin",
                category: "Treatment",
                skinTypes: ["oily", "combination"],
                price: "₹599",
                description: "Retinoid for acne treatment",
                link: "https://www.amazon.in/s?k=differin+gel"
            },
            {
                id: 11,
                name: "The Ordinary Alpha Arbutin 2%",
                brand: "The Ordinary",
                category: "Treatment",
                skinTypes: ["all"],
                price: "₹700",
                description: "Reduces dark spots and pigmentation",
                link: "https://www.amazon.in/s?k=ordinary+alpha+arbutin"
            },
            {
                id: 12,
                name: "Sebamed Clear Face Care Gel",
                brand: "Sebamed",
                category: "Treatment",
                skinTypes: ["oily", "sensitive"],
                price: "₹450",
                description: "pH 5.5 gel for acne-prone skin",
                link: "https://www.amazon.in/s?k=sebamed+clear+face"
            }
        ];

        res.json({ products });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error" });
    }
});
module.exports = router;