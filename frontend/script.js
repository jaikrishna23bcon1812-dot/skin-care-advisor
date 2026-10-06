// AI Skin Care Advisor - Frontend Script
// Connects to backend API at localhost:5000

const API_URL = "https://skin-care-advisor.onrender.com/api";

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

// ============ AI ANALYSIS ============
const analyzeBtn = document.getElementById("analyzeBtn");
if (analyzeBtn) {
    analyzeBtn.addEventListener("click", async function () {
        const concern = document.getElementById("concernInput").value.trim();
        const resultBox = document.getElementById("analysisResult");

        if (concern === "") {
            alert("Please enter your skin concern");
            return;
        }

        const user = JSON.parse(localStorage.getItem("user") || "null");
        if (!user) {
            alert("Please login first");
            window.location.href = "login.html";
            return;
        }

        resultBox.textContent = "Generating your personalized routine... Please wait 10-20 seconds.";
        analyzeBtn.disabled = true;
        analyzeBtn.textContent = "Generating...";

        try {
            const response = await fetch("https://skin-care-advisor.onrender.com/api/analysis/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ concern, userId: user.id })
            });

            const data = await response.json();

            if (!response.ok) {
                resultBox.textContent = data.error || "Something went wrong";
            } else {
                resultBox.textContent = data.routine;
            }

        } catch (error) {
            console.log(error);
            resultBox.textContent = "Cannot connect to server. Make sure backend is running.";
        } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = "Get Routine";
        }
    });
}

// ============ PROGRESS TRACKING =============

// Function to get user ID
function getUserId() {
    const user = localStorage.getItem("user");
    if (!user) {
        alert("Please login first");
        window.location.href = "login.html";
        return null;
    }
    return JSON.parse(user).id;
}

// Initialize chart
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

// Load progress
async function loadProgress() {
    const userId = getUserId();
    if (!userId) return;

    const progressList = document.getElementById("progressList");
    const chartContainer = document.querySelector(".chart-container");

    try {
        const response = await fetch(`${API_URL}/progress/${userId}`);
        const data = await response.json();

        if (!response.ok) {
            alert(data.error);
            return;
        }

        if (!data.entries || data.entries.length === 0) {
            progressList.innerHTML = "<p style='text-align:center;color:#666;'>No progress logged yet.</p>";
            chartContainer.style.display = "none";
            return;
        }

        // Update chart
        const labels = data.entries.map(e =>
            new Date(e.date).toLocaleDateString()
        );
        const ratings = data.entries.map(e => e.rating);

        progressChart.data.labels = labels;
        progressChart.data.datasets[0].data = ratings;
        progressChart.update();
        chartContainer.style.display = "block";

        // Update list
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
        alert("Error loading progress");
    }
}

// Add progress
const addProgressBtn = document.getElementById("addProgressBtn");
if (addProgressBtn) {
    addProgressBtn.addEventListener("click", async function () {
        const userId = getUserId();
        if (!userId) return;

        const date = document.getElementById("progressDate").value;
        const rating = document.getElementById("progressRating").value;
        const notes = document.getElementById("progressNotes").value.trim();

        if (!date || !notes) {
            alert("Please fill all fields");
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
                alert(data.error);
                return;
            }

            alert("Progress saved!");
            // Clear form
            document.getElementById("progressDate").value = "";
            document.getElementById("progressNotes").value = "";
            // Reload progress
            loadProgress();

        } catch (error) {
            console.log(error);
            alert("Error saving progress");
        }
    });
}

// Delete progress
async function deleteProgress(id) {
    if (!confirm("Delete this entry?")) return;

    try {
        const response = await fetch(`${API_URL}/progress/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            alert("Error deleting");
            return;
        }

        document.getElementById(`progress-${id}`).remove();
        progressChart.update();

    } catch (error) {
        console.log(error);
        alert("Error deleting progress");
    }
}

// Load progress when page loads
if (document.getElementById("progressList")) {
    loadProgress();
}