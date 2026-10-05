require("dotenv").config();
const API_KEY = process.env.GEMINI_API_KEY;

const testModel = async (modelName) => {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Say hello in one word" }] }]
            })
        });
        const data = await response.json();
        console.log(`\n=== Testing ${modelName} ===`);
        console.log("Status:", response.status);
        if (response.ok) {
            console.log("SUCCESS:", data.candidates[0].content.parts[0].text);
        } else {
            console.log("ERROR:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.log(`Error with ${modelName}:`, e.message);
    }
};

const runTests = async () => {
    const models = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-pro",
        "gemini-2.5-pro",
        "gemini-3.8-flash"
    ];
    for (const m of models) {
        await testModel(m);
    }
};

runTests();
