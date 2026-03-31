// Mudamos para v4 para forçar a atualização
const CACHE_NAME = 'impostor-cache-v4';
const urlsToCache = [
  '/',
  '/index.html',
  '/regras.html',
  '/sobre.html',
  '/contato.html',
  '/style.css',
  '/js/main.js'
];

// 1. Instala e guarda os arquivos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. A MÁGICA DA LIMPEZA (É isso que faltava!)
// Apaga qualquer cache antigo que não seja o v4
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('PWA: Apagando cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// 3. Intercepta as requisições
self.addEventListener('fetch', event => {
  if (event.request.url.includes('/api/')) {
      return; 
  }
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});