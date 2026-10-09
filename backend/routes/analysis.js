const express = require("express");
const router = express.Router();
const Analysis = require("../models/Analysis");

// Fallback routines for common skin concerns
function getFallbackRoutine(concern) {
    const c = concern.toLowerCase();

    if (c.includes("acne") || c.includes("pimple") || c.includes("oily")) {
        return `**Skincare Routine for Acne-Prone & Oily Skin** (Tailored for Indian skin)

**1. Morning Routine**
- Cleanser: Cetaphil PRO Oil-Removing Foam
- Serum: The Ordinary Niacinamide 10% + Zinc 1%
- Moisturizer: Neutrogena Hydro Boost Water Gel (oil-free)
- Sunscreen: La Roche-Posay Anthelios UV Protect SPF 50+

**2. Night Routine**
- Cleanser: Same as morning (or BHA cleanser 2-3x/week)
- Treatment: Differin Gel 0.1% (adapalene) - apply thin layer
- Moisturizer: Sebamed Clear Face Care Gel

**3. Product Recommendations (Indian Market)**
- Cetaphil PRO Oil-Removing Foam Cleanser
- The Ordinary Niacinamide 10% + Zinc 1%
- La Roche-Posay Anthelios UV Protect SPF 50+

**4. Do's and Don'ts**
DO: Cleanse twice daily with pH-balanced formula
DO: Apply non-comedogenic sunscreen every morning
DO: Introduce actives gradually
DON'T: Over-scrub or use harsh physical exfoliants
DON'T: Skip moisturizer
DON'T: Mix multiple strong actives at once

Follow this routine for 8-12 weeks for visible improvement. Consult a dermatologist if acne persists.`;
    }

    if (c.includes("dry") || c.includes("flaky") || c.includes("dehydrated")) {
        return `**Skincare Routine for Dry Skin** (Tailored for Indian skin)

**1. Morning Routine**
- Cleanser: Cetaphil Gentle Skin Cleanser (cream-based)
- Serum: The Ordinary Hyaluronic Acid 2% + B5
- Moisturizer: CeraVe Moisturizing Cream
- Sunscreen: Neutrogena Ultra Sheer Dry-Touch SPF 50+

**2. Night Routine**
- Cleanser: Same as morning
- Treatment: The Ordinary Squalane Oil (2-3 drops)
- Moisturizer: CeraVe Moisturizing Cream (thicker layer)

**3. Product Recommendations (Indian Market)**
- Cetaphil Gentle Skin Cleanser
- The Ordinary Hyaluronic Acid 2% + B5
- CeraVe Moisturizing Cream

**4. Do's and Don'ts**
DO: Use lukewarm water for washing
DO: Apply moisturizer while skin is damp
DO: Use a humidifier in dry weather
DON'T: Use hot water
DON'T: Skip moisturizer even if skin feels oily
DON'T: Use harsh foaming cleansers

Consistent care for 6-8 weeks restores skin barrier. See a dermatologist for persistent dryness.`;
    }

    if (c.includes("dark spot") || c.includes("pigmentation") || c.includes("melasma")) {
        return `**Skincare Routine for Dark Spots & Pigmentation** (Indian skin)

**1. Morning Routine**
- Cleanser: Cetaphil Gentle Skin Cleanser
- Serum: Minimalist Vitamin C 10% Face Serum
- Moisturizer: Neutrogena Hydro Boost Water Gel
- Sunscreen: Aqualogica Radiance+ Dewy Sunscreen SPF 50+ (MUST)

**2. Night Routine**
- Cleanser: Same as morning
- Treatment: Minimalist Alpha Arbutin 2% Serum
- Moisturizer: CeraVe Moisturizing Cream

**3. Product Recommendations (Indian Market)**
- Minimalist Vitamin C 10% Face Serum
- Minimalist Alpha Arbutin 2% Serum
- Aqualogica Radiance+ Dewy Sunscreen SPF 50+

**4. Do's and Don'ts**
DO: Apply sunscreen every morning (most important)
DO: Use vitamin C in the morning
DO: Be patient - results take 8-12 weeks
DON'T: Skip sunscreen (worsens pigmentation)
DON'T: Use lemon or toothpaste on spots
DON'T: Pick at dark spots

Consider a dermatologist consult for chemical peels or prescription creams.`;
    }

    if (c.includes("sensitive") || c.includes("redness") || c.includes("irritation")) {
        return `**Skincare Routine for Sensitive Skin** (Indian skin)

**1. Morning Routine**
- Cleanser: Cetaphil Gentle Skin Cleanser
- Moisturizer: Aveeno Dermexa Daily Emollient Cream
- Sunscreen: La Roche-Posay Anthelios UV Protect SPF 50+

**2. Night Routine**
- Cleanser: Same as morning
- Treatment: Skip (introduce only after 2 weeks)
- Moisturizer: Aveeno Dermexa Daily Emollient Cream

**3. Product Recommendations (Indian Market)**
- Cetaphil Gentle Skin Cleanser
- Aveeno Dermexa Daily Emollient Cream
- La Roche-Posay Anthelios UV Protect SPF 50+

**4. Do's and Don'ts**
DO: Patch test all new products
DO: Use minimal products
DO: Use fragrance-free products
DON'T: Use scrubs or physical exfoliants
DON'T: Try multiple new products at once
DON'T: Use hot water

If irritation persists, consult a dermatologist for patch testing.`;
    }

    // Default routine for other concerns
    return `**General Skincare Routine** (Indian skin)

**1. Morning Routine**
- Cleanser: Cetaphil Gentle Skin Cleanser
- Serum: Minimalist Vitamin C 10% Face Serum
- Moisturizer: Neutrogena Hydro Boost Water Gel
- Sunscreen: Aqualogica Radiance+ Dewy Sunscreen SPF 50+

**2. Night Routine**
- Cleanser: Same as morning
- Treatment: The Ordinary Niacinamide 10% + Zinc 1%
- Moisturizer: CeraVe Moisturizing Cream

**3. Product Recommendations (Indian Market)**
- Cetaphil Gentle Skin Cleanser
- Minimalist Vitamin C 10% Face Serum
- La Roche-Posay Anthelios UV Protect SPF 50+

**4. Do's and Don'ts**
DO: Cleanse twice daily
DO: Apply sunscreen every morning
DO: Moisturize twice daily
DO: Drink 8 glasses of water
DON'T: Skip sunscreen
DON'T: Over-exfoliate
DON'T: Touch your face frequently

Consistency for 8-12 weeks is key. Consult a dermatologist for specific concerns.`;
}

router.post("/generate", async (req, res) => {
    try {
        const { concern, userId } = req.body;

        if (!concern) {
            return res.status(400).json({ error: "Please enter a skin concern" });
        }

        const prompt = `You are a professional dermatologist. Create a detailed skincare routine for someone with the following concern: "${concern}".

Please include:
1. Morning Routine (cleanser, serum, moisturizer, sunscreen)
2. Night Routine (cleanser, treatment, moisturizer)
3. 3 Product Recommendations for Indian skin
4. 3 Do's and Don'ts

Keep it under 300 words.`;

        let text = "";

        // Try OpenRouter with multiple models
        const models = [
            "mistralai/mistral-7b-instruct:free",
            "meta-llama/llama-3.2-3b-instruct:free",
            "microsoft/phi-3-mini-128k-instruct:free",
            "qwen/qwen-2.5-7b-instruct:free"
        ];

        for (const modelName of models) {
            if (text) break;
            try {
                console.log("Trying OpenRouter model:", modelName);
                const apiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
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
                console.log("Status for", modelName, ":", apiResponse.status);

                if (apiResponse.ok && data.choices && data.choices[0]) {
                    text = data.choices[0].message.content;
                    console.log("SUCCESS with", modelName);
                }
            } catch (e) {
                console.log("Error with", modelName, ":", e.message);
            }
        }

        // If all AI providers failed, use the fallback routine
        if (!text) {
            console.log("All AI providers failed. Using fallback routine.");
            text = getFallbackRoutine(concern);
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
        // Even on error, return fallback
        try {
            const fallback = getFallbackRoutine(req.body.concern || "general");
            res.json({
                message: "Routine generated",
                routine: fallback,
                analysisId: null
            });
        } catch (e) {
            res.status(500).json({ error: "Something went wrong." });
        }
    }
});

module.exports = router;