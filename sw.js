const CACHE_VERSION = '1.20.4';
const CACHE_NAME = `blockschaltbild-${CACHE_VERSION}`;

const APP_FILES = [
    './',
    './index.html',
    './styles.css',
    './version.js',
    './bugreport-config.js',
    './toolbar-menu.js',
    './logo.js',
    './app-core.js',
    './app-library.js',
    './app-canvas.js',
    './app-connections.js',
    './app-modals.js',
    './app-export.js',
    './app-history.js',
    './app-shortcuts.js',
    './app-events.js',
    './app-bugreport.js',
    './app-readonly.js',
    './app-bootstrap.js',
    './supabase-config.js',
    './cloud-auth.js',
    './geraete-admin.html',
    './geraete-admin.js',
    './favicon.png',
    './manifest.webmanifest',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

const CDN_FILES = [
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(APP_FILES.map(f => new Request(f + (f.includes('.') && !f.endsWith('/') ? `?v=${CACHE_VERSION}` : ''), { cache: 'reload' })));
        await Promise.all(CDN_FILES.map(url => cache.add(url).catch(() => null)));
        await self.skipWaiting();
    })());
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.filter(k => k.startsWith('blockschaltbild-') && k !== CACHE_NAME).map(k => caches.delete(k)));
        await self.clients.claim();
    })());
});

function isCacheable(request) {
    if (request.method !== 'GET') return false;
    const url = new URL(request.url);
    if (url.origin === self.location.origin) return true;
    return url.hostname === 'cdnjs.cloudflare.com' || url.hostname === 'cdn.jsdelivr.net' || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
}

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (!isCacheable(request)) return;

    event.respondWith((async () => {
        const cache = await caches.open(CACHE_NAME);
        try {
            const response = await fetch(request);
            if (response && response.ok) cache.put(request, response.clone());
            return response;
        } catch (err) {
            const cached = await cache.match(request, { ignoreSearch: true });
            if (cached) return cached;
            if (request.mode === 'navigate') {
                const index = await cache.match('./index.html', { ignoreSearch: true });
                if (index) return index;
            }
            throw err;
        }
    })());
});
