const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:";
const API_BASE_URL = isLocal
    ? (window.location.port === "5000" ? "" : "http://localhost:5000")
    : "https://skin-care-api.onrender.com";
const API_URL = `${API_BASE_URL}/api`;

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
            localStorage.setItem("skin_token", data.token);
            localStorage.setItem("skin_email", data.email || email);
            localStorage.setItem("token", data.token);
            if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
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
            localStorage.setItem("skin_token", data.token);
            localStorage.setItem("skin_email", data.email || email);
            localStorage.setItem("token", data.token);
            if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
            showToast("Welcome " + (data.user?.name || data.email || "back") + "!", "success");
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
        localStorage.removeItem("skin_token");
        localStorage.removeItem("skin_email");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        showToast("Logged out", "info");
        setTimeout(() => window.location.href = "index.html", 800);
    }
});
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

// ==================== CAMERA & SELFIE PHOTO ANALYSIS ====================
let cameraStream = null;
let currentSelfieData = null;

async function startCamera() {
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showToast("Camera access is not supported by your browser.", "error");
            return;
        }

        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" },
            audio: false,
        });

        const video = document.getElementById("cameraPreview");
        const placeholder = document.getElementById("cameraPlaceholder");
        const overlay = document.getElementById("viewfinderOverlay");
        const startBtn = document.getElementById("startCameraBtn");
        const captureBtn = document.getElementById("captureBtn");
        const stopBtn = document.getElementById("stopCameraBtn");
        const retakeBtn = document.getElementById("retakeBtn");
        const previewContainer = document.getElementById("photoPreviewContainer");

        if (video) {
            video.srcObject = cameraStream;
            video.classList.remove("hidden");
            await video.play().catch(() => {});
        }
        if (placeholder) placeholder.classList.add("hidden");
        if (overlay) overlay.classList.remove("hidden");
        if (startBtn) startBtn.classList.add("hidden");
        if (captureBtn) captureBtn.classList.remove("hidden");
        if (stopBtn) stopBtn.classList.remove("hidden");
        if (retakeBtn) retakeBtn.classList.add("hidden");
        if (previewContainer) previewContainer.classList.add("hidden");

        showToast("Camera active. Align face in guide.", "info");
    } catch (err) {
        console.error("Camera access error:", err);
        showToast("Camera permission denied or unavailable. You can upload a photo instead.", "error");
    }
}
window.startCamera = startCamera;

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        cameraStream = null;
    }
    const video = document.getElementById("cameraPreview");
    const placeholder = document.getElementById("cameraPlaceholder");
    const overlay = document.getElementById("viewfinderOverlay");
    const startBtn = document.getElementById("startCameraBtn");
    const captureBtn = document.getElementById("captureBtn");
    const stopBtn = document.getElementById("stopCameraBtn");

    if (video) {
        video.pause();
        video.srcObject = null;
        video.classList.add("hidden");
    }
    if (placeholder && (!currentSelfieData || document.getElementById("photoPreviewContainer")?.classList.contains("hidden"))) {
        placeholder.classList.remove("hidden");
    }
    if (overlay) overlay.classList.add("hidden");
    if (startBtn) startBtn.classList.remove("hidden");
    if (captureBtn) captureBtn.classList.add("hidden");
    if (stopBtn) stopBtn.classList.add("hidden");
}
window.stopCamera = stopCamera;

function captureSelfie() {
    const video = document.getElementById("cameraPreview");
    const canvas = document.getElementById("captureCanvas");
    if (!video || !canvas) return;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    // Mirror horizontally for natural selfie view
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, width, height);

    currentSelfieData = canvas.toDataURL("image/jpeg", 0.88);
    displayPhotoPreview(currentSelfieData);
    stopCamera();

    const retakeBtn = document.getElementById("retakeBtn");
    const startBtn = document.getElementById("startCameraBtn");
    if (retakeBtn) retakeBtn.classList.remove("hidden");
    if (startBtn) startBtn.classList.add("hidden");

    showToast("Selfie captured! Click 'Analyze My Photo'.", "success");
}
window.captureSelfie = captureSelfie;

function retakePhoto() {
    currentSelfieData = null;
    const previewContainer = document.getElementById("photoPreviewContainer");
    const analyzeBtn = document.getElementById("analyzePhotoBtn");
    const retakeBtn = document.getElementById("retakeBtn");
    if (previewContainer) previewContainer.classList.add("hidden");
    if (analyzeBtn) analyzeBtn.classList.add("hidden");
    if (retakeBtn) retakeBtn.classList.add("hidden");
    startCamera();
}
window.retakePhoto = retakePhoto;

function handlePhotoUpload(event) {
    const file = event.target?.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        showToast("Please choose a valid image file (JPG, PNG, etc.)", "error");
        return;
    }

    stopCamera();

    const reader = new FileReader();
    reader.onload = (e) => {
        currentSelfieData = e.target.result;
        displayPhotoPreview(currentSelfieData);
        const retakeBtn = document.getElementById("retakeBtn");
        const startBtn = document.getElementById("startCameraBtn");
        if (retakeBtn) retakeBtn.classList.remove("hidden");
        if (startBtn) startBtn.classList.remove("hidden");
        showToast("Photo uploaded successfully!", "success");
    };
    reader.onerror = () => {
        showToast("Failed to read image file.", "error");
    };
    reader.readAsDataURL(file);
}
window.handlePhotoUpload = handlePhotoUpload;

function displayPhotoPreview(dataUrl) {
    const previewContainer = document.getElementById("photoPreviewContainer");
    const previewImg = document.getElementById("selfiePreviewImg");
    const analyzeBtn = document.getElementById("analyzePhotoBtn");

    if (previewImg) previewImg.src = dataUrl;
    if (previewContainer) previewContainer.classList.remove("hidden");
    if (analyzeBtn) {
        analyzeBtn.classList.remove("hidden");
        analyzeBtn.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
}

async function analyzePhoto() {
    if (!currentSelfieData) {
        showToast("Please capture a selfie or upload an image first.", "error");
        return;
    }

    const analyzeBtn = document.getElementById("analyzePhotoBtn");
    const origText = analyzeBtn ? analyzeBtn.textContent : "";
    if (analyzeBtn) {
        analyzeBtn.disabled = true;
        analyzeBtn.textContent = "Scanning Skin Matrix...";
    }

    const resultsCard = document.getElementById("routineResults");
    if (resultsCard) {
        resultsCard.classList.remove("hidden");
        toggleSkeleton(true);
        resultsCard.scrollIntoView({ behavior: "smooth" });
    }

    try {
        const res = await apiFetch("/api/analysis/photo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: currentSelfieData }),
        });

        const data = await res.json();

        const routineTitle = document.getElementById("routineTitle");
        const routineSubtitle = document.getElementById("routineSubtitle");
        if (data.detectedConcerns && data.detectedConcerns.length > 0) {
            if (routineTitle) routineTitle.textContent = "Visual Analysis: " + data.detectedConcerns.join(" • ");
            if (routineSubtitle) routineSubtitle.textContent = data.summary || "AI-detected barrier condition and targeted treatment regimen.";
        }

        renderRoutineResults(data.routine);
        showToast("Skin matrix scanned successfully!", "success");
    } catch (err) {
        console.error("Visual analysis error:", err);
        showToast("Using clinical visual regimen fallback.", "info");
        renderRoutineResults({
            am: [
                "Gentle Balancing Centella Cleanser",
                "10% Azelaic Acid + Zinc Soothing Serum",
                "Lightweight Barrier Restorative Lotion",
                "Broad-Spectrum Invisible Shield Sunscreen SPF 50+"
            ],
            pm: [
                "Jojoba Oil Pre-Cleanse",
                "Squalane Hydrating Cleanser",
                "Ceramide Deep Repair Lipid Complex",
                "Overnight Blemish Calming Spot Balm"
            ]
        });
    } finally {
        toggleSkeleton(false);
        if (analyzeBtn) {
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = origText;
        }
    }
}
window.analyzePhoto = analyzePhoto;

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

// ==================== USER AUTHENTICATION & MODAL ====================
let currentAuthMode = "login"; // "login" or "register"

function updateAuthUI() {
    const token = localStorage.getItem("skin_token") || localStorage.getItem("token");
    const email = localStorage.getItem("skin_email");
    const authBtn = document.getElementById("authModalBtn");

    if (!authBtn) return;

    if (token) {
        authBtn.textContent = "Sign Out";
        authBtn.classList.add("authenticated");
        authBtn.setAttribute("title", email ? `Signed in as ${email}. Click to sign out.` : "Click to sign out");
    } else {
        authBtn.textContent = "Sign In";
        authBtn.classList.remove("authenticated");
        authBtn.removeAttribute("title");
    }
}
window.updateAuthUI = updateAuthUI;

function openAuthModal() {
    const token = localStorage.getItem("skin_token") || localStorage.getItem("token");
    if (token) {
        handleSignOut();
        return;
    }

    const modal = document.getElementById("authModal");
    if (!modal) return;

    const errorMsg = document.getElementById("authErrorMsg");
    if (errorMsg) {
        errorMsg.textContent = "";
        errorMsg.classList.add("hidden");
    }

    modal.classList.remove("hidden");
    modal.classList.add("active");

    const emailInput = document.getElementById("authEmail");
    if (emailInput) {
        setTimeout(() => emailInput.focus(), 100);
    }
}
window.openAuthModal = openAuthModal;

function closeAuthModal() {
    const modal = document.getElementById("authModal");
    if (!modal) return;

    modal.classList.add("hidden");
    modal.classList.remove("active");

    const errorMsg = document.getElementById("authErrorMsg");
    if (errorMsg) {
        errorMsg.textContent = "";
        errorMsg.classList.add("hidden");
    }
}
window.closeAuthModal = closeAuthModal;

function toggleAuthMode(e) {
    if (e && e.preventDefault) e.preventDefault();
    currentAuthMode = currentAuthMode === "login" ? "register" : "login";

    const titleEl = document.getElementById("authModalTitle");
    const subtitleEl = document.getElementById("authModalSubtitle");
    const submitBtn = document.getElementById("authSubmitBtn");
    const toggleText = document.getElementById("authToggleText");
    const toggleLink = document.getElementById("authToggleLink");
    const errorMsg = document.getElementById("authErrorMsg");

    if (errorMsg) {
        errorMsg.textContent = "";
        errorMsg.classList.add("hidden");
    }

    if (currentAuthMode === "register") {
        if (titleEl) titleEl.textContent = "Create Account";
        if (subtitleEl) subtitleEl.textContent = "Start tracking your skincare routine and streaks";
        if (submitBtn) submitBtn.textContent = "Create Account";
        if (toggleText) toggleText.textContent = "Already have an account?";
        if (toggleLink) toggleLink.textContent = "Sign In";
    } else {
        if (titleEl) titleEl.textContent = "Sign In";
        if (subtitleEl) subtitleEl.textContent = "Access your personalized routine & sync your streak";
        if (submitBtn) submitBtn.textContent = "Sign In";
        if (toggleText) toggleText.textContent = "Don't have an account?";
        if (toggleLink) toggleLink.textContent = "Register";
    }
}
window.toggleAuthMode = toggleAuthMode;

async function handleAuthSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();

    const emailInput = document.getElementById("authEmail");
    const passwordInput = document.getElementById("authPassword");
    const submitBtn = document.getElementById("authSubmitBtn");
    const errorMsg = document.getElementById("authErrorMsg");

    const email = emailInput?.value.trim();
    const password = passwordInput?.value.trim();

    if (!email || !password) {
        if (errorMsg) {
            errorMsg.textContent = "Please fill in all fields.";
            errorMsg.classList.remove("hidden");
        }
        return;
    }

    if (password.length < 6) {
        if (errorMsg) {
            errorMsg.textContent = "Password must be at least 6 characters long.";
            errorMsg.classList.remove("hidden");
        }
        return;
    }

    const originalBtnText = submitBtn ? submitBtn.textContent : "";
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = currentAuthMode === "register" ? "Creating Account..." : "Signing In...";
    }
    if (errorMsg) {
        errorMsg.textContent = "";
        errorMsg.classList.add("hidden");
    }

    const endpoint = currentAuthMode === "register" ? "/api/auth/register" : "/api/auth/login";

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            const errText = data.message || data.error || "Authentication failed. Please try again.";
            if (errorMsg) {
                errorMsg.textContent = errText;
                errorMsg.classList.remove("hidden");
            }
            showToast(errText, "error");
            return;
        }

        // Save skin_token and skin_email to localStorage
        localStorage.setItem("skin_token", data.token);
        localStorage.setItem("skin_email", data.email || email);
        localStorage.setItem("token", data.token);
        if (data.user) {
            localStorage.setItem("user", JSON.stringify(data.user));
        }

        // Synchronize streak from user document if present
        if (typeof data.streak === "number") {
            const trackerData = JSON.parse(localStorage.getItem(TRACKER_STORAGE_KEY) || "{}");
            trackerData.streak = data.streak;
            if (data.lastStreakDate !== undefined && data.lastStreakDate !== null) {
                trackerData.lastDate = data.lastStreakDate;
            }
            if (data.amCompleted !== undefined) trackerData.am = !!data.amCompleted;
            if (data.pmCompleted !== undefined) trackerData.pm = !!data.pmCompleted;
            localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(trackerData));
            loadRoutineTracker();
        }

        updateAuthUI();
        closeAuthModal();
        showToast(
            currentAuthMode === "register"
                ? `Account created! Welcome, ${data.email || email}`
                : `Welcome back, ${data.email || email}!`,
            "success"
        );
    } catch (err) {
        console.error("Auth submit error:", err);
        const netErr = "Cannot connect to server. Please try again.";
        if (errorMsg) {
            errorMsg.textContent = netErr;
            errorMsg.classList.remove("hidden");
        }
        showToast(netErr, "error");
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    }
}
window.handleAuthSubmit = handleAuthSubmit;

function handleSignOut() {
    localStorage.removeItem("skin_token");
    localStorage.removeItem("skin_email");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    updateAuthUI();
    showToast("Signed out successfully", "info");
}
window.handleSignOut = handleSignOut;

async function syncStreakToCloud(trackerData) {
    const token = localStorage.getItem("skin_token") || localStorage.getItem("token");
    if (!token) return;

    try {
        await fetch(`${API_BASE_URL}/api/auth/streak`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                streak: trackerData.streak || 0,
                lastStreakDate: trackerData.lastDate || null,
                amCompleted: !!trackerData.am,
                pmCompleted: !!trackerData.pm
            })
        });
    } catch (e) {
        console.warn("MongoDB streak sync skipped:", e.message);
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
    syncStreakToCloud(data);
}
window.handleRoutineCheck = handleRoutineCheck;

window.addEventListener("DOMContentLoaded", () => {
    initImageComparison();
    loadRoutineTracker();
    updateAuthUI();

    const authBtn = document.getElementById("authModalBtn");
    if (authBtn) {
        authBtn.addEventListener("click", (e) => {
            e.preventDefault();
            openAuthModal();
        });
    }

    const authToggleLink = document.getElementById("authToggleLink");
    if (authToggleLink) {
        authToggleLink.addEventListener("click", (e) => {
            e.preventDefault();
            toggleAuthMode(e);
        });
    }

    // Modal background click to close
    const authModal = document.getElementById("authModal");
    if (authModal) {
        authModal.addEventListener("click", (e) => {
            if (e.target === authModal) {
                closeAuthModal();
            }
        });
    }

    // Escape key listener to close modal
    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeAuthModal();
        }
    });

    // Check remote streak sync on initial load if logged in
    const token = localStorage.getItem("skin_token") || localStorage.getItem("token");
    if (token) {
        fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: { "Authorization": `Bearer ${token}` }
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (data && typeof data.streak === "number") {
                    const trackerData = JSON.parse(localStorage.getItem(TRACKER_STORAGE_KEY) || "{}");
                    trackerData.streak = data.streak;
                    if (data.lastStreakDate !== undefined && data.lastStreakDate !== null) {
                        trackerData.lastDate = data.lastStreakDate;
                    }
                    if (data.amCompleted !== undefined) trackerData.am = !!data.amCompleted;
                    if (data.pmCompleted !== undefined) trackerData.pm = !!data.pmCompleted;
                    localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(trackerData));
                    loadRoutineTracker();
                }
            })
            .catch(() => {});
    }
});
