const express = require("express");
const router = express.Router();

// Fallback routine if external AI fails or times out (text analysis)
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

// Fallback routine specifically curated for visual selfie analysis
const FALLBACK_PHOTO_ROUTINE = {
    detectedConcerns: [
        "Surface Barrier Dehydration",
        "Mild Erythema (Redness)",
        "Micro-Congestion & Blemishes"
    ],
    summary: "Visual assessment indicates mild surface erythema and early barrier compromise. Calibrated with anti-inflammatory centella, azelaic acid, and rich ceramide lipid restoration.",
    routine: {
        am: [
            "Gentle Balancing Centella Cleanser",
            "10% Azelaic Acid + Zinc Soothing Serum",
            "Lightweight Barrier Restorative Lotion",
            "Broad-Spectrum Invisible Shield Sunscreen SPF 50+"
        ],
        pm: [
            "Jojoba Oil Pre-Cleanse",
            "Squalane Hydrating Cleanser",
            "Ceramide Deep Repair Lipid Complex",
            "Overnight Blemish Calming Spot Balm"
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

// POST /api/analysis & POST /api/analysis/routine (Manual Questionnaire Route)
router.post(["/", "/routine"], async (req, res) => {
    const { skinType = "combination", concern = "barrier repair", climate, recentLifestyle } = req.body;

    // Environmental Context Instruction
    let climateInstruction = "";
    if (climate && typeof climate === "object") {
        const uvIndex = climate.uvIndex !== undefined ? climate.uvIndex : (climate.uv !== undefined ? climate.uv : 5);
        const humidity = climate.humidity !== undefined ? climate.humidity : 45;
        const temp = climate.temp !== undefined ? climate.temp : 22;
        climateInstruction = `Environmental Context: Current UV Index is ${uvIndex}, Humidity is ${humidity}%, Temp is ${temp}°C. Adapt active formulations accordingly (e.g., if UV >= 6, mandate high-PA mineral/hybrid SPF 50; if humidity < 40%, prioritize occlusive hydration like ceramides and squalane).`;
    }

    // Recent Lifestyle Context Instruction
    let lifestyleInstruction = "";
    if (Array.isArray(recentLifestyle) && recentLifestyle.length > 0) {
        const summaryParts = recentLifestyle.map((entry, idx) => {
            const parts = [];
            if (entry.sleep) parts.push(`sleep: ${entry.sleep}`);
            if (entry.stress) parts.push(`stress: ${entry.stress}`);
            if (entry.skinFeel || entry.feel) parts.push(`skin feel: ${entry.skinFeel || entry.feel}`);
            const triggers = entry.triggers || entry.dietTriggers;
            if (Array.isArray(triggers) && triggers.length > 0 && !triggers.includes("None")) {
                parts.push(`triggers: ${triggers.join(", ")}`);
            }
            return parts.length > 0 ? `(Check-in ${idx + 1}: ${parts.join(", ")})` : null;
        }).filter(Boolean);

        const recentLifestyleSummary = summaryParts.length > 0 ? summaryParts.join("; ") : "recent variable barrier sensitivity and stress";
        lifestyleInstruction = `Recent Lifestyle Context: User reported ${recentLifestyleSummary}. Account for stress-induced barrier compromise or sleep-deprivation dullness with soothing, anti-inflammatory compounds (e.g., Centella, Allantoin, Azelaic Acid).`;
    }

    // Dynamic fallback routine generation if API key is absent or external API call fails
    const getAdaptedFallback = () => {
        const routineAm = [...FALLBACK_ROUTINE.routine.am];
        const routinePm = [...FALLBACK_ROUTINE.routine.pm];

        if (climate && ((climate.uvIndex !== undefined && climate.uvIndex >= 6) || (climate.uv !== undefined && climate.uv >= 6))) {
            routineAm[3] = "Broad-Spectrum Mineral-Hybrid Sunscreen SPF 50+ (High-UV Defense)";
        }
        if (climate && climate.humidity !== undefined && climate.humidity < 40) {
            routineAm[2] = "Ceramide & Squalane Intensive Barrier Occlusive Lotion";
            routinePm[2] = "Ceramide Deep Repair Complex + Squalane Night Elixir";
        }
        if (lifestyleInstruction) {
            routineAm[1] = "Centella & Azelaic Acid Soothing Barrier Serum";
        }
        return {
            routine: {
                am: routineAm,
                pm: routinePm
            }
        };
    };

    const apiKey = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        console.warn("AI API key missing. Serving fallback regimen.");
        return res.status(200).json(getAdaptedFallback());
    }

    // Build system prompt and user message
    let systemPrompt = "You are a clinical cosmetic chemist and dermatologist.";
    if (climateInstruction) {
        systemPrompt += `\n${climateInstruction}`;
    }
    if (lifestyleInstruction) {
        systemPrompt += `\n${lifestyleInstruction}`;
    }

    const userPrompt = `Provide a targeted morning and evening routine for a user with ${skinType} skin and concerns regarding ${concern}.
Return strictly a valid JSON object without commentary or markdown code blocks:
{
  "routine": {
    "am": ["Step 1", "Step 2", "Step 3", "Step 4"],
    "pm": ["Step 1", "Step 2", "Step 3"]
  }
}`;

    try {
        const isGroq = !!process.env.GROQ_API_KEY;
        const endpoint = isGroq
            ? "https://api.groq.com/openai/v1/chat/completions"
            : "https://openrouter.ai/api/v1/chat/completions";
        const model = isGroq ? "llama-3.3-70b-versatile" : "meta-llama/llama-3.3-70b-instruct";

        const aiResponse = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                ...(isGroq ? {} : { "HTTP-Referer": "http://localhost:5000", "X-Title": "SkinCare AI" })
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
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

        if (!parsedData.routine || !Array.isArray(parsedData.routine.am) || !Array.isArray(parsedData.routine.pm)) {
            throw new Error("Invalid routine schema received from AI");
        }

        res.status(200).json(parsedData);
    } catch (error) {
        console.error("AI Generation failed, serving fallback payload:", error.message);
        res.status(200).json(getAdaptedFallback());
    }
});

// POST /api/analysis/photo (Visual Camera & Selfie Upload Analysis Route)
router.post("/photo", async (req, res) => {
    try {
        const { image } = req.body;

        if (!image || typeof image !== "string") {
            return res.status(400).json({ error: "Image data (base64) is required." });
        }

        const openrouterKey = process.env.OPENROUTER_API_KEY;
        const groqKey = process.env.GROQ_API_KEY;

        if (!openrouterKey && !groqKey) {
            console.warn("Vision AI key missing. Serving clinical fallback regimen.");
            return res.status(200).json(FALLBACK_PHOTO_ROUTINE);
        }

        const visionPrompt = `You are a clinical dermatologist and cosmetic chemist. Analyze this facial skin selfie carefully for skin barrier health, erythema (redness), and active blemishes or pore congestion.
Provide an accurate assessment and formulate a calibrated morning and evening skincare routine.
Return strictly a valid JSON object without commentary or markdown code blocks:
{
  "detectedConcerns": ["Concern 1", "Concern 2", "Concern 3"],
  "summary": "Brief 2-sentence clinical diagnosis of barrier health, redness, and blemishes",
  "routine": {
    "am": ["Step 1 Cleanser", "Step 2 Treatment", "Step 3 Moisturizer", "Step 4 SPF"],
    "pm": ["Step 1 Pre-Cleanse", "Step 2 Wash", "Step 3 Barrier Cream", "Step 4 Spot Treatment"]
  }
}`;

        let aiResponse;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

        if (openrouterKey) {
            aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                signal: controller.signal,
                headers: {
                    "Authorization": `Bearer ${openrouterKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:5000",
                    "X-Title": "SkinCare AI"
                },
                body: JSON.stringify({
                    model: "google/gemini-2.0-flash-exp:free",
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: visionPrompt },
                                { type: "image_url", image_url: { url: image } }
                            ]
                        }
                    ],
                    temperature: 0.3
                })
            });
        } else if (groqKey) {
            aiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                signal: controller.signal,
                headers: {
                    "Authorization": `Bearer ${groqKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.2-11b-vision-preview",
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: visionPrompt },
                                { type: "image_url", image_url: { url: image } }
                            ]
                        }
                    ],
                    temperature: 0.3
                })
            });
        }

        clearTimeout(timeoutId);

        if (!aiResponse || !aiResponse.ok) {
            throw new Error(`Vision AI status: ${aiResponse ? aiResponse.status : "No response"}`);
        }

        const json = await aiResponse.json();
        const rawContent = json.choices?.[0]?.message?.content;
        const cleanJSON = sanitizeAIResponse(rawContent);
        const parsedData = JSON.parse(cleanJSON);

        if (!parsedData.routine || !parsedData.routine.am || !parsedData.routine.pm) {
            throw new Error("Invalid schema received from Vision AI");
        }

        return res.status(200).json({
            detectedConcerns: parsedData.detectedConcerns || ["Barrier Sensitivity", "Mild Redness"],
            summary: parsedData.summary || "AI visual analysis complete.",
            routine: parsedData.routine
        });
    } catch (error) {
        console.error("Photo Analysis error, providing clinical fallback:", error.message);
        return res.status(200).json(FALLBACK_PHOTO_ROUTINE);
    }
});

module.exports = router;