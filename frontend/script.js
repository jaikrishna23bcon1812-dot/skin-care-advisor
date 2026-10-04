// AI Skin Care Advisor - Main Script

console.log("AI Skin Care Advisor loaded");

// ============ REGISTER ============
const registerForm = document.getElementById("registerForm");
if (registerForm) {
    registerForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const name = document.getElementById("regName").value.trim();
        const email = document.getElementById("regEmail").value.trim();
        const password = document.getElementById("regPassword").value.trim();

        // Validation
        if (name === "" || email === "" || password === "") {
            alert("Please fill all fields");
            return;
        }

        if (name.length < 3) {
            alert("Name must be at least 3 characters");
            return;
        }

        if (!email.includes("@") || !email.includes(".")) {
            alert("Please enter a valid email");
            return;
        }

        if (password.length < 6) {
            alert("Password must be at least 6 characters");
            return;
        }

        // Check if user already exists
        const existingUser = localStorage.getItem("user_" + email);
        if (existingUser) {
            alert("This email is already registered. Please login.");
            return;
        }

        // Save user
        const user = { name, email, password };
        localStorage.setItem("user_" + email, JSON.stringify(user));

        alert("Account created successfully! Please login.");
        window.location.href = "login.html";
    });
}

// ============ LOGIN ============
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value.trim();

        // Validation
        if (email === "" || password === "") {
            alert("Please fill all fields");
            return;
        }

        // Check if user exists
        const storedUser = localStorage.getItem("user_" + email);
        if (!storedUser) {
            alert("No account found with this email. Please register first.");
            return;
        }

        const user = JSON.parse(storedUser);

        // Check password
        if (user.password !== password) {
            alert("Wrong password. Please try again.");
            return;
        }

        // Login successful
        localStorage.setItem("loggedInUser", JSON.stringify(user));
        alert("Login successful! Welcome " + user.name);
        window.location.href = "dashboard.html";
    });
}

// ============ DASHBOARD PROTECTION ============
const dashboardSection = document.querySelector(".dashboard-section");
if (dashboardSection) {
    const loggedInUser = localStorage.getItem("loggedInUser");
    if (!loggedInUser) {
        alert("Please login first");
        window.location.href = "login.html";
    } else {
        const user = JSON.parse(loggedInUser);
        // Change heading to welcome user
        const heading = dashboardSection.querySelector("h1");
        if (heading) {
            heading.textContent = "Welcome, " + user.name + "!";
        }
    }
}

// ============ LOGOUT ============
document.addEventListener("click", function (e) {
    if (e.target && e.target.id === "logoutBtn") {
        e.preventDefault();
        localStorage.removeItem("loggedInUser");
        alert("Logged out successfully");
        window.location.href = "index.html";
    }
});