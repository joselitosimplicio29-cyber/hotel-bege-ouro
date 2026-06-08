const CACHE_NAME = 'hotel-ourobege-pwa-v11';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/reservar.html',
  '/quartos.html',
  '/contato.html',
  '/galeria.html',
  '/sobre.html',
  '/catalogo_hotel.html',
  '/admin/login.html',
  '/admin/dashboard.html',
  '/css/style.css',
  '/css/admin.css',
  '/js/pwa.js',
  '/js/supabase-loader.js',
  '/js/supabase.min.js',
  '/js/site.js',
  '/js/admin.js',
  '/js/db.js',
  '/js/pdf.js',
  '/js/supabase-config.js',
  '/manifest.json',
  '/favicon.svg',
  '/img/icone.png',
  '/img/WhatsApp%20Image%202026-05-25%20at%2021.43.43.jpeg',
  '/img/WhatsApp%20Image%202026-05-25%20at%2021.43.43%20(3).jpeg',
  '/img/WhatsApp%20Image%202026-05-25%20at%2021.43.43%20(2).jpeg',
  '/img/WhatsApp%20Image%202026-05-25%20at%2021.43.43%20(1).jpeg',
  '/img/WhatsApp%20Image%202026-05-25%20at%2021.43.42.jpeg',
  '/img/WhatsApp%20Image%202026-05-25%20at%2021.43.42%20(3).jpeg',
  '/img/WhatsApp%20Image%202026-05-25%20at%2021.43.42%20(2).jpeg',
  '/img/WhatsApp%20Image%202026-05-25%20at%2021.43.42%20(1).jpeg',
  '/img/WhatsApp%20Image%202026-05-25%20at%2021.43.41.jpeg',
  '/img/tv-ar-condicionado.jpg',
  '/img/TV%20E%20AR.png',
  '/img/restaurante.png',
  '/img/recepcao.png',
  '/img/quarto_triplo_final.png',
  '/img/quarto_triplo_1.png',
  '/img/quarto_solteiro_final.png',
  '/img/quarto_solteiro.png',
  '/img/quarto_individual_3.png',
  '/img/quarto_individual_1.png',
  '/img/quarto-triplo.jpg',
  '/img/quarto-triplo-familia-hotel-ourolandia.jpg',
  '/img/quarto-solteiro.jpg',
  '/img/quarto-solteiro-hotel-bege-ouro.jpg',
  '/img/quarto-casal.jpg',
  '/img/quarto-casal-hotel-ourolandia-ba.jpg',
  '/img/quarto-casal-3.jpg',
  '/img/quarto-casal-2.jpg',
  '/img/piscina.png',
  '/img/pia-vaso.jpg',
  '/img/pia-solteiro.jpg',
  '/img/lobby.png',
  '/img/lobby-recepcao-hotel-bege-ouro.jpg',
  '/img/lobby-real.jpg',
  '/img/lobby-real%20-%20Copia.jpg',
  '/img/galeria_poltronas.png',
  '/img/galeria_poltronas%20-%20Copia.png',
  '/img/galeria_iluminacao.png',
  '/img/galeria_iluminacao%20-%20Copia.png',
  '/img/galeria_frutas.png',
  '/img/galeria_doces.png',
  '/img/frigobar.jpg',
  '/img/frigobar-tv-casal.jpg',
  '/img/foto-capa.jpg',
  '/img/foto-capa%20-%20Copia.jpg',
  '/img/fachada.png',
  '/img/fachada-hotel-bege-ouro-ourolandia.jpg',
  '/img/ESPELHO.png',
  '/img/cafe.png',
  '/img/cafe-da-manha-hotel-ourolandia-bahia.png',
  '/img/banheiro_2.png',
  '/img/banheiro-triplo.jpg',
  '/img/banheiro-solteiro.jpg',
  '/img/banheiro-geral.jpg',
  '/img/banheiro-casal.jpg',
  '/img/banheiro-casal-3.jpg'
];

const NAVIGATION_FALLBACKS = new Map([
  ['/admin', '/admin/login.html'],
  ['/admin/', '/admin/login.html'],
  ['/dashboard', '/admin/login.html'],
  ['/admin/login', '/admin/login.html'],
  ['/admin/dashboard', '/admin/dashboard.html'],
  ['/reservar', '/reservar.html'],
  ['/quartos', '/quartos.html'],
  ['/contato', '/contato.html'],
  ['/galeria', '/galeria.html'],
  ['/sobre', '/sobre.html'],
  ['/catalogo_hotel', '/catalogo_hotel.html']
]);

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});

async function networkFirstNavigation(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (_) {
    const url = new URL(request.url);
    const fallback = NAVIGATION_FALLBACKS.get(url.pathname) || `${url.pathname.replace(/\/$/, '')}.html`;
    return (
      await cache.match(request, { ignoreSearch: true }) ||
      await cache.match(fallback, { ignoreSearch: true }) ||
      await cache.match('/index.html')
    );
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;

  const response = await fetch(request);
  if (response && (response.ok || response.type === 'opaque')) {
    cache.put(request, response.clone());
  }
  return response;
}
