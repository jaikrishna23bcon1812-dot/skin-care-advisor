// ============================================================
//  AI Skin Care Advisor — Service Worker
//  Strategy : Cache-First for static assets, Network-First
//             for navigation, Network-Only for API calls.
// ============================================================

const CACHE_NAME    = "skincare-ai-v1";
const CACHE_VERSION = 1;

// Core assets to pre-cache on install
const PRECACHE_ASSETS = [
    "/",
    "/index.html",
    "/login.html",
    "/register.html",
    "/dashboard.html",
    "/analysis.html",
    "/routine.html",
    "/progress.html",
    "/compare.html",
    "/community.html",
    "/products.html",
    "/profile.html",
    "/settings.html",
    "/style.css",
    "/script.js",
    "/translations.js",
    "/favicon.svg"
];

// ── INSTALL ────────────────────────────────────────────────
// Pre-cache all static shell assets so the app works offline
// immediately after the first visit.
self.addEventListener("install", (event) => {
    console.log("[SW] Install — caching core assets");

    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => cache.addAll(PRECACHE_ASSETS))
            .then(() => self.skipWaiting())   // activate immediately, don't wait for tabs to close
            .catch((err) => console.error("[SW] Pre-cache failed:", err))
    );
});

// ── ACTIVATE ───────────────────────────────────────────────
// Delete any old cache versions that don't match CACHE_NAME.
self.addEventListener("activate", (event) => {
    console.log("[SW] Activate — purging old caches");

    event.waitUntil(
        caches
            .keys()
            .then((cacheNames) =>
                Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => {
                            console.log("[SW] Deleting stale cache:", name);
                            return caches.delete(name);
                        })
                )
            )
            .then(() => self.clients.claim())  // take control of existing clients straight away
    );
});

// ── FETCH ──────────────────────────────────────────────────
// Routing strategy:
//   • Cross-origin requests (backend API, Google Fonts, CDN) → Network-Only
//   • Same-origin navigation (HTML pages)                    → Network-First, cache fallback
//   • Same-origin static assets (CSS, JS, images, SVG)      → Cache-First, network fallback
self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // 1. Skip cross-origin requests entirely (API, fonts, analytics, etc.)
    if (url.origin !== self.location.origin) return;

    // 2. Skip non-GET requests (POST/PUT/DELETE must hit the network)
    if (request.method !== "GET") return;

    // 3. Navigation requests (HTML) — Network-First so content stays fresh,
    //    with a cached page as offline fallback.
    if (request.mode === "navigate") {
        event.respondWith(networkFirstThenCache(request));
        return;
    }

    // 4. Static assets — Cache-First for instant loads.
    event.respondWith(cacheFirstThenNetwork(request));
});

// Cache-First: return from cache if available, else fetch & store
async function cacheFirstThenNetwork(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const networkResponse = await fetch(request);
        // Only cache valid, same-origin responses
        if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (err) {
        console.warn("[SW] Cache-first network fallback failed:", request.url);
        // Return a minimal offline placeholder for non-HTML assets
        return new Response("", { status: 503, statusText: "Service Unavailable" });
    }
}

// Network-First: try network, fall back to cache, then offline page
async function networkFirstThenCache(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch {
        const cached = await caches.match(request);
        if (cached) return cached;

        // Last resort: serve the cached root index as a shell fallback
        return caches.match("/index.html");
    }
}

// ── PUSH ───────────────────────────────────────────────────
// Receives Web Push payloads from the server and shows a
// system notification. Payload format (JSON):
//   { title, body, icon, badge, url }
self.addEventListener("push", (event) => {
    let data = {
        title : "AI Skin Care Advisor",
        body  : "You have a new skincare update! 🌿",
        icon  : "/favicon.svg",
        badge : "/favicon.svg",
        url   : "/"
    };

    if (event.data) {
        try {
            data = { ...data, ...event.data.json() };
        } catch {
            // If payload isn't valid JSON, use the raw text as the body
            data.body = event.data.text();
        }
    }

    const options = {
        body   : data.body,
        icon   : data.icon   || "/favicon.svg",
        badge  : data.badge  || "/favicon.svg",
        tag    : "skincare-push",          // replaces any existing notification with same tag
        renotify: false,
        vibrate: [200, 100, 200],
        data   : { url: data.url || "/" }, // stored for notificationclick
        actions: [
            { action: "open",    title: "Open App" },
            { action: "dismiss", title: "Dismiss"  }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// ── NOTIFICATION CLICK ─────────────────────────────────────
// Opens (or focuses) the app when the user taps a notification.
self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    if (event.action === "dismiss") return;

    const targetUrl = (event.notification.data && event.notification.data.url)
        ? event.notification.data.url
        : "/";

    event.waitUntil(
        clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clientList) => {
                // Focus an existing tab if one is already open
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && "focus" in client) {
                        client.navigate(targetUrl);
                        return client.focus();
                    }
                }
                // Otherwise open a new window
                if (clients.openWindow) {
                    return clients.openWindow(targetUrl);
                }
            })
    );
});
