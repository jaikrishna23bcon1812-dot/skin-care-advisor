// AI Skin Care Advisor - Main Script

console.log("AI Skin Care Advisor loaded");

// Check if user is logged in
const token = localStorage.getItem("token");
if (token) {
    console.log("User is logged in");
}