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

        const models = [
            "mistralai/mistral-7b-instruct:free",
            "meta-llama/llama-3.2-3b-instruct:free",
            "qwen/qwen-2.5-7b-instruct:free",
            "microsoft/phi-3-mini-128k-instruct:free",
            "google/gemma-2-9b-it:free"
        ];

        let text = "";
        let lastError = null;

        for (const modelName of models) {
            try {
                console.log("Trying model:", modelName);

                const apiResponse = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${API_KEY}`,
                        "HTTP-Referer": "https://skin-care-advisor-frontend.vercel.app",
                        "X-Title": "Skin Care Advisor"
                    },
                    body: JSON.stringify({
                        model: modelName,
                        messages: [
                            { role: "system", content: "You are a professional dermatologist." },
                            { role: "user", content: prompt }
                        ]
                    })
                });

                const data = await apiResponse.json();
                console.log("Response status for", modelName, ":", apiResponse.status);

                if (apiResponse.ok && data.choices && data.choices[0]) {
                    text = data.choices[0].message.content;
                    console.log("SUCCESS with model:", modelName);
                    break;
                } else {
                    console.log("Failed with", modelName);
                    lastError = data;
                }
            } catch (err) {
                console.log("Error with", modelName, ":", err.message);
                lastError = err;
            }
        }

        if (!text) {
            console.log("All models failed. Last error:", JSON.stringify(lastError, null, 2));
            return res.status(500).json({ error: "All AI models are busy. Please try again in a minute." });
        }

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