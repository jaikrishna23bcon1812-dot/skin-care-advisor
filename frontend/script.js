// AI Skin Care Advisor - Frontend Script
// Connects to backend API at localhost:5000

const API_URL = "http://localhost:5000/api";

// ============ REGISTER ============
const registerForm = document.getElementById("registerForm");
if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const name = document.getElementById("regName").value.trim();
        const email = document.getElementById("regEmail").value.trim();
        const password = document.getElementById("regPassword").value.trim();

        if (name === "" || email === "" || password === "") {
            alert("Please fill all fields");
            return;
        }

        if (password.length < 6) {
            alert("Password must be at least 6 characters");
            return;
        }

        try {
            const response = await fetch(API_URL + "/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Registration failed");
                return;
            }

            alert("Account created successfully! Please login.");
            window.location.href = "login.html";

        } catch (error) {
            console.log(error);
            alert("Cannot connect to server. Make sure backend is running.");
        }
    });
}

// ============ LOGIN ============
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value.trim();

        if (email === "" || password === "") {
            alert("Please fill all fields");
            return;
        }

        try {
            const response = await fetch(API_URL + "/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Login failed");
                return;
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            alert("Login successful! Welcome " + data.user.name);
            window.location.href = "dashboard.html";

        } catch (error) {
            console.log(error);
            alert("Cannot connect to server. Make sure backend is running.");
        }
    });
}

// ============ DASHBOARD PROTECTION ============
const dashboardSection = document.querySelector(".dashboard-section");
if (dashboardSection) {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token || !user) {
        alert("Please login first");
        window.location.href = "login.html";
    } else {
        const userData = JSON.parse(user);
        const heading = dashboardSection.querySelector("h1");
        if (heading) {
            heading.textContent = "Welcome, " + userData.name + "!";
        }
    }
}

// ============ LOGOUT ============
document.addEventListener("click", function (e) {
    if (e.target && e.target.id === "logoutBtn") {
        e.preventDefault();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        alert("Logged out successfully");
        window.location.href = "index.html";
    }
});