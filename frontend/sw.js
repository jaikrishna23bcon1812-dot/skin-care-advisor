// ============================================================
//  AI Skin Care Advisor — Service Worker
//  Strategy : Stale-While-Revalidate for local static assets,
//             Bypass cache completely for /api/ and /health endpoints.
// ============================================================

const CACHE_NAME = "skincare-advisor-v10";

// Core static assets to pre-cache on install
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
// Pre-cache core application shell assets
self.addEventListener("install", (event) => {
    console.log("[SW] Install — caching core assets for", CACHE_NAME);

    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => cache.addAll(PRECACHE_ASSETS))
            .then(() => self.skipWaiting()) // activate immediately
            .catch((err) => console.error("[SW] Pre-cache failed:", err))
    );
});

// ── ACTIVATE ───────────────────────────────────────────────
// Delete all caches that do not match "skincare-advisor-v4"
self.addEventListener("activate", (event) => {
    console.log("[SW] Activate — deleting stale caches not matching", CACHE_NAME);

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
            .then(() => self.clients.claim())
    );
});

// ── FETCH ──────────────────────────────────────────────────
// Routing strategy:
//   • /api/ and /health endpoints             → Bypass cache completely (Network-only)
//   • Non-GET & cross-origin requests         → Bypass cache
//   • Local static assets (HTML, CSS, JS)     → Stale-While-Revalidate
self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // 1. Bypass cache completely for /api/ and /health endpoints
    if (url.pathname.startsWith("/api") || url.pathname === "/health" || url.pathname.startsWith("/health")) {
        return; // Direct network request without caching
    }

    // 2. Skip non-GET requests (POST/PUT/DELETE must go to network)
    if (request.method !== "GET") return;

    // 3. Skip cross-origin requests
    if (url.origin !== self.location.origin) return;

    // 4. Stale-While-Revalidate for local static assets (index.html, style.css, script.js, etc.)
    event.respondWith(staleWhileRevalidate(request));
});

// Stale-While-Revalidate strategy:
// Return cached version immediately for speed, while simultaneously
// fetching from network to update the cache for subsequent visits.
async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    const networkFetchPromise = fetch(request)
        .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        })
        .catch((err) => {
            console.warn("[SW] Background network fetch failed for:", request.url, err);
            return null;
        });

    // If cached response exists, return it immediately (stale)
    if (cachedResponse) {
        return cachedResponse;
    }

    // If not in cache, wait for network response
    const networkResponse = await networkFetchPromise;
    if (networkResponse) {
        return networkResponse;
    }

    // Offline fallback for navigation
    if (request.mode === "navigate") {
        const fallback = await cache.match("/index.html");
        if (fallback) return fallback;
    }

    return new Response("Service Unavailable", { status: 503, statusText: "Service Unavailable" });
}

// ── PUSH ───────────────────────────────────────────────────
// Receives Web Push payloads from the server and shows a
// system notification.
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
            data.body = event.data.text();
        }
    }

    const options = {
        body   : data.body,
        icon   : data.icon   || "/favicon.svg",
        badge  : data.badge  || "/favicon.svg",
        tag    : "skincare-push",
        renotify: false,
        vibrate: [200, 100, 200],
        data   : { url: data.url || "/" },
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
        : "/index.html#routineTracker";

    event.waitUntil(
        clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && "focus" in client) {
                        if ("navigate" in client) {
                            client.navigate(targetUrl);
                        }
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(targetUrl);
                }
            })
    );
});
