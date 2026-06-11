const CACHE_NAME = "nightcalc-v72";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./assets/app-icons/icon.svg",
  "./assets/app-icons/favicon.svg",
  "./assets/app-icons/apple-touch-icon.png",
  "./assets/icons/menu.svg",
  "./assets/icons/github.svg",
  "./assets/icons/gmail.svg",
  "./assets/icons/pickaxe.png",
  "./assets/icons/check.svg",
  "./assets/icons/lightning-bolt.png",
  "./assets/screenshots/install/dock.jpg",
  "./assets/screenshots/install/share-menu.jpg",
  "./assets/screenshots/install/add-to-home.jpg",
  "./assets/screenshots/install/open-web-app.jpg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (event.request.mode === "navigate" || requestUrl.search) {
    event.respondWith(fetch(event.request).catch(() => caches.match("./index.html")));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
