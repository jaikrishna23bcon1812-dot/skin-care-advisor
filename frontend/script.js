const API_URL = "https://skin-care-api.onrender.com/api";

// Toast Notifications
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
    toast.innerHTML = `<span class="toast-icon">${icons[type] || "ℹ️"}</span><span class="toast-message">${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add("removing");
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// Dark Mode
function toggleDarkMode() {
    const isDark = document.body.classList.toggle("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    const icon = document.getElementById("themeIcon");
    if (icon) {
        icon.textContent = isDark ? "☀️" : "🌙";
    }
    return isDark;
}
window.toggleDarkMode = toggleDarkMode;

(function () {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
        document.body.classList.add("dark-mode");
    }
})();

window.addEventListener("DOMContentLoaded", function () {
    const icon = document.getElementById("themeIcon");
    if (icon && document.body.classList.contains("dark-mode")) {
        icon.textContent = "☀️";
    }
    const btn = document.getElementById("themeToggle");
    if (btn) {
        btn.addEventListener("click", toggleDarkMode);
    }
});

// Register
const registerForm = document.getElementById("registerForm");
if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const name = document.getElementById("regName").value.trim();
        const email = document.getElementById("regEmail").value.trim();
        const password = document.getElementById("regPassword").value.trim();
        if (!name || !email || !password) return showToast("Please fill all fields", "error");
        try {
            const response = await fetch(API_URL + "/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
            });
            const data = await response.json();
            if (!response.ok) return showToast(data.error || "Registration failed", "error");
            showToast("Account created! Please login.", "success");
            setTimeout(() => window.location.href = "login.html", 1000);
        } catch (error) {
            showToast("Cannot connect to server", "error");
        }
    });
}

// Login
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value.trim();
        if (!email || !password) return showToast("Please fill all fields", "error");
        try {
            const response = await fetch(API_URL + "/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (!response.ok) return showToast(data.error || "Login failed", "error");
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            showToast("Welcome " + data.user.name + "!", "success");
            setTimeout(() => window.location.href = "dashboard.html", 1000);
        } catch (error) {
            showToast("Cannot connect to server", "error");
        }
    });
}

// Logout
document.addEventListener("click", function (e) {
    if (e.target && e.target.id === "logoutBtn") {
        e.preventDefault();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        showToast("Logged out", "info");
        setTimeout(() => window.location.href = "index.html", 800);
    }
});

const API_BASE_URL = "https://skin-care-api.onrender.com";
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}

function showColdStartModal() {
    const modal = document.getElementById("coldStartModal");
    if (modal) modal.classList.remove("hidden");
}
function hideColdStartModal() {
    const modal = document.getElementById("coldStartModal");
    if (modal) modal.classList.add("hidden");
}
async function apiFetch(endpoint, options = {}) {
    let timerTrigger = setTimeout(showColdStartModal, 2800);
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        clearTimeout(timerTrigger); hideColdStartModal(); return response;
    } catch (error) {
        clearTimeout(timerTrigger); hideColdStartModal(); throw error;
    }
}
fetch(`${API_BASE_URL}/health`).catch(() => {});

function toggleSkeleton(show) {
    const skeleton = document.getElementById("resultsSkeleton");
    const content = document.getElementById("resultsContent");
    if (skeleton && content) {
        skeleton.classList.toggle("hidden", !show);
        content.classList.toggle("hidden", show);
    }
}

let skinChartInstance = null;
async function handleAnalyze(e) {
    e.preventDefault();
    const skinType = document.getElementById("skinType")?.value;
    const concern = document.getElementById("primaryConcern")?.value;
    const resultsCard = document.getElementById("routineResults");
    if(resultsCard) {
        resultsCard.classList.remove("hidden");
        toggleSkeleton(true);
        resultsCard.scrollIntoView({ behavior: "smooth" });
    }
    try {
        const res = await apiFetch("/api/analysis", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ skinType, concern }),
        });
        const data = await res.json();
        renderRoutineResults(data.routine);
    } catch (err) {
        renderRoutineResults({
            am: ["Gentle Gel Cleanser", "Niacinamide 5% Serum", "Barrier Repair Emulsion", "SPF 50+"],
            pm: ["Cleansing Oil", "Barrier Cleanser", "Ceramide Cream"]
        });
    } finally { toggleSkeleton(false); }
}

function renderRoutineResults(routine) {
    const amList = document.getElementById("amStepsList");
    const pmList = document.getElementById("pmStepsList");
    if (amList) amList.innerHTML = (routine.am || []).map(s => `<li>${s}</li>`).join("");
    if (pmList) pmList.innerHTML = (routine.pm || []).map(s => `<li>${s}</li>`).join("");
    
    const ctx = document.getElementById("skinMetricsChart")?.getContext("2d");
    if (!ctx) return;
    if (skinChartInstance) skinChartInstance.destroy();
    skinChartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels: ["Day 1", "Day 7", "Day 14", "Day 21", "Day 30"],
            datasets: [
                { label: "Hydration %", data: [35, 48, 62, 75, 84], borderColor: "#10b981", fill: true, tension: 0.35 },
                { label: "Sensitivity", data: [80, 65, 45, 30, 20], borderColor: "#f59e0b", borderDash: [5, 5], tension: 0.35 }
            ]
        }, options: { responsive: true, plugins: { legend: { position: "bottom" } } }
    });
}

function initImageComparison() {
    const container = document.getElementById("beforeAfterSlider");
    if (!container) return;
    const slider = container.querySelector(".img-comp-slider");
    const overlay = container.querySelector(".img-comp-overlay");
    if (!slider || !overlay) return;
    let isDown = false;
    function updateSlider(clientX) {
        const rect = container.getBoundingClientRect();
        let x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const percent = (x / rect.width) * 100;
        slider.style.left = `${percent}%`; overlay.style.width = `${percent}%`;
    }
    slider.addEventListener("pointerdown", (e) => { isDown = true; slider.setPointerCapture(e.pointerId); });
    window.addEventListener("pointerup", () => isDown = false);
    window.addEventListener("pointermove", (e) => { if (isDown) updateSlider(e.clientX); });
}

function exportRoutinePDF() { window.print(); }
async function handleLikePost(postId, btn, countEl) {
    if (!btn) return;
    const wasLiked = btn.classList.contains("liked");
    let count = parseInt(countEl?.textContent || "0");
    btn.classList.toggle("liked");
    if (countEl) countEl.textContent = wasLiked ? Math.max(0, count - 1) : count + 1;
    try {
        const res = await apiFetch(`/api/community/posts/${postId}/like`, { method: "POST" });
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        if (countEl && typeof data.likesCount === "number") countEl.textContent = data.likesCount;
    } catch (err) {
        btn.classList.toggle("liked"); if (countEl) countEl.textContent = count;
    }
}

// ==================== INGREDIENT SAFETY SCANNER ====================
const COMEDOGENIC_DATABASE = [
    { name: "isopropyl myristate", rating: 5, type: "Highly Comedogenic" },
    { name: "isopropyl palmitate", rating: 4, type: "Comedogenic" },
    { name: "coconut oil", rating: 4, type: "Comedogenic" },
    { name: "cocos nucifera", rating: 4, type: "Comedogenic" },
    { name: "sodium lauryl sulfate", rating: 5, type: "Pore-Clogging & Irritant" },
    { name: "sls", rating: 5, type: "Pore-Clogging & Irritant" },
    { name: "acetylated lanolin", rating: 4, type: "Comedogenic" },
    { name: "algae extract", rating: 5, type: "Highly Comedogenic" },
    { name: "wheat germ oil", rating: 5, type: "Highly Comedogenic" },
    { name: "myristyl myristate", rating: 5, type: "Highly Comedogenic" },
    { name: "laureth-4", rating: 5, type: "Highly Comedogenic" },
    { name: "denatured alcohol", rating: 0, type: "High Irritant / Drying" },
    { name: "alcohol denat", rating: 0, type: "High Irritant / Drying" },
    { name: "fragrance", rating: 0, type: "Common Allergen / Irritant" },
    { name: "parfum", rating: 0, type: "Common Allergen / Irritant" },
    { name: "cocoa butter", rating: 4, type: "Comedogenic" }
];

function analyzeIngredients() {
    const inputEl = document.getElementById("ingredientInput");
    const resultsEl = document.getElementById("checkerResults");
    if (!inputEl || !resultsEl) return;

    const rawText = inputEl.value.trim().toLowerCase();
    if (!rawText) {
        resultsEl.classList.remove("hidden");
        resultsEl.innerHTML = `<div class="flagged-item"><span class="flagged-name">Please paste an ingredient deck to scan.</span></div>`;
        return;
    }

    const ingredients = rawText.split(/[,;\n]+/).map((item) => item.trim()).filter(Boolean);
    const flagged = [];

    ingredients.forEach((userIng) => {
        COMEDOGENIC_DATABASE.forEach((item) => {
            if (userIng.includes(item.name)) {
                flagged.push({ detected: userIng, reason: item.type, rating: item.rating });
            }
        });
    });

    resultsEl.classList.remove("hidden");

    if (flagged.length === 0) {
        resultsEl.innerHTML = `
        <div class="clean-status">
          ✅ <strong>No High Comedogenic or Common Irritants Detected!</strong>
          <p style="margin-top: 0.25rem; font-size: 0.85rem; font-weight: normal;">
            Scanned ${ingredients.length} ingredients. All safe for acne-prone skin.
          </p>
        </div>`;
    } else {
        let outputHTML = `<div style="margin-bottom: 0.5rem;"><strong style="color: #b91c1c;">⚠️ Flagged ${flagged.length} Potential Issue(s):</strong></div>`;
        flagged.forEach((f) => {
            outputHTML += `
        <div class="flagged-item">
          <div>
            <div class="flagged-name">${f.detected}</div>
            <div style="font-size: 0.8rem; color: #7f1d1d;">${f.reason}</div>
          </div>
          <span class="flagged-meta">${f.rating ? `Score: ${f.rating}/5` : "Caution"}</span>
        </div>`;
        });
        resultsEl.innerHTML = outputHTML;
    }
}
window.analyzeIngredients = analyzeIngredients;

// ==================== DAILY ROUTINE TRACKER ====================
const TRACKER_STORAGE_KEY = "skincare_daily_tracker";

function getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getYesterdayKey() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function loadRoutineTracker() {
    const data = JSON.parse(localStorage.getItem(TRACKER_STORAGE_KEY) || "{}");
    const today = getTodayKey();
    const yesterday = getYesterdayKey();

    const streakEl = document.getElementById("streakCount");
    const checkAM = document.getElementById("checkAM");
    const checkPM = document.getElementById("checkPM");
    const statusMsg = document.getElementById("trackerStatusMsg");

    if (!streakEl || !checkAM || !checkPM) return;

    if (data.lastDate && data.lastDate !== today && data.lastDate !== yesterday) {
        data.streak = 0;
    }

    if (data.currentDay !== today) {
        data.currentDay = today;
        data.am = false;
        data.pm = false;
        localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(data));
    }

    checkAM.checked = !!data.am;
    checkPM.checked = !!data.pm;
    streakEl.textContent = data.streak || 0;
    if (statusMsg) {
        statusMsg.textContent = data.am && data.pm ? "✨ Both routines completed today!" : "";
    }
}

function handleRoutineCheck(type) {
    const data = JSON.parse(localStorage.getItem(TRACKER_STORAGE_KEY) || "{}");
    const today = getTodayKey();
    const yesterday = getYesterdayKey();

    if (!data.streak) data.streak = 0;
    if (!data.currentDay || data.currentDay !== today) {
        data.currentDay = today;
        data.am = false;
        data.pm = false;
    }

    const checkAM = document.getElementById("checkAM");
    const checkPM = document.getElementById("checkPM");
    const streakEl = document.getElementById("streakCount");
    const statusMsg = document.getElementById("trackerStatusMsg");

    if (checkAM) data.am = checkAM.checked;
    if (checkPM) data.pm = checkPM.checked;

    if (data.am && data.pm && data.lastDate !== today) {
        data.streak = data.lastDate === yesterday ? data.streak + 1 : 1;
        data.lastDate = today;
        if (statusMsg) statusMsg.textContent = "🎉 Streak maintained! Consistent habits yield lasting results.";
    } else if (!data.am || !data.pm) {
        if (statusMsg) statusMsg.textContent = "";
    }

    if (streakEl) streakEl.textContent = data.streak;
    localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(data));
}
window.handleRoutineCheck = handleRoutineCheck;

window.addEventListener("DOMContentLoaded", () => {
    initImageComparison();
    loadRoutineTracker();
});
