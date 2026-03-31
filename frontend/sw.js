const CACHE_NAME = 'impostor-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/regras.html',
  '/sobre.html',
  '/contato.html',
  '/style.css',
  '/js/main.js'
];

// 1. Instala o Service Worker e guarda os arquivos no cache do celular
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. Intercepta as requisições para usar o cache quando possível (Carregamento rápido)
self.addEventListener('fetch', event => {
  // Ignora chamadas para a nossa API do Render (para o jogo sempre pegar dados novos)
  if (event.request.url.includes('/api/')) {
      return; 
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retorna o arquivo do cache se existir, senão baixa da internet
        return response || fetch(event.request);
      })
  );
});