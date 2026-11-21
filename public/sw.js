// Minimal service worker: it only makes the site installable. It never caches
// anything, so a new version is picked up as soon as the page is reloaded.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {})
