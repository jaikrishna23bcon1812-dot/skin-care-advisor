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

// ===== SKELETON LOADERS =====
/**
 * Show or hide a skeleton shimmer loader inside a container element.
 *
 * @param {string} containerId  - The `id` of the target DOM element.
 * @param {boolean} show        - true = inject skeleton, false = remove it.
 * @param {object} [options]    - Optional customisation.
 * @param {number} [options.lines=4]      - Number of skeleton text lines to render.
 * @param {boolean} [options.card=true]   - Wrap skeleton in a `.skeleton-card` block.
 * @param {boolean} [options.box=false]   - Prepend a `.skeleton-box` block placeholder.
 *
 * @example
 *   toggleSkeleton("routineResult", true);           // show
 *   toggleSkeleton("routineResult", false);          // hide & restore
 *   toggleSkeleton("routineResult", true, { lines: 3, box: true });
 */
function toggleSkeleton(containerId, show, options = {}) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const SKELETON_ATTR  = "data-skeleton-active";
    const SAVED_HTML_KEY = "data-skeleton-saved-html";

    if (show) {
        // Prevent stacking duplicates
        if (el.getAttribute(SKELETON_ATTR) === "true") return;

        // Persist original content
        el.setAttribute(SAVED_HTML_KEY, el.innerHTML);
        el.setAttribute(SKELETON_ATTR, "true");

        const { lines = 4, card = true, box = false } = options;

        const widths = ["w-100", "w-80", "w-60", "w-40"];
        const textLines = Array.from({ length: lines }, (_, i) =>
            `<span class="skeleton-text ${widths[i % widths.length]}"></span>`
        ).join("\n");

        const boxHTML  = box  ? `<span class="skeleton-box" style="min-height:80px;"></span>` : "";
        const inner    = `${boxHTML}${textLines}`;
        const skeleton = card
            ? `<div class="skeleton-card">${inner}</div>`
            : inner;

        el.innerHTML = skeleton;

    } else {
        if (el.getAttribute(SKELETON_ATTR) !== "true") return;

        // Restore original content
        const saved = el.getAttribute(SAVED_HTML_KEY) || "";
        el.innerHTML = saved;
        el.removeAttribute(SKELETON_ATTR);
        el.removeAttribute(SAVED_HTML_KEY);
    }
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
const BACKEND_URL = "https://skin-care-api.onrender.com";

// ============ COLD-START HANDLER (Render Free Tier Wake-Up) ============

// --- Build modal DOM once, inject into body ---
(function buildColdStartModal() {
    const overlay = document.createElement("div");
    overlay.id = "coldStartOverlay";
    overlay.className = "cold-start-overlay hidden";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Waking up AI Engine");
    overlay.innerHTML = `
        <div class="cold-start-card">
            <div class="cs-spinner-wrap">
                <div class="cs-spinner"></div>
                <div class="cs-spinner-icon">🧴</div>
            </div>
            <p class="cs-title">Waking Up AI Engine...</p>
            <p class="cs-subtitle">
                The backend is on Render's free tier and goes to sleep after inactivity.
                It usually wakes up in <strong>30–50 seconds</strong>. Hang tight!
            </p>
            <div class="cs-progress-track">
                <div class="cs-progress-fill" id="csProgressFill"></div>
            </div>
            <p class="cs-elapsed" id="csElapsed">Elapsed: 0s</p>
        </div>
    `;
    document.body.appendChild(overlay);
})();

// --- Cold-start modal controller ---
const _cs = {
    overlay:      null,
    progressFill: null,
    elapsedEl:    null,
    timer:        null,
    seconds:      0,

    _init() {
        if (!this.overlay) {
            this.overlay      = document.getElementById("coldStartOverlay");
            this.progressFill = document.getElementById("csProgressFill");
            this.elapsedEl    = document.getElementById("csElapsed");
        }
    },

    show() {
        this._init();
        this.seconds = 0;
        this.overlay.classList.remove("hidden");
        this.progressFill.style.width = "0%";
        this.elapsedEl.textContent = "Elapsed: 0s";

        this.timer = setInterval(() => {
            this.seconds++;
            this.elapsedEl.textContent = `Elapsed: ${this.seconds}s`;
            // Ease toward 95% asymptotically (never reaches 100 while waiting)
            const pct = 95 * (1 - Math.exp(-this.seconds / 30));
            this.progressFill.style.width = pct.toFixed(1) + "%";
        }, 1000);
    },

    hide() {
        this._init();
        clearInterval(this.timer);
        this.timer = null;
        // Flash to 100% then dismiss
        this.progressFill.style.width = "100%";
        setTimeout(() => {
            this.overlay.classList.add("hidden");
            this.progressFill.style.width = "0%";
        }, 300);
    }
};

// --- Wrapped fetch helper ---
async function apiFetch(endpoint, options = {}) {
    const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;
    const SLOW_THRESHOLD_MS = 2000;
    let modalShown = false;
    let slowTimer = null;

    slowTimer = setTimeout(() => {
        modalShown = true;
        _cs.show();
    }, SLOW_THRESHOLD_MS);

    try {
        const response = await fetch(url, options);
        return response;
    } finally {
        clearTimeout(slowTimer);
        if (modalShown) _cs.hide();
    }
}

// --- Silent background ping on page load (wake Render immediately) ---
// --- Service Worker registration & Notification permission prompt  ---
window.addEventListener("load", function () {
    // 1. Wake the Render backend (cold-start prevention)
    fetch(`${BACKEND_URL}/health`, { method: "GET", cache: "no-store" })
        .catch(() => { /* intentionally silent */ });

    // 2. Register Service Worker (PWA: offline support + push notifications)
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker
            .register("/sw.js", { scope: "/" })
            .then((reg) => {
                console.log("[SW] Registered successfully. Scope:", reg.scope);

                // Listen for SW updates and notify the user non-intrusively
                reg.addEventListener("updatefound", () => {
                    const newWorker = reg.installing;
                    if (!newWorker) return;
                    newWorker.addEventListener("statechange", () => {
                        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                            // A new version is waiting — show a subtle toast
                            showToast("App updated! Refresh for the latest version. 🔄", "info");
                        }
                    });
                });
            })
            .catch((err) => console.warn("[SW] Registration failed:", err));
    }

    // 3. Request notification permission (once, only if not yet decided)
    if ("Notification" in window && Notification.permission === "default") {
        // Small delay so the permission prompt doesn't fire instantly on first load
        setTimeout(() => {
            Notification.requestPermission().then((permission) => {
                if (permission === "granted") {
                    console.log("[Notifications] Permission granted.");
                } else {
                    console.log("[Notifications] Permission:", permission);
                }
            });
        }, 3000);
    }
});


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
            const response = await apiFetch(API_URL + "/auth/register", {
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
            const response = await apiFetch(API_URL + "/auth/login", {
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
            const response = await apiFetch(API_URL + "/analysis/generate", {
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
                const response = await apiFetch(API_URL + "/analysis/analyze-photo", {
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

/**
 * Initialise (or re-render) the skin progress chart.
 * Reads CSS custom-property colour tokens so it adapts to light/dark mode
 * automatically without a page reload.
 *
 * @param {string} [type="line"] - Chart.js type ("line" | "bar")
 */
function renderSkinProgressChart(type) {
    if (!ctx) return;

    // --- Read theme-aware colours from CSS vars ---
    const style       = getComputedStyle(document.body);
    const gridColor   = style.getPropertyValue("--chart-grid-color").trim()   || "rgba(0,0,0,0.06)";
    const tickColor   = style.getPropertyValue("--chart-tick-color").trim()   || "rgba(0,0,0,0.5)";
    const tooltipBg   = style.getPropertyValue("--chart-tooltip-bg").trim()   || "#ffffff";
    const tooltipText = style.getPropertyValue("--chart-tooltip-text").trim() || "#1a1a1a";
    const fillStart   = style.getPropertyValue("--chart-fill-start").trim()   || "rgba(216,27,96,0.22)";
    const fillEnd     = style.getPropertyValue("--chart-fill-end").trim()     || "rgba(216,27,96,0.01)";

    // --- Build gradient fill ---
    let gradientFill;
    try {
        const canvasEl = ctx.getContext ? ctx : ctx.canvas;
        const chartCtx = canvasEl.getContext("2d");
        gradientFill = chartCtx.createLinearGradient(0, 0, 0, canvasEl.clientHeight || 300);
        gradientFill.addColorStop(0, fillStart);
        gradientFill.addColorStop(1, fillEnd);
    } catch {
        gradientFill = fillStart; // plain colour fallback
    }

    const resolvedType = type || currentChartType || "line";

    // --- Destroy existing chart instance so we can re-create ---
    if (progressChart) { progressChart.destroy(); }

    progressChart = new Chart(ctx, {
        type: resolvedType,
        data: {
            labels: [],
            datasets: [{
                label: "Skin Rating",
                data: [],
                borderColor: "#d81b60",
                backgroundColor: resolvedType === "line" ? gradientFill : "rgba(216, 27, 96, 0.55)",
                borderWidth: 2.5,
                fill: resolvedType === "line",
                tension: 0.4,                  // silky smooth curve
                pointBackgroundColor: "#d81b60",
                pointBorderColor: "#ffffff",
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointHoverBackgroundColor: "#ad1457"
            }]
        },
        options: {
            responsive: true,
            animation: { duration: 600, easing: "easeInOutQuart" },
            interaction: { mode: "index", intersect: false },
            scales: {
                x: {
                    grid: { color: gridColor },
                    ticks: { color: tickColor, font: { family: "'Inter', sans-serif", size: 11 } }
                },
                y: {
                    min: 1,
                    max: 5,
                    ticks: {
                        stepSize: 1,
                        color: tickColor,
                        font: { family: "'Inter', sans-serif", size: 11 },
                        callback: (v) => ["" ,"😞","😕","😐","🙂","😄"][v] || v
                    },
                    grid: { color: gridColor }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: tooltipBg,
                    titleColor: tooltipText,
                    bodyColor: tooltipText,
                    borderColor: "rgba(216, 27, 96, 0.25)",
                    borderWidth: 1,
                    padding: 10,
                    cornerRadius: 10,
                    callbacks: {
                        label: (ctx) => ` Rating: ${ctx.parsed.y}/5`
                    }
                }
            }
        }
    });
}

// Run on page load
renderSkinProgressChart();

// Re-render when dark-mode class is toggled (live theme switch)
(function () {
    const body = document.body;
    if (!ctx || typeof MutationObserver === "undefined") return;
    new MutationObserver(() => {
        const savedLabels  = progressChart?.data?.labels  || [];
        const savedData    = progressChart?.data?.datasets[0]?.data || [];
        renderSkinProgressChart(currentChartType);
        if (savedLabels.length) {
            progressChart.data.labels               = savedLabels;
            progressChart.data.datasets[0].data     = savedData;
            progressChart.update("none"); // skip animation for theme swap
        }
    }).observe(body, { attributeFilter: ["class"] });
})();

async function loadProgress() {
    const userId = getUserId();
    if (!userId) return;

    const progressList = document.getElementById("progressList");
    const chartContainer = document.querySelector(".chart-container");

    try {
        const response = await apiFetch(`${API_URL}/progress/${userId}`);
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

        // Preserve current data then re-render with new chart type
        const savedLabels = progressChart?.data?.labels?.slice() || [];
        const savedData   = progressChart?.data?.datasets[0]?.data?.slice() || [];
        renderSkinProgressChart(type);
        if (savedLabels.length) {
            progressChart.data.labels           = savedLabels;
            progressChart.data.datasets[0].data = savedData;
            progressChart.update();
        }
    });
});

const exportBtn = document.getElementById("exportBtn");
if (exportBtn) {
    exportBtn.addEventListener("click", async function () {
        const userId = getUserId();
        if (!userId) return;

        try {
            const response = await apiFetch(`${API_URL}/progress/${userId}`);
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
            const response = await apiFetch(`${API_URL}/progress/add`, {
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
        const response = await apiFetch(`${API_URL}/progress/${id}`, {
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
        const response = await apiFetch(`${API_URL}/progress/stats/${user.id}`);
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
            const response = await apiFetch(`${API_URL}/progress/products/list`);
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
            const response = await apiFetch(`${API_URL}/comparison/add`, {
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
            const response = await apiFetch(`${API_URL}/comparison/${user.id}`);
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

            document.querySelectorAll(".comparison-slider").forEach(initImageComparison);

        } catch (error) {
            console.log(error);
            list.innerHTML = '<p style="text-align:center;color:red;">Failed to load comparisons</p>';
        }
    }

    /**
     * initImageComparison — silky-smooth before/after slider.
     *
     * Uses the Pointer Events API so mouse, touch, and stylus all work
     * identically. `setPointerCapture` keeps tracking the pointer even when
     * it moves outside the slider, removing the need for window-level listeners
     * and fixing the mobile scroll-hijack bug.
     *
     * @param {HTMLElement} slider  - The .comparison-slider container element
     */
    function initImageComparison(slider) {
        const afterImg = slider.querySelector(".after-img");
        const handle   = slider.querySelector(".slider-handle");
        if (!afterImg || !handle) return;

        /** Convert an x-coordinate to a clamped [0–100] percentage */
        function setPosition(clientX) {
            const rect    = slider.getBoundingClientRect();
            let percent   = ((clientX - rect.left) / rect.width) * 100;
            percent       = Math.max(0, Math.min(100, percent));

            // Use will-change for GPU-composited repaint
            afterImg.style.clipPath = `inset(0 ${(100 - percent).toFixed(2)}% 0 0)`;
            handle.style.left       = percent.toFixed(2) + "%";
        }

        // ── Pointer Events ──────────────────────────────────────────────
        slider.addEventListener("pointerdown", function (e) {
            // Only respond to primary button / first touch
            if (e.button !== 0 && e.pointerType === "mouse") return;

            slider.setPointerCapture(e.pointerId);  // lock tracking to this element
            slider.classList.add("dragging");
            setPosition(e.clientX);
            e.preventDefault();                     // prevent text selection during drag
        });

        slider.addEventListener("pointermove", function (e) {
            if (!slider.hasPointerCapture(e.pointerId)) return;
            setPosition(e.clientX);
        });

        slider.addEventListener("pointerup", function (e) {
            if (!slider.hasPointerCapture(e.pointerId)) return;
            slider.releasePointerCapture(e.pointerId);
            slider.classList.remove("dragging");
        });

        slider.addEventListener("pointercancel", function (e) {
            slider.releasePointerCapture(e.pointerId);
            slider.classList.remove("dragging");
        });
    }

    // Expose globally for programmatic use (e.g., after dynamic DOM injection)
    window.initImageComparison = initImageComparison;

    window.deleteComparison = async function (id) {
        if (!confirm("Delete this comparison?")) return;

        try {
            const response = await apiFetch(`${API_URL}/comparison/${id}`, {
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
            const response = await apiFetch(`${API_URL}/reminder/preferences/${user.id}`);
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
            const response = await apiFetch(`${API_URL}/reminder/preferences`, {
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
                const response = await apiFetch(`${API_URL}/reminder/preferences`, {
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
                const response = await apiFetch(`${API_URL}/reminder/test/${user.id}`, {
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
                const response = await apiFetch(`${API_URL}/community/add`, {
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
            const response = await apiFetch(`${API_URL}/community/posts`);
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

    /**
     * handleLikePost — Optimistic UI like handler.
     *
     * Immediately updates the like button's visual state (count + .liked class +
     * heartbeat animation) before the API call completes, making the interaction
     * feel instant. Rolls back if the server returns an error.
     *
     * @param {string} postId - MongoDB _id of the post to like/unlike
     */
    window.handleLikePost = async function (postId) {
        const user = JSON.parse(localStorage.getItem("user") || "null");
        if (!user) {
            showToast("Please login first", "error");
            return;
        }

        // Find the like button and its count <span> for this post
        const postCard  = document.querySelector(`.post-card[data-id="${postId}"]`);
        const likeBtn   = postCard?.querySelector(`.post-action-btn[onclick*="handleLikePost"]`);
        const countSpan = likeBtn?.querySelector("span");
        if (!likeBtn || !countSpan) return;

        // --- Capture pre-click state for rollback ---
        const wasLiked      = likeBtn.classList.contains("liked");
        const prevCount     = parseInt(countSpan.textContent, 10) || 0;
        const prevEmoji     = wasLiked ? "❤️" : "🤍";

        // --- Optimistic update ---
        const newLiked  = !wasLiked;
        const newCount  = newLiked ? prevCount + 1 : Math.max(0, prevCount - 1);
        const newEmoji  = newLiked ? "❤️" : "🤍";

        likeBtn.classList.toggle("liked", newLiked);
        likeBtn.innerHTML = `${newEmoji} <span>${newCount}</span>`;

        // Trigger heartbeat pop (remove first to allow re-triggering on rapid clicks)
        likeBtn.classList.remove("like-pop");
        void likeBtn.offsetWidth; // force reflow to restart animation
        likeBtn.classList.add("like-pop");

        // --- Fire API call ---
        try {
            const response = await apiFetch(`${API_URL}/community/like/${postId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id })
            });

            if (!response.ok) {
                throw new Error("Like API returned non-OK status");
            }
            // On success, do a soft background refresh so comment counts etc. stay fresh
            // but don't re-render the whole feed (avoids scroll jump)
        } catch (error) {
            // --- Roll back on failure ---
            console.warn("[handleLikePost] Rollback:", error.message);
            likeBtn.classList.toggle("liked", wasLiked);
            likeBtn.innerHTML = `${prevEmoji} <span>${prevCount}</span>`;
            showToast("Could not update like. Please try again.", "error");
        }

        // Remove pop class after animation ends
        likeBtn.addEventListener("animationend", () => likeBtn.classList.remove("like-pop"), { once: true });
    };

    // Keep toggleLike as a backwards-compat alias
    window.toggleLike = window.handleLikePost;

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
            const response = await apiFetch(`${API_URL}/community/comment/${postId}`, {
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
            const response = await apiFetch(`${API_URL}/community/post/${postId}?userId=${user.id}`, {
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

// ============ PUSH NOTIFICATIONS ============
const enableNotificationsBtn = document.getElementById("enableNotificationsBtn");

if (enableNotificationsBtn) {
    const notifStatusRow = document.getElementById("notifStatusRow");
    const notifStatusText = document.getElementById("notifStatusText");
    const notifStatusIcon = document.getElementById("notifStatusIcon");
    const routineNotifToggle = document.getElementById("routineNotifToggle");
    const progressNotifToggle = document.getElementById("progressNotifToggle");
    const testNotificationBtn = document.getElementById("testNotificationBtn");

    // Check if browser supports notifications
    const supportsNotifications = "Notification" in window;

    function updateNotificationUI() {
        if (!supportsNotifications) {
            enableNotificationsBtn.textContent = "Not Supported";
            enableNotificationsBtn.disabled = true;
            return;
        }

        const permission = Notification.permission;

        if (permission === "granted") {
            enableNotificationsBtn.textContent = "Enabled";
            enableNotificationsBtn.disabled = true;
            enableNotificationsBtn.style.background = "#4caf50";
            notifStatusRow.style.display = "flex";
            notifStatusText.textContent = "Notifications are enabled";
            notifStatusIcon.textContent = "✅";
        } else if (permission === "denied") {
            enableNotificationsBtn.textContent = "Blocked";
            enableNotificationsBtn.disabled = true;
            enableNotificationsBtn.style.background = "#e53935";
            notifStatusRow.style.display = "flex";
            notifStatusText.textContent = "Notifications are blocked. Enable in browser settings.";
            notifStatusIcon.textContent = "🚫";
        } else {
            enableNotificationsBtn.textContent = "Enable";
            enableNotificationsBtn.disabled = false;
            notifStatusRow.style.display = "none";
        }
    }

    updateNotificationUI();

    // Request permission
    enableNotificationsBtn.addEventListener("click", async function() {
        if (!supportsNotifications) return;

        try {
            const permission = await Notification.requestPermission();
            updateNotificationUI();

            if (permission === "granted") {
                showToast("Notifications enabled!", "success");
                new Notification("SkinCare AI", {
                    body: "Notifications are now enabled!",
                    icon: "/favicon.svg"
                });
            } else if (permission === "denied") {
                showToast("Notifications blocked. Enable in browser settings.", "error");
            }
        } catch (error) {
            console.log(error);
            showToast("Failed to enable notifications", "error");
        }
    });

    // Routine reminder toggle
    if (routineNotifToggle) {
        routineNotifToggle.checked = localStorage.getItem("routineNotif") === "true";
        routineNotifToggle.addEventListener("change", function() {
            localStorage.setItem("routineNotif", this.checked);
            showToast(this.checked ? "Routine reminders ON" : "Routine reminders OFF", "info");
        });
    }

    // Progress reminder toggle
    if (progressNotifToggle) {
        progressNotifToggle.checked = localStorage.getItem("progressNotif") === "true";
        progressNotifToggle.addEventListener("change", function() {
            localStorage.setItem("progressNotif", this.checked);
            showToast(this.checked ? "Progress reminders ON" : "Progress reminders OFF", "info");
        });
    }

    // Test notification
    if (testNotificationBtn) {
        testNotificationBtn.addEventListener("click", function() {
            if (Notification.permission !== "granted") {
                showToast("Enable notifications first", "error");
                return;
            }

            new Notification("SkinCare AI - Test", {
                body: "This is a test notification! Your reminders are working.",
                icon: "/favicon.svg",
                badge: "/favicon.svg"
            });

            showToast("Test notification sent!", "success");
        });
    }

    // Auto reminder scheduler (checks every 60 seconds)
    if (Notification.permission === "granted") {
        setInterval(() => {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const today = now.toDateString();
            const lastNotified = localStorage.getItem("lastNotifiedDate");

            // Send routine reminder at 9 AM (once per day)
            if (localStorage.getItem("routineNotif") === "true" && hours === 9 && minutes === 0 && lastNotified !== today) {
                new Notification("🌿 Time for Your Routine!", {
                    body: "Don't forget your morning skincare routine!",
                    icon: "/favicon.svg"
                });
                localStorage.setItem("lastNotifiedDate", today);
            }

            // Send progress reminder at 9 PM (once per day)
            if (localStorage.getItem("progressNotif") === "true" && hours === 21 && minutes === 0 && lastNotified !== today + "-pm") {
                new Notification("📊 Log Your Progress", {
                    body: "How is your skin today? Take a moment to log it!",
                    icon: "/favicon.svg"
                });
                localStorage.setItem("lastNotifiedDate", today + "-pm");
            }
        }, 60000); // checks every minute
    }
}