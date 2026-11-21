// Service worker volontairement vide : il rend le site installable sans jamais
// garder d'ancienne version en cache. Chaque rechargement prend la version à jour.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {})
