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

// ============ AI ANALYSIS (TEXT MODE) ============
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
            const response = await fetch(API_URL + "/analysis/generate", {
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
            resultBox.textContent = "Cannot connect to server. Please try again.";
            showToast("Connection error", "error");
        } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = "Get Routine";
        }
    });
}

// ============ PHOTO UPLOAD ANALYSIS ============
const analysisTabs = document.querySelectorAll(".analysis-tab");
const textMode = document.getElementById("textMode");
const photoMode = document.getElementById("photoMode");
const photoUploadArea = document.getElementById("photoUploadArea");
const photoInput = document.getElementById("photoInput");
const uploadPlaceholder = document.getElementById("uploadPlaceholder");
const uploadPreview = document.getElementById("uploadPreview");
const previewImage = document.getElementById("previewImage");
const removePhoto = document.getElementById("removePhoto");
const analyzePhotoBtn = document.getElementById("analyzePhotoBtn");

if (analysisTabs.length > 0) {
    let uploadedImageBase64 = null;

    analysisTabs.forEach(tab => {
        tab.addEventListener("click", function () {
            const mode = this.dataset.mode;

            analysisTabs.forEach(t => t.classList.remove("active"));
            this.classList.add("active");

            if (mode === "text") {
                textMode.classList.add("active");
                photoMode.classList.remove("active");
            } else {
                photoMode.classList.add("active");
                textMode.classList.remove("active");
            }

            document.getElementById("analysisResult").textContent = "";
        });
    });

    photoUploadArea.addEventListener("click", function (e) {
        if (e.target.id === "removePhoto") return;
        if (uploadedImageBase64) return;
        photoInput.click();
    });

    photoInput.addEventListener("change", function (e) {
        const file = e.target.files[0];
        if (file) handlePhoto(file);
    });

    photoUploadArea.addEventListener("dragover", function (e) {
        e.preventDefault();
        this.classList.add("dragover");
    });

    photoUploadArea.addEventListener("dragleave", function () {
        this.classList.remove("dragover");
    });

    photoUploadArea.addEventListener("drop", function (e) {
        e.preventDefault();
        this.classList.remove("dragover");
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
            handlePhoto(file);
        }
    });

    function handlePhoto(file) {
        if (!file.type.startsWith("image/")) {
            showToast("Please upload an image file", "error");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            showToast("Image too large. Max 10MB", "error");
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement("canvas");
                const MAX_SIZE = 600;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_SIZE) {
                        height = Math.round((height * MAX_SIZE) / width);
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width = Math.round((width * MAX_SIZE) / height);
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                uploadedImageBase64 = canvas.toDataURL("image/jpeg", 0.6);

                const sizeKB = Math.round(uploadedImageBase64.length / 1024);
                console.log("Resized image size:", sizeKB, "KB");

                previewImage.src = uploadedImageBase64;
                uploadPlaceholder.style.display = "none";
                uploadPreview.style.display = "flex";
                analyzePhotoBtn.disabled = false;

                if (sizeKB > 500) {
                    showToast("Image too large. Try a smaller photo.", "error");
                    analyzePhotoBtn.disabled = true;
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    if (removePhoto) {
        removePhoto.addEventListener("click", function (e) {
            e.stopPropagation();
            uploadedImageBase64 = null;
            photoInput.value = "";
            uploadPlaceholder.style.display = "block";
            uploadPreview.style.display = "none";
            analyzePhotoBtn.disabled = true;
        });
    }

    if (analyzePhotoBtn) {
        analyzePhotoBtn.addEventListener("click", async function () {
            if (!uploadedImageBase64) {
                showToast("Please upload a photo first", "error");
                return;
            }

            const user = JSON.parse(localStorage.getItem("user") || "null");
            if (!user) {
                showToast("Please login first", "error");
                setTimeout(() => window.location.href = "login.html", 800);
                return;
            }

            const resultBox = document.getElementById("analysisResult");
            resultBox.textContent = "Analyzing your photo with AI... This may take 20-40 seconds.";
            analyzePhotoBtn.disabled = true;
            analyzePhotoBtn.innerHTML = '<span class="loading-spinner"></span> Analyzing...';

            try {
                const response = await fetch(API_URL + "/analysis/analyze-photo", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        image: uploadedImageBase64,
                        userId: user.id
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    resultBox.textContent = data.error || "Analysis failed. Try again.";
                    showToast(data.error || "Analysis failed", "error");
                } else {
                    resultBox.textContent = data.routine;
                    showToast("Analysis complete!", "success");
                }

            } catch (error) {
                console.log(error);
                resultBox.textContent = "Cannot connect to server. Please try again.";
                showToast("Connection error", "error");
            } finally {
                analyzePhotoBtn.disabled = false;
                analyzePhotoBtn.textContent = "Analyze Photo";
            }
        });
    }
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
let currentChartType = "line";
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
                backgroundColor: "rgba(216, 27, 96, 0.15)",
                borderWidth: 3,
                fill: true,
                tension: 0.3,
                pointBackgroundColor: "#d81b60",
                pointRadius: 5
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
            },
            plugins: {
                legend: { display: false }
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
            progressList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <h3>No entries yet</h3>
                    <p>Start logging your skin journey by adding your first entry above!</p>
                </div>
            `;
            if (chartContainer) chartContainer.style.display = "none";
            updateSummaryStats([]);
            return;
        }

        const labels = data.entries.map(e =>
            new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        );
        const ratings = data.entries.map(e => e.rating);

        progressChart.data.labels = labels;
        progressChart.data.datasets[0].data = ratings;
        progressChart.update();
        if (chartContainer) chartContainer.style.display = "block";

        progressList.innerHTML = data.entries
            .slice()
            .reverse()
            .map(entry => `
                <div class="progress-item" id="progress-${entry._id}">
                    <div class="info">
                        <h4>${new Date(entry.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</h4>
                        <p>${entry.notes}</p>
                    </div>
                    <div class="rating">${entry.rating} ⭐</div>
                    <button onclick="deleteProgress('${entry._id}')">Delete</button>
                </div>
            `)
            .join("");

        updateSummaryStats(data.entries);

    } catch (error) {
        console.log(error);
        showToast("Error loading progress", "error");
    }
}

function updateSummaryStats(entries) {
    let streak = 0;
    if (entries.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dates = entries.map(e => {
            const d = new Date(e.date);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
        }).sort((a, b) => b - a);

        const uniqueDates = [...new Set(dates)];
        let expectedDate = today.getTime();

        for (const date of uniqueDates) {
            if (date === expectedDate) {
                streak++;
                expectedDate -= 86400000;
            } else if (date === expectedDate + 86400000) {
                streak++;
                expectedDate = date - 86400000;
            } else {
                break;
            }
        }
    }

    const oneWeekAgo = Date.now() - 7 * 86400000;
    const weekEntries = entries.filter(e => new Date(e.date).getTime() >= oneWeekAgo);
    const weekAvg = weekEntries.length > 0
        ? (weekEntries.reduce((sum, e) => sum + e.rating, 0) / weekEntries.length).toFixed(1)
        : "0.0";

    const streakEl = document.getElementById("streakValue");
    const weekAvgEl = document.getElementById("weekAvg");
    const totalEl = document.getElementById("totalCount");

    if (streakEl) streakEl.textContent = streak;
    if (weekAvgEl) weekAvgEl.textContent = weekAvg;
    if (totalEl) totalEl.textContent = entries.length;
}

document.querySelectorAll(".chart-toggle-btn").forEach(btn => {
    btn.addEventListener("click", function () {
        const type = this.dataset.type;
        if (type === currentChartType) return;

        currentChartType = type;
        document.querySelectorAll(".chart-toggle-btn").forEach(b => b.classList.remove("active"));
        this.classList.add("active");

        progressChart.config.type = type;
        progressChart.update();
    });
});

const exportBtn = document.getElementById("exportBtn");
if (exportBtn) {
    exportBtn.addEventListener("click", async function () {
        const userId = getUserId();
        if (!userId) return;

        try {
            const response = await fetch(`${API_URL}/progress/${userId}`);
            const data = await response.json();

            if (!data.entries || data.entries.length === 0) {
                showToast("No data to export", "error");
                return;
            }

            let csv = "Date,Rating,Notes\n";
            data.entries.forEach(entry => {
                const cleanNotes = entry.notes.replace(/"/g, '""');
                csv += `"${entry.date}",${entry.rating},"${cleanNotes}"\n`;
            });

            const blob = new Blob([csv], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `skincare-progress-${new Date().toISOString().split("T")[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);

            showToast("Data exported!", "success");

        } catch (error) {
            console.log(error);
            showToast("Export failed", "error");
        }
    });
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
        loadProgress();

    } catch (error) {
        console.log(error);
        showToast("Error deleting progress", "error");
    }
}

if (document.getElementById("progressList")) {
    loadProgress();
}

// ============ DASHBOARD STATS ============
const statsGrid = document.querySelector(".stats-grid");
if (statsGrid) {
    loadStats();
}

async function loadStats() {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user) return;

    try {
        const response = await fetch(`${API_URL}/progress/stats/${user.id}`);
        const data = await response.json();

        if (!response.ok) {
            console.log("Failed to load stats");
            return;
        }

        animateValue("statAnalyses", 0, data.totalAnalyses, 800);
        animateValue("statEntries", 0, data.totalEntries, 800);
        animateValue("statStreak", 0, data.streak, 800);
        animateValue("statRating", 0, parseFloat(data.avgRating), 800, true);

    } catch (error) {
        console.log(error);
    }
}

function animateValue(id, start, end, duration, isDecimal = false) {
    const el = document.getElementById(id);
    if (!el) return;

    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const value = start + (end - start) * progress;

        el.textContent = isDecimal ? value.toFixed(1) : Math.floor(value);

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            el.textContent = isDecimal ? end.toFixed(1) : end;
        }
    }

    requestAnimationFrame(update);
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

// ============ SETTINGS PAGE ============
const settingsName = document.getElementById("settingsName");
if (settingsName) {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user) {
        showToast("Please login first", "error");
        setTimeout(() => window.location.href = "login.html", 800);
    } else {
        settingsName.textContent = user.name || "Not set";
        document.getElementById("settingsEmail").textContent = user.email || "Not set";
    }

    const darkToggle = document.getElementById("settingsDarkMode");
    if (darkToggle) {
        darkToggle.checked = document.body.classList.contains("dark-mode");
        darkToggle.addEventListener("change", function () {
            if (this.checked) {
                document.body.classList.add("dark-mode");
                localStorage.setItem("theme", "dark");
                const icon = document.getElementById("themeIcon");
                if (icon) icon.textContent = "☀️";
            } else {
                document.body.classList.remove("dark-mode");
                localStorage.setItem("theme", "light");
                const icon = document.getElementById("themeIcon");
                if (icon) icon.textContent = "🌙";
            }
        });
    }

    ["notifDaily", "notifWeekly", "notifProducts"].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.checked = localStorage.getItem(id) === "true";
            el.addEventListener("change", function () {
                localStorage.setItem(id, this.checked);
                showToast("Preference saved", "success");
            });
        }
    });

    const changePasswordBtn = document.getElementById("changePasswordBtn");
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener("click", function () {
            const current = document.getElementById("currentPassword").value.trim();
            const newPass = document.getElementById("newPassword").value.trim();
            const confirm = document.getElementById("confirmPassword").value.trim();

            if (!current || !newPass || !confirm) {
                showToast("Please fill all fields", "error");
                return;
            }

            if (newPass.length < 6) {
                showToast("New password must be at least 6 characters", "error");
                return;
            }

            if (newPass !== confirm) {
                showToast("Passwords do not match", "error");
                return;
            }

            showToast("Password change coming soon!", "info");

            document.getElementById("currentPassword").value = "";
            document.getElementById("newPassword").value = "";
            document.getElementById("confirmPassword").value = "";
        });
    }

    const logoutAllBtn = document.getElementById("logoutAllBtn");
    if (logoutAllBtn) {
        logoutAllBtn.addEventListener("click", function () {
            if (!confirm("Logout from all devices?")) return;

            localStorage.removeItem("token");
            localStorage.removeItem("user");
            showToast("Logged out from all devices", "success");
            setTimeout(() => window.location.href = "index.html", 1000);
        });
    }
}

// ============ PRODUCTS PAGE ============
const productsGrid = document.getElementById("productsGrid");
if (productsGrid) {
    let allProducts = [];
    let currentCategory = "all";
    let currentSkinType = "all";
    let searchTerm = "";

    loadProducts();

    async function loadProducts() {
        try {
            const response = await fetch(`${API_URL}/progress/products/list`);
            const data = await response.json();

            if (!response.ok) {
                productsGrid.innerHTML = '<p style="text-align:center;color:red;">Failed to load products</p>';
                return;
            }

            allProducts = data.products;
            renderProducts();

        } catch (error) {
            console.log(error);
            productsGrid.innerHTML = '<p style="text-align:center;color:red;">Cannot connect to server</p>';
        }
    }

    function renderProducts() {
        const filtered = allProducts.filter(p => {
            const matchCategory = currentCategory === "all" || p.category === currentCategory;
            const matchSkinType = currentSkinType === "all" || p.skinTypes.includes(currentSkinType) || p.skinTypes.includes("all");
            const matchSearch = p.name.toLowerCase().includes(searchTerm) || p.brand.toLowerCase().includes(searchTerm);
            return matchCategory && matchSkinType && matchSearch;
        });

        if (filtered.length === 0) {
            productsGrid.style.display = "none";
            document.getElementById("noProducts").style.display = "block";
            return;
        }

        productsGrid.style.display = "grid";
        document.getElementById("noProducts").style.display = "none";

        productsGrid.innerHTML = filtered.map(p => `
            <div class="product-card">
                <span class="product-category">${p.category}</span>
                <h3>${p.name}</h3>
                <div class="product-brand">${p.brand}</div>
                <p class="product-description">${p.description}</p>
                <div class="product-skin-types">
                    ${p.skinTypes.map(t => `<span class="skin-tag">${t}</span>`).join("")}
                </div>
                <div class="product-footer">
                    <span class="product-price">${p.price}</span>
                    <a href="${p.link}" target="_blank" class="product-buy-btn">
                        Buy →
                    </a>
                </div>
            </div>
        `).join("");
    }

    document.querySelectorAll("#categoryFilter .filter-chip").forEach(btn => {
        btn.addEventListener("click", function () {
            document.querySelectorAll("#categoryFilter .filter-chip").forEach(b => b.classList.remove("active"));
            this.classList.add("active");
            currentCategory = this.dataset.value;
            renderProducts();
        });
    });

    document.querySelectorAll("#skinTypeFilter .filter-chip").forEach(btn => {
        btn.addEventListener("click", function () {
            document.querySelectorAll("#skinTypeFilter .filter-chip").forEach(b => b.classList.remove("active"));
            this.classList.add("active");
            currentSkinType = this.dataset.value;
            renderProducts();
        });
    });

    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", function () {
            searchTerm = this.value.toLowerCase().trim();
            renderProducts();
        });
    }
}

// ============ BEFORE/AFTER COMPARISON ============
const beforeUploadArea = document.getElementById("beforeUploadArea");

if (beforeUploadArea) {
    let beforeImageData = null;
    let afterImageData = null;

    const beforeInput = document.getElementById("beforeInput");
    const afterInput = document.getElementById("afterInput");
    const beforePreview = document.getElementById("beforePreview");
    const afterPreview = document.getElementById("afterPreview");
    const beforePlaceholder = document.getElementById("beforePlaceholder");
    const afterPlaceholder = document.getElementById("afterPlaceholder");
    const afterUploadArea = document.getElementById("afterUploadArea");
    const saveBtn = document.getElementById("saveComparisonBtn");

    function resizeImage(file, maxSize = 800) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = new Image();
                img.onload = function () {
                    const canvas = document.createElement("canvas");
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxSize) {
                            height = Math.round((height * maxSize) / width);
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width = Math.round((width * maxSize) / height);
                            height = maxSize;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL("image/jpeg", 0.7));
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    beforeUploadArea.addEventListener("click", () => beforeInput.click());
    afterUploadArea.addEventListener("click", () => afterInput.click());

    beforeInput.addEventListener("change", async function (e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            beforeImageData = await resizeImage(file);
            beforePreview.src = beforeImageData;
            beforePreview.style.display = "block";
            beforePlaceholder.style.display = "none";
            checkReadyToSave();
        } catch (err) {
            showToast("Failed to process image", "error");
        }
    });

    afterInput.addEventListener("change", async function (e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            afterImageData = await resizeImage(file);
            afterPreview.src = afterImageData;
            afterPreview.style.display = "block";
            afterPlaceholder.style.display = "none";
            checkReadyToSave();
        } catch (err) {
            showToast("Failed to process image", "error");
        }
    });

    function checkReadyToSave() {
        saveBtn.disabled = !(beforeImageData && afterImageData);
    }

    saveBtn.addEventListener("click", async function () {
        const user = JSON.parse(localStorage.getItem("user") || "null");
        if (!user) {
            showToast("Please login first", "error");
            return;
        }

        const beforeDate = document.getElementById("beforeDateLabel").value.trim() || "Day 1";
        const afterDate = document.getElementById("afterDateLabel").value.trim() || "Today";
        const notes = document.getElementById("comparisonNotes").value.trim();

        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="loading-spinner"></span> Saving...';

        try {
            const response = await fetch(`${API_URL}/comparison/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    beforeImage: beforeImageData,
                    afterImage: afterImageData,
                    beforeDate,
                    afterDate,
                    notes
                })
            });

            const data = await response.json();

            if (response.ok) {
                showToast("Comparison saved!", "success");

                beforeImageData = null;
                afterImageData = null;
                beforePreview.style.display = "none";
                afterPreview.style.display = "none";
                beforePlaceholder.style.display = "block";
                afterPlaceholder.style.display = "block";
                beforeInput.value = "";
                afterInput.value = "";
                document.getElementById("comparisonNotes").value = "";
                saveBtn.disabled = true;

                loadComparisons();
            } else {
                showToast(data.error || "Failed to save", "error");
            }
        } catch (error) {
            console.log(error);
            showToast("Cannot connect to server", "error");
        } finally {
            saveBtn.textContent = "Save Comparison";
        }
    });

    async function loadComparisons() {
        const user = JSON.parse(localStorage.getItem("user") || "null");
        if (!user) return;

        const list = document.getElementById("comparisonsList");

        try {
            const response = await fetch(`${API_URL}/comparison/${user.id}`);
            const data = await response.json();

            if (!response.ok || !data.comparisons || data.comparisons.length === 0) {
                list.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📸</div>
                        <h3>No comparisons yet</h3>
                        <p>Upload your first before/after pair above!</p>
                    </div>
                `;
                return;
            }

            list.innerHTML = data.comparisons.map(c => `
                <div class="comparison-item" data-id="${c._id}">
                                        <div class="comparison-item" data-id="${c._id}">
                    <div class="comparison-header">
                        <h3>${c.title || "My Skin Journey"}</h3>
                        <span class="date-created">
                            Created ${new Date(c.createdAt).toLocaleDateString('en-IN')}
                        </span>
                        <button class="comparison-delete-btn" onclick="deleteComparison('${c._id}')">
                            Delete
                        </button>
                    </div>

                    <div class="comparison-slider" data-id="${c._id}">
                        <img class="before-img" src="${c.beforeImage}" alt="Before" />
                        <img class="after-img" src="${c.afterImage}" alt="After" style="clip-path: inset(0 0 0 50%);" />
                        <div class="slider-handle" style="left: 50%;"></div>
                        <span class="slider-label before-label">${c.beforeDate}</span>
                        <span class="slider-label after-label">${c.afterDate}</span>
                    </div>

                    ${c.notes ? `<p class="comparison-notes">"${c.notes}"</p>` : ""}
                </div>
            `).join("");

            document.querySelectorAll(".comparison-slider").forEach(setupSlider);

        } catch (error) {
            console.log(error);
            list.innerHTML = '<p style="text-align:center;color:red;">Failed to load comparisons</p>';
        }
    }

    function setupSlider(slider) {
        const afterImg = slider.querySelector(".after-img");
        const handle = slider.querySelector(".slider-handle");
        let isDragging = false;

        function setPosition(x) {
            const rect = slider.getBoundingClientRect();
            let percent = ((x - rect.left) / rect.width) * 100;
            percent = Math.max(0, Math.min(100, percent));

            afterImg.style.clipPath = `inset(0 0 0 ${percent}%)`;
            handle.style.left = percent + "%";
        }

        slider.addEventListener("mousedown", function (e) {
            isDragging = true;
            setPosition(e.clientX);
        });

        slider.addEventListener("touchstart", function (e) {
            isDragging = true;
            setPosition(e.touches[0].clientX);
        });

        window.addEventListener("mousemove", function (e) {
            if (isDragging) setPosition(e.clientX);
        });

        window.addEventListener("touchmove", function (e) {
            if (isDragging) setPosition(e.touches[0].clientX);
        });

        window.addEventListener("mouseup", function () {
            isDragging = false;
        });

        window.addEventListener("touchend", function () {
            isDragging = false;
        });
    }

    window.deleteComparison = async function (id) {
        if (!confirm("Delete this comparison?")) return;

        try {
            const response = await fetch(`${API_URL}/comparison/${id}`, {
                method: "DELETE"
            });

            if (response.ok) {
                showToast("Comparison deleted", "info");
                loadComparisons();
            }
        } catch (error) {
            console.log(error);
            showToast("Error deleting", "error");
        }
    };

    loadComparisons();
}

// ============ BACK TO TOP BUTTON ============
(function () {
    const btn = document.createElement("button");
    btn.className = "back-to-top";
    btn.innerHTML = "⬆️";
    btn.title = "Back to top";
    btn.setAttribute("aria-label", "Back to top");
    document.body.appendChild(btn);

    window.addEventListener("scroll", function () {
        if (window.scrollY > 400) {
            btn.classList.add("visible");
        } else {
            btn.classList.remove("visible");
        }
    });

    btn.addEventListener("click", function () {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
})();

// ============ EMAIL REMINDERS (SETTINGS) ============
const emailReminderToggle = document.getElementById("emailReminderToggle");

if (emailReminderToggle) {
    const reminderTimeRow = document.getElementById("reminderTimeRow");
    const reminderTimeInput = document.getElementById("reminderTimeInput");
    const testEmailBtn = document.getElementById("testEmailBtn");

    async function loadReminderPreferences() {
        const user = JSON.parse(localStorage.getItem("user") || "null");
        if (!user) return;

        try {
            const response = await fetch(`${API_URL}/reminder/preferences/${user.id}`);
            const data = await response.json();

            if (response.ok) {
                emailReminderToggle.checked = data.reminderEnabled;
                reminderTimeInput.value = data.reminderTime || "09:00";

                if (data.reminderEnabled) {
                    reminderTimeRow.style.display = "flex";
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

    loadReminderPreferences();

    emailReminderToggle.addEventListener("change", async function () {
        const user = JSON.parse(localStorage.getItem("user") || "null");
        if (!user) return;

        const enabled = this.checked;

        try {
            const response = await fetch(`${API_URL}/reminder/preferences`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    reminderEnabled: enabled,
                    reminderTime: reminderTimeInput.value
                })
            });

            const data = await response.json();

            if (response.ok) {
                if (enabled) {
                    reminderTimeRow.style.display = "flex";
                    showToast("Daily reminders enabled!", "success");
                } else {
                    reminderTimeRow.style.display = "none";
                    showToast("Reminders disabled", "info");
                }
            } else {
                showToast(data.error || "Failed to save", "error");
                this.checked = !enabled;
            }
        } catch (error) {
            console.log(error);
            showToast("Cannot connect to server", "error");
            this.checked = !enabled;
        }
    });

    if (reminderTimeInput) {
        reminderTimeInput.addEventListener("change", async function () {
            const user = JSON.parse(localStorage.getItem("user") || "null");
            if (!user) return;

            try {
                const response = await fetch(`${API_URL}/reminder/preferences`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId: user.id,
                        reminderTime: this.value
                    })
                });

                if (response.ok) {
                    showToast("Reminder time updated", "success");
                }
            } catch (error) {
                console.log(error);
            }
        });
    }

    if (testEmailBtn) {
        testEmailBtn.addEventListener("click", async function () {
            const user = JSON.parse(localStorage.getItem("user") || "null");
            if (!user) return;

            testEmailBtn.disabled = true;
            testEmailBtn.innerHTML = '<span class="loading-spinner"></span> Sending...';

            try {
                const response = await fetch(`${API_URL}/reminder/test/${user.id}`, {
                    method: "POST"
                });

                const data = await response.json();

                if (response.ok) {
                    showToast("Test email sent! Check your inbox.", "success");
                } else {
                    showToast(data.error || "Failed to send", "error");
                }
            } catch (error) {
                console.log(error);
                showToast("Cannot connect to server", "error");
            } finally {
                testEmailBtn.disabled = false;
                testEmailBtn.textContent = "Send Test";
            }
        });
    }
}

// ============ COMMUNITY FEED ============
const communityFeed = document.getElementById("communityFeed");

if (communityFeed) {
    loadCommunityPosts();

    const openShareModal = document.getElementById("openShareModal");
    const closeShareModal = document.getElementById("closeShareModal");
    const shareModal = document.getElementById("shareModal");

    if (openShareModal) {
        openShareModal.addEventListener("click", function () {
            shareModal.style.display = "flex";
        });
    }

    if (closeShareModal) {
        closeShareModal.addEventListener("click", function () {
            shareModal.style.display = "none";
        });
    }

    if (shareModal) {
        shareModal.addEventListener("click", function (e) {
            if (e.target === shareModal) {
                shareModal.style.display = "none";
            }
        });
    }

    const submitShare = document.getElementById("submitShare");
    if (submitShare) {
        submitShare.addEventListener("click", async function () {
            const user = JSON.parse(localStorage.getItem("user") || "null");
            if (!user) {
                showToast("Please login first", "error");
                return;
            }
            const title = document.getElementById("shareTitle").value.trim();
            const concern = document.getElementById("shareConcern").value.trim();
            const routine = document.getElementById("shareRoutine").value.trim();
            if (!title || !concern || !routine) {
                showToast("Please fill all fields", "error");
                return;
            }
            submitShare.disabled = true;
            submitShare.innerHTML = '<span class="loading-spinner"></span> Sharing...';
            try {
                const response = await fetch(`${API_URL}/community/add`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: user.id, title, concern, routine })
                });
                const data = await response.json();
                if (response.ok) {
                    showToast("Routine shared!", "success");
                    shareModal.style.display = "none";
                    document.getElementById("shareTitle").value = "";
                    document.getElementById("shareConcern").value = "";
                    document.getElementById("shareRoutine").value = "";
                    loadCommunityPosts();
                } else {
                    showToast(data.error || "Failed to share", "error");
                }
            } catch (error) {
                console.log(error);
                showToast("Cannot connect to server", "error");
            } finally {
                submitShare.disabled = false;
                submitShare.textContent = "Share with Community";
            }
        });
    }

    async function loadCommunityPosts() {
        try {
            const response = await fetch(`${API_URL}/community/posts`);
            const data = await response.json();
            if (!response.ok || !data.posts || data.posts.length === 0) {
                communityFeed.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">💬</div>
                        <h3>No posts yet</h3>
                        <p>Be the first to share your skincare routine!</p>
                    </div>
                `;
                return;
            }
            const user = JSON.parse(localStorage.getItem("user") || "null");
            const userId = user ? user.id : null;
            communityFeed.innerHTML = data.posts.map(post => {
                const isLiked = userId && post.likes.includes(userId);
                const isOwn = userId && post.userId === userId;
                const timeAgo = getTimeAgo(post.createdAt);
                const initial = post.userName ? post.userName[0].toUpperCase() : "U";
                return `
                    <div class="post-card" data-id="${post._id}">
                        <div class="post-header">
                            <div class="post-avatar">${initial}</div>
                            <div class="post-user-info">
                                <h4>${post.userName}</h4>
                                <span>${timeAgo}</span>
                            </div>
                        </div>
                        <h3 class="post-title">${escapeHtml(post.title)}</h3>
                        <span class="post-concern">${escapeHtml(post.concern)}</span>
                        <div class="post-routine">${escapeHtml(post.routine)}</div>
                        <div class="post-actions">
                            <button class="post-action-btn ${isLiked ? "liked" : ""}" onclick="toggleLike('${post._id}')">
                                ${isLiked ? "❤️" : "🤍"} <span>${post.likes.length}</span>
                            </button>
                            <button class="post-action-btn" onclick="toggleComments('${post._id}')">
                                💬 <span>${post.comments.length}</span>
                            </button>
                            ${isOwn ? `<button class="post-action-btn delete" onclick="deletePost('${post._id}')">🗑️ Delete</button>` : ""}
                        </div>
                        <div class="comments-section" id="comments-${post._id}">
                            <div id="comments-list-${post._id}">
                                ${post.comments.length === 0 ? '<p style="color: #999; font-size: 0.9rem; text-align: center; padding: 10px 0;">No comments yet</p>' : ""}
                                ${post.comments.map(c => `
                                    <div class="comment-item">
                                        <div class="comment-avatar">${c.userName[0].toUpperCase()}</div>
                                        <div class="comment-content">
                                            <strong>${c.userName}</strong>
                                            <p>${escapeHtml(c.text)}</p>
                                        </div>
                                    </div>
                                `).join("")}
                            </div>
                            <div class="comment-form">
                                <input type="text" id="comment-input-${post._id}" placeholder="Add a comment..." maxlength="500">
                                <button onclick="addComment('${post._id}')">Post</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join("");
        } catch (error) {
            console.log(error);
            communityFeed.innerHTML = '<p style="text-align:center;color:red;">Failed to load posts</p>';
        }
    }

    function escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    function getTimeAgo(date) {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return "just now";
        if (seconds < 3600) return Math.floor(seconds / 60) + "m ago";
        if (seconds < 86400) return Math.floor(seconds / 3600) + "h ago";
        if (seconds < 604800) return Math.floor(seconds / 86400) + "d ago";
        return new Date(date).toLocaleDateString('en-IN');
    }

    window.toggleLike = async function (postId) {
        const user = JSON.parse(localStorage.getItem("user") || "null");
        if (!user) {
            showToast("Please login first", "error");
            return;
        }
        try {
            const response = await fetch(`${API_URL}/community/like/${postId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id })
            });
            if (response.ok) {
                loadCommunityPosts();
            }
        } catch (error) {
            console.log(error);
        }
    };

    window.toggleComments = function (postId) {
        const section = document.getElementById("comments-" + postId);
        if (section) {
            section.classList.toggle("expanded");
        }
    };

    window.addComment = async function (postId) {
        const user = JSON.parse(localStorage.getItem("user") || "null");
        if (!user) {
            showToast("Please login first", "error");
            return;
        }
        const input = document.getElementById("comment-input-" + postId);
        const text = input.value.trim();
        if (!text) {
            showToast("Please write a comment", "error");
            return;
        }
        try {
            const response = await fetch(`${API_URL}/community/comment/${postId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id, text })
            });
            const data = await response.json();
            if (response.ok) {
                showToast("Comment added", "success");
                input.value = "";
                loadCommunityPosts();
                setTimeout(() => {
                    const section = document.getElementById("comments-" + postId);
                    if (section) section.classList.add("expanded");
                }, 100);
            } else {
                showToast(data.error || "Failed to comment", "error");
            }
        } catch (error) {
            console.log(error);
            showToast("Cannot connect to server", "error");
        }
    };

    window.deletePost = async function (postId) {
        if (!confirm("Delete this post?")) return;
        const user = JSON.parse(localStorage.getItem("user") || "null");
        if (!user) return;
        try {
            const response = await fetch(`${API_URL}/community/post/${postId}?userId=${user.id}`, {
                method: "DELETE"
            });
            if (response.ok) {
                showToast("Post deleted", "info");
                loadCommunityPosts();
            } else {
                const data = await response.json();
                showToast(data.error || "Failed to delete", "error");
            }
        } catch (error) {
            console.log(error);
            showToast("Cannot connect to server", "error");
        }
    };
}