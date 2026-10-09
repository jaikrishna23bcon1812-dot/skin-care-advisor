const express = require("express");
const router = express.Router();
const Analysis = require("../models/Analysis");

router.post("/generate", async (req, res) => {
    try {
        const { concern, userId } = req.body;

        if (!concern) {
            return res.status(400).json({ error: "Please enter a skin concern" });
        }

        const API_KEY = process.env.OPENROUTER_API_KEY;
        const url = "https://openrouter.ai/api/v1/chat/completions";

        const prompt = `You are a professional dermatologist. Create a detailed skincare routine for someone with the following concern: "${concern}".

Please include:
1. Morning Routine (cleanser, serum, moisturizer, sunscreen)
2. Night Routine (cleanser, treatment, moisturizer)
3. 3 Product Recommendations for Indian skin
4. 3 Do's and Don'ts

Keep it under 300 words.`;

        const apiResponse = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`,
                "HTTP-Referer": "https://skin-care-advisor-frontend.vercel.app",
                "X-Title": "Skin Care Advisor"
            },
            body: JSON.stringify({
                model: "meta-llama/llama-3.1-8b-instruct:free",
                messages: [
                    { role: "system", content: "You are a professional dermatologist." },
                    { role: "user", content: prompt }
                ]
            })
        });

        const data = await apiResponse.json();

        console.log("OpenRouter response status:", apiResponse.status);

        if (!apiResponse.ok) {
            console.log("OpenRouter API error:", JSON.stringify(data, null, 2));
            return res.status(500).json({ error: "AI failed. Check console." });
        }

        const text = data.choices[0].message.content;

        let savedAnalysis = null;
        if (userId) {
            savedAnalysis = await Analysis.create({
                userId,
                concern,
                result: text
            });
        }

        res.json({
            message: "Routine generated",
            routine: text,
            analysisId: savedAnalysis ? savedAnalysis._id : null
        });

    } catch (error) {
        console.log("Server error:", error.message);
        res.status(500).json({ error: "AI failed to generate routine. Try again." });
    }
});

module.exports = router;