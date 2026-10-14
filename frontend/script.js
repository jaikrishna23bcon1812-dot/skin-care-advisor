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

// ============ PROGRESS TRACKING (ENHANCED) ============

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
    // Streak calculation
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

    // This week average
    const oneWeekAgo = Date.now() - 7 * 86400000;
    const weekEntries = entries.filter(e => new Date(e.date).getTime() >= oneWeekAgo);
    const weekAvg = weekEntries.length > 0
        ? (weekEntries.reduce((sum, e) => sum + e.rating, 0) / weekEntries.length).toFixed(1)
        : "0.0";

    // Update UI
    const streakEl = document.getElementById("streakValue");
    const weekAvgEl = document.getElementById("weekAvg");
    const totalEl = document.getElementById("totalCount");

    if (streakEl) streakEl.textContent = streak;
    if (weekAvgEl) weekAvgEl.textContent = weekAvg;
    if (totalEl) totalEl.textContent = entries.length;
}

// Chart type toggle
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

// Export CSV
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

    // Category filter
    document.querySelectorAll("#categoryFilter .filter-chip").forEach(btn => {
        btn.addEventListener("click", function () {
            document.querySelectorAll("#categoryFilter .filter-chip").forEach(b => b.classList.remove("active"));
            this.classList.add("active");
            currentCategory = this.dataset.value;
            renderProducts();
        });
    });

    // Skin type filter
    document.querySelectorAll("#skinTypeFilter .filter-chip").forEach(btn => {
        btn.addEventListener("click", function () {
            document.querySelectorAll("#skinTypeFilter .filter-chip").forEach(b => b.classList.remove("active"));
            this.classList.add("active");
            currentSkinType = this.dataset.value;
            renderProducts();
        });
    });

    // Search
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", function () {
            searchTerm = this.value.toLowerCase().trim();
            renderProducts();
        });
    }
}

// ============ BACK TO TOP BUTTON ============
(function () {
    // Create the button
    const btn = document.createElement("button");
    btn.className = "back-to-top";
    btn.innerHTML = "⬆️";
    btn.title = "Back to top";
    btn.setAttribute("aria-label", "Back to top");
    document.body.appendChild(btn);

    // Show/hide on scroll
    window.addEventListener("scroll", function () {
        if (window.scrollY > 400) {
            btn.classList.add("visible");
        } else {
            btn.classList.remove("visible");
        }
    });

    // Scroll to top on click
    btn.addEventListener("click", function () {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
})();

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

    // Tab switching
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

            // Clear result when switching
            document.getElementById("analysisResult").textContent = "";
        });
    });

    // Click to upload
    photoUploadArea.addEventListener("click", function (e) {
        if (e.target.id === "removePhoto") return;
        if (uploadedImageBase64) return; // already uploaded
        photoInput.click();
    });

    // File selected
    photoInput.addEventListener("change", function (e) {
        const file = e.target.files[0];
        if (file) handlePhoto(file);
    });

    // Drag and drop
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
        // Validate
        if (!file.type.startsWith("image/")) {
            showToast("Please upload an image file", "error");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast("Image too large. Max 5MB", "error");
            return;
        }

        // Convert to base64
        const reader = new FileReader();
        reader.onload = function (e) {
            uploadedImageBase64 = e.target.result;
            previewImage.src = uploadedImageBase64;
            uploadPlaceholder.style.display = "none";
            uploadPreview.style.display = "flex";
            analyzePhotoBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    }

    // Remove photo
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

    // Analyze photo
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
                const response = await fetch("https://skin-care-api.onrender.com/api/analysis/analyze-photo", {
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