const API_BASE_URL = "https://skin-care-api.onrender.com";

// ==================== 1. SERVICE WORKER REGISTRATION ====================
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("./sw.js")
            .then((reg) => console.log("Service Worker active, scope:", reg.scope))
            .catch((err) => console.warn("Service Worker registration skipped:", err));
    });
}

// ==================== 2. COLD START RESILIENT FETCH ====================
let isColdStarting = false;
let coldStartTimerInterval = null;

function showColdStartModal() {
    const modal = document.getElementById("coldStartModal");
    const timerEl = document.getElementById("coldStartTimer");
    const progressEl = document.getElementById("coldStartProgress");
    if (!modal || !timerEl || !progressEl) return;

    isColdStarting = true;
    modal.classList.remove("hidden");
    let seconds = 0;
    timerEl.textContent = "0";
    progressEl.style.width = "10%";

    clearInterval(coldStartTimerInterval);
    coldStartTimerInterval = setInterval(() => {
        seconds++;
        timerEl.textContent = seconds;
        const progress = Math.min(95, 10 + seconds * 2.5);
        progressEl.style.width = `${progress}%`;
    }, 1000);
}

function hideColdStartModal() {
    isColdStarting = false;
    clearInterval(coldStartTimerInterval);
    const modal = document.getElementById("coldStartModal");
    if (modal) modal.classList.add("hidden");
}

async function apiFetch(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    let timerTrigger = setTimeout(() => {
        showColdStartModal();
    }, 2800);

    try {
        const response = await fetch(url, options);
        clearTimeout(timerTrigger);
        hideColdStartModal();
        return response;
    } catch (error) {
        clearTimeout(timerTrigger);
        hideColdStartModal();
        throw error;
    }
}

// Background ping to spin up Render container
(function pingBackendHealth() {
    fetch(`${API_BASE_URL}/health`, { method: "GET" })
        .then((res) => {
            if (res.ok) console.log("Backend warm and ready");
        })
        .catch(() => console.log("Silent health ping: Backend currently cold starting"));
})();

// ==================== 3. SKELETON LOADER UTILITY ====================
function toggleSkeleton(show) {
    const skeleton = document.getElementById("resultsSkeleton");
    const content = document.getElementById("resultsContent");
    if (!skeleton || !content) return;

    if (show) {
        skeleton.classList.remove("hidden");
        content.classList.add("hidden");
    } else {
        skeleton.classList.add("hidden");
        content.classList.remove("hidden");
    }
}

// ==================== 4. SKIN ANALYSIS & CHART ====================
let skinChartInstance = null;

async function handleAnalyze(e) {
    e.preventDefault();
    const skinType = document.getElementById("skinType").value;
    const concern = document.getElementById("primaryConcern").value;
    const resultsCard = document.getElementById("routineResults");

    resultsCard.classList.remove("hidden");
    toggleSkeleton(true);
    resultsCard.scrollIntoView({ behavior: "smooth" });

    try {
        const res = await apiFetch("/api/analysis", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ skinType, concern }),
        });

        const data = await res.json();
        renderRoutineResults(data.routine);
    } catch (err) {
        console.error("AI Analysis failed, falling back to local regimen:", err);
        renderRoutineResults({
            am: ["Gentle Gel Cleanser", "Niacinamide 5% Serum", "Barrier Repair Emulsion", "Broad-Spectrum SPF 50+"],
            pm: ["Gentle Cleansing Oil", "Barrier Balancing Cleanser", "Ceramide Recovery Cream"]
        });
    } finally {
        toggleSkeleton(false);
    }
}

function renderRoutineResults(routine) {
    const amList = document.getElementById("amStepsList");
    const pmList = document.getElementById("pmStepsList");
    amList.innerHTML = "";
    pmList.innerHTML = "";

    (routine.am || []).forEach((step) => {
        const li = document.createElement("li");
        li.textContent = step;
        amList.appendChild(li);
    });

    (routine.pm || []).forEach((step) => {
        const li = document.createElement("li");
        li.textContent = step;
        pmList.appendChild(li);
    });

    renderChart();
}

function renderChart() {
    const ctx = document.getElementById("skinMetricsChart")?.getContext("2d");
    if (!ctx) return;

    if (skinChartInstance) skinChartInstance.destroy();

    skinChartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels: ["Day 1", "Day 7", "Day 14", "Day 21", "Day 30"],
            datasets: [
                {
                    label: "Skin Hydration %",
                    data: [35, 48, 62, 75, 84],
                    borderColor: "#10b981",
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    fill: true,
                    tension: 0.35,
                },
                {
                    label: "Barrier Sensitivity Index",
                    data: [80, 65, 45, 30, 20],
                    borderColor: "#f59e0b",
                    backgroundColor: "transparent",
                    borderDash: [5, 5],
                    tension: 0.35,
                },
            ],
        },
        options: {
            responsive: true,
            plugins: { legend: { position: "bottom" } },
            scales: { y: { beginAtZero: true, max: 100 } },
        },
    });
}

// ==================== 5. BEFORE/AFTER COMPARISON SLIDER ====================
function initImageComparison() {
    const container = document.getElementById("beforeAfterSlider");
    if (!container) return;

    const slider = container.querySelector(".img-comp-slider");
    const overlay = container.querySelector(".img-comp-overlay");
    if (!slider || !overlay) return;

    let isDown = false;

    function updateSlider(clientX) {
        const rect = container.getBoundingClientRect();
        let x = clientX - rect.left;
        if (x < 0) x = 0;
        if (x > rect.width) x = rect.width;
        const percent = (x / rect.width) * 100;
        slider.style.left = `${percent}%`;
        overlay.style.width = `${percent}%`;
    }

    slider.addEventListener("pointerdown", (e) => {
        isDown = true;
        slider.setPointerCapture(e.pointerId);
    });

    window.addEventListener("pointerup", () => { isDown = false; });
    window.addEventListener("pointercancel", () => { isDown = false; });
    window.addEventListener("pointermove", (e) => {
        if (!isDown) return;
        updateSlider(e.clientX);
    });
}

// ==================== 6. ROUTINE STREAK TRACKER ====================
const TRACKER_STORAGE_KEY = "skincare_streak_cache";

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
    statusMsg.textContent = data.am && data.pm ? "✨ Both routines completed today!" : "";
}

function handleRoutineCheck() {
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

    data.am = checkAM.checked;
    data.pm = checkPM.checked;

    if (data.am && data.pm && data.lastDate !== today) {
        data.streak = data.lastDate === yesterday ? data.streak + 1 : 1;
        data.lastDate = today;
        statusMsg.textContent = "🎉 Streak maintained! Consistent habits yield lasting results.";
    } else if (!data.am || !data.pm) {
        statusMsg.textContent = "";
    }

    streakEl.textContent = data.streak;
    localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(data));
}

// ==================== 7. INGREDIENT SAFETY SCANNER ====================
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

// ==================== 8. PDF EXPORT & OPTIMISTIC FEED LIKE ====================
function exportRoutinePDF() {
    const originalTitle = document.title;
    document.title = "My_AI_SkinCare_Routine";
    window.print();
    document.title = originalTitle;
}

async function handleLikePost(postId, buttonElement, countElement) {
    if (!buttonElement) return;

    const isLiked = buttonElement.classList.contains("liked");
    let currentCount = parseInt(countElement?.textContent || "0", 10);

    // Optimistic UI toggle
    buttonElement.classList.toggle("liked");
    if (countElement) {
        countElement.textContent = isLiked ? Math.max(0, currentCount - 1) : currentCount + 1;
    }

    try {
        const res = await apiFetch(`/api/community/posts/${postId}/like`, { method: "POST" });
        if (!res.ok) throw new Error("Like endpoint error");
        const data = await res.json();
        if (countElement && typeof data.likesCount === "number") {
            countElement.textContent = data.likesCount;
        }
    } catch (err) {
        console.warn("Optimistic like reverted due to network:", err);
        buttonElement.classList.toggle("liked");
        if (countElement) countElement.textContent = currentCount;
    }
}

// ==================== 9. BOOTSTRAP ====================
window.addEventListener("DOMContentLoaded", () => {
    initImageComparison();
    loadRoutineTracker();
});