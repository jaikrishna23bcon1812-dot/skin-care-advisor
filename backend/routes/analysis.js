const express = require("express");
const router = express.Router();

// Fallback routine if external AI fails or times out
const FALLBACK_ROUTINE = {
    routine: {
        am: [
            "Gentle Balancing Gel Cleanser",
            "5% Niacinamide + Zinc Serum",
            "Lightweight Barrier Lotion",
            "Broad-Spectrum Hydrating Sunscreen SPF 50"
        ],
        pm: [
            "Jojoba Oil Pre-Cleanse",
            "Squalane Hydrating Cleanser",
            "Ceramide Deep Repair Complex",
            "Spot Blemish Gel (as needed)"
        ]
    }
};

// Strips markdown blocks such as ```json ... ```
function sanitizeAIResponse(text) {
    if (!text) return "";
    let clean = text.trim();
    if (clean.startsWith("```json")) clean = clean.substring(7);
    else if (clean.startsWith("```")) clean = clean.substring(3);
    if (clean.endsWith("```")) clean = clean.substring(0, clean.length - 3);
    return clean.trim();
}

router.post("/", async (req, res) => {
    const { skinType = "combination", concern = "barrier repair" } = req.body;

    const apiKey = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY;

    // Gracefully fallback if API keys are not supplied in production
    if (!apiKey) {
        console.warn("AI API key missing. Serving fallback regimen.");
        return res.status(200).json(FALLBACK_ROUTINE);
    }

    const prompt = `You are a clinical cosmetic chemist. Provide a targeted morning and evening routine for a user with ${skinType} skin and concerns regarding ${concern}.
Return strictly a valid JSON object without commentary or markdown code blocks:
{
  "routine": {
    "am": ["Step 1", "Step 2", "Step 3", "Step 4"],
    "pm": ["Step 1", "Step 2", "Step 3"]
  }
}`;

    try {
        const aiResponse = await fetch("[https://api.groq.com/openai/v1/chat/completions](https://api.groq.com/openai/v1/chat/completions)", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.4
            })
        });

        if (!aiResponse.ok) {
            throw new Error(`AI API status ${aiResponse.status}`);
        }

        const json = await aiResponse.json();
        const rawContent = json.choices?.[0]?.message?.content;
        const cleanJSON = sanitizeAIResponse(rawContent);
        const parsedData = JSON.parse(cleanJSON);

        res.status(200).json(parsedData);
    } catch (error) {
        console.error("AI Generation failed, serving fallback payload:", error.message);
        res.status(200).json(FALLBACK_ROUTINE);
    }
});

module.exports = router;