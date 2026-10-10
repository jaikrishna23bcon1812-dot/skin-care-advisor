// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = "info") {
    let container = document.querySelector(".toast-container");
    if (!container) {
        container = document.createElement("div");
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = "toast " + type;

    const icons = { success: "✅", error: "❌", info: "ℹ️" };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || "ℹ️"}</span>
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove("removing");
        toast.classList.add("removing");
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ===== DARK MODE TOGGLE =====
(function () {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
        document.body.classList.add("dark-mode");
    }
})();

window.addEventListener("DOMContentLoaded", function () {
    const btn = document.getElementById("themeToggle");
    const icon = document.getElementById("themeIcon");

    if (!btn || !icon) return;

    if (document.body.classList.contains("dark-mode")) {
        icon.textContent = "☀️";
    }

    btn.addEventListener("click", function () {
        document.body.classList.toggle("dark-mode");

        if (document.body.classList.contains("dark-mode")) {
            icon.textContent = "☀️";
            localStorage.setItem("theme", "dark");
        } else {
            icon.textContent = "🌙";
            localStorage.setItem("theme", "light");
        }
    });
});

// ===== AI SKIN CARE ADVISOR - MAIN SCRIPT =====
const API_URL = "https://skin-care-api.onrender.com/api";

// ============ REGISTER ============
const registerForm = document.getElementById("registerForm");
if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const name = document.getElementById("regName").value.trim();
        const email = document.getElementById("regEmail").value.trim();
        const password = document.getElementById("regPassword").value.trim();

        if (name === "" || email === "" || password === "") {
            showToast("Please fill all fields", "error");
            return;
        }

        if (password.length < 6) {
            showToast("Password must be at least 6 characters", "error");
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
                showToast(data.error || "Registration failed", "error");
                return;
            }

            showToast("Account created! Please login.", "success");
            setTimeout(() => window.location.href = "login.html", 1000);

        } catch (error) {
            console.log(error);
            showToast("Cannot connect to server", "error");
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
            showToast("Please fill all fields", "error");
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
                showToast(data.error || "Login failed", "error");
                return;
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            showToast("Welcome " + data.user.name + "!", "success");
            setTimeout(() => window.location.href = "dashboard.html", 1000);

        } catch (error) {
            console.log(error);
            showToast("Cannot connect to server", "error");
        }
    });
}

// ============ DASHBOARD PROTECTION ============
const dashboardSection = document.querySelector(".dashboard-section");
if (dashboardSection) {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token || !user) {
        showToast("Please login first", "error");
        setTimeout(() => window.location.href = "login.html", 800);
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
        showToast("Logged out", "info");
        setTimeout(() => window.location.href = "index.html", 800);
    }
});

// ============ AI ANALYSIS ============
const analyzeBtn = document.getElementById("analyzeBtn");
if (analyzeBtn) {
    analyzeBtn.addEventListener("click", async function () {
        const concern = document.getElementById("concernInput").value.trim();
        const resultBox = document.getElementById("analysisResult");

        if (concern === "") {
            showToast("Please enter your skin concern", "error");
            return;
        }

        const user = JSON.parse(localStorage.getItem("user") || "null");
        if (!user) {
            showToast("Please login first", "error");
            setTimeout(() => window.location.href = "login.html", 800);
            return;
        }

        resultBox.textContent = "Generating your personalized routine... Please wait 10-20 seconds.";
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<span class="loading-spinner"></span> Generating...';

        try {
            const response = await fetch("https://skin-care-api.onrender.com/api/analysis/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ concern, userId: user.id })
            });

            const data = await response.json();

            if (!response.ok) {
                resultBox.textContent = data.error || "Something went wrong";
            } else {
                resultBox.textContent = data.routine;
                showToast("Routine generated!", "success");
            }

        } catch (error) {
            console.log(error);
            resultBox.textContent = "Cannot connect to server. Make sure backend is running.";
            showToast("Connection error", "error");
        } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = "Get Routine";
        }
    });
}

// ============ PROGRESS TRACKING ============

function getUserId() {
    const user = localStorage.getItem("user");
    if (!user) {
        showToast("Please login first", "error");
        setTimeout(() => window.location.href = "login.html", 800);
        return null;
    }
    return JSON.parse(user).id;
}

let progressChart;
const ctx = document.getElementById("progressChart");

if (ctx) {
    progressChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: "Skin Rating",
                data: [],
                borderColor: "#d81b60",
                backgroundColor: "rgba(216, 27, 96, 0.1)",
                borderWidth: 2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    min: 1,
                    max: 5,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
}

async function loadProgress() {
    const userId = getUserId();
    if (!userId) return;

    const progressList = document.getElementById("progressList");
    const chartContainer = document.querySelector(".chart-container");

    try {
        const response = await fetch(`${API_URL}/progress/${userId}`);
        const data = await response.json();

        if (!response.ok) {
            showToast(data.error || "Failed to load", "error");
            return;
        }

        if (!data.entries || data.entries.length === 0) {
            progressList.innerHTML = "<p style='text-align:center;color:#666;'>No progress logged yet.</p>";
            chartContainer.style.display = "none";
            return;
        }

        const labels = data.entries.map(e =>
            new Date(e.date).toLocaleDateString()
        );
        const ratings = data.entries.map(e => e.rating);

        progressChart.data.labels = labels;
        progressChart.data.datasets[0].data = ratings;
        progressChart.update();
        chartContainer.style.display = "block";

        progressList.innerHTML = data.entries
            .map(entry => `
        <div class="progress-item" id="progress-${entry._id}">
          <div class="info">
            <h4>${new Date(entry.date).toLocaleDateString()}</h4>
            <p>${entry.notes}</p>
          </div>
          <div class="rating">${entry.rating} ⭐</div>
          <button onclick="deleteProgress('${entry._id}')">Delete</button>
        </div>
      `)
            .join("");

    } catch (error) {
        console.log(error);
        showToast("Error loading progress", "error");
    }
}

const addProgressBtn = document.getElementById("addProgressBtn");
if (addProgressBtn) {
    addProgressBtn.addEventListener("click", async function () {
        const userId = getUserId();
        if (!userId) return;

        const date = document.getElementById("progressDate").value;
        const rating = document.getElementById("progressRating").value;
        const notes = document.getElementById("progressNotes").value.trim();

        if (!date || !notes) {
            showToast("Please fill all fields", "error");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/progress/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, date, rating, notes })
            });

            const data = await response.json();

            if (!response.ok) {
                showToast(data.error || "Failed to save", "error");
                return;
            }

            showToast("Progress saved!", "success");
            document.getElementById("progressDate").value = "";
            document.getElementById("progressNotes").value = "";
            loadProgress();

        } catch (error) {
            console.log(error);
            showToast("Error saving progress", "error");
        }
    });
}

async function deleteProgress(id) {
    if (!confirm("Delete this entry?")) return;

    try {
        const response = await fetch(`${API_URL}/progress/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            showToast("Error deleting", "error");
            return;
        }

        document.getElementById(`progress-${id}`).remove();
        showToast("Entry deleted", "info");
        progressChart.update();

    } catch (error) {
        console.log(error);
        showToast("Error deleting progress", "error");
    }
}

if (document.getElementById("progressList")) {
    loadProgress();
}

// ============ PROFILE PAGE ============
const profileName = document.getElementById("profileName");
const editProfileBtn = document.getElementById("editProfileBtn");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const cancelProfileBtn = document.getElementById("cancelProfileBtn");

if (profileName) {
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (!user) {
        showToast("Please login first", "error");
        setTimeout(() => window.location.href = "login.html", 800);
    } else {
        profileName.value = user.name || "";
        document.getElementById("profileEmail").value = user.email || "";
        document.getElementById("profileMemberSince").value = "2026";
        document.getElementById("avatarCircle").textContent = (user.name || "U")[0].toUpperCase();
    }

    editProfileBtn.addEventListener("click", function () {
        profileName.disabled = false;
        profileName.focus();
        editProfileBtn.style.display = "none";
        saveProfileBtn.style.display = "inline-block";
        cancelProfileBtn.style.display = "inline-block";
    });

    cancelProfileBtn.addEventListener("click", function () {
        const user = JSON.parse(localStorage.getItem("user") || "null");
        profileName.value = user.name;
        profileName.disabled = true;
        editProfileBtn.style.display = "inline-block";
        saveProfileBtn.style.display = "none";
        cancelProfileBtn.style.display = "none";
    });

    saveProfileBtn.addEventListener("click", function () {
        const newName = profileName.value.trim();

        if (newName.length < 2) {
            showToast("Name must be at least 2 characters", "error");
            return;
        }

        const user = JSON.parse(localStorage.getItem("user") || "null");
        user.name = newName;
        localStorage.setItem("user", JSON.stringify(user));

        profileName.disabled = true;
        editProfileBtn.style.display = "inline-block";
        saveProfileBtn.style.display = "none";
        cancelProfileBtn.style.display = "none";

        showToast("Profile updated!", "success");
    });
}