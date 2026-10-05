const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.log("ERROR: GEMINI_API_KEY is not defined in .env");
    process.exit(1);
}

console.log("Using API key starting with:", API_KEY.substring(0, 10) + "...");

const testModel = async (modelName) => {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Say hello" }] }]
            })
        });
        const data = await response.json();
        console.log(`\n--- ${modelName} ---`);
        console.log("Status:", response.status);
        if (response.ok) {
            console.log("SUCCESS");
        } else {
            console.log("Error message:", data.error ? data.error.message : "Unknown");
        }
    } catch (e) {
        console.log(`Network error for ${modelName}:`, e.message);
    }
};

const runTests = async () => {
    const models = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-pro"
    ];
    for (const m of models) {
        await testModel(m);
    }
    console.log("\n=== Testing Complete ===");
};

runTests();
