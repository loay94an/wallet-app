// ============================================================
// 📦 sw.js — Service Worker للمحفظة المالية
// ============================================================
// ✅ يجعل التطبيق يعمل offline 100%
// ✅ يخزّن كل الملفات + المكتبات الخارجية
// ============================================================

const CACHE_VERSION = 'wallet-v15-4-pwa-v1';
const CACHE_STATIC = CACHE_VERSION + '-static';
const CACHE_DYNAMIC = CACHE_VERSION + '-dynamic';

// الملفات الأساسية (تُحمّل فور التثبيت)
const STATIC_ASSETS = [
  './',
  './index.html',
  './offline.html',
  './manifest.json',
  './style.css',
  './js/core.js',
  './js/ui-pages.js',
  './js/ui-dashboard.js',
  './js/ui-work.js',
  './js/ui-tools.js',
  './js/ui-notebook.js',
  './js/init.js'
];

// المكتبات الخارجية (CDN) — تُحمّل بعد التثبيت
const CDN_ASSETS = [
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// ============ 📥 INSTALL ============
self.addEventListener('install', event => {
  console.log('🔧 SW: Installing...');
  event.waitUntil(
    (async () => {
      // 1. خزّن الملفات الأساسية (إجباري)
      const staticCache = await caches.open(CACHE_STATIC);
      await staticCache.addAll(STATIC_ASSETS).catch(err => {
        console.error('❌ SW: فشل caching الملفات الأساسية:', err);
      });

      // 2. خزّن CDN (اختياري — لا يفشل التثبيت لو فشل)
      for (const url of CDN_ASSETS) {
        try {
          const response = await fetch(url, { mode: 'cors' });
          if (response.ok) {
            await staticCache.put(url, response);
            console.log('✅ SW: cached CDN:', url);
          }
        } catch (err) {
          console.warn('⚠️ SW: فشل caching CDN:', url, err.message);
        }
      }

      // 3. خزّن الخطوط والأيقونات (Font files)
      try {
        const fontUrl = 'https://fonts.gstatic.com/s/tajawal/v10/Iura6YBj_oCad4k1l4qkLrE6fQ.woff2';
        const fontResp = await fetch(fontUrl);
        if (fontResp.ok) {
          await staticCache.put(fontUrl, fontResp);
          console.log('✅ SW: cached font file');
        }
      } catch (err) {
        console.warn('⚠️ SW: فشل caching font:', err.message);
      }

      // 4. فعّل Service Worker الجديد فورًا
      await self.skipWaiting();
      console.log('✅ SW: Installed successfully');
    })()
  );
});

// ============ 🚀 ACTIVATE ============
self.addEventListener('activate', event => {
  console.log('🔧 SW: Activating...');
  event.waitUntil(
    (async () => {
      // احذف caches القديمة
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => name.startsWith('wallet-') && name !== CACHE_STATIC && name !== CACHE_DYNAMIC)
          .map(name => {
            console.log('🗑️ SW: Deleting old cache:', name);
            return caches.delete(name);
          })
      );

      // تحكم في كل الصفحات المفتوحة فورًا
      await self.clients.claim();
      console.log('✅ SW: Activated successfully');
    })()
  );
});

// ============ 🌐 FETCH ============
self.addEventListener('fetch', event => {
  const request = event.request;

  // تجاهل الطلبات غير GET
  if (request.method !== 'GET') return;

  // تجاهل chrome-extension والطلبات غير HTTP
  if (!request.url.startsWith('http')) return;

  // تجاهل طلبات chrome devtools
  if (request.url.includes('chrome-extension://')) return;

  // استراتيجية: Cache First, Network Fallback
  event.respondWith(
    (async () => {
      // 1. ابحث في cache
      const cached = await caches.match(request);
      if (cached) {
        return cached;
      }

      // 2. حمّل من الشبكة
      try {
        const networkResponse = await fetch(request);

        // خزّن الردود الناجحة فقط
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          const cache = await caches.open(CACHE_DYNAMIC);
          cache.put(request, responseClone).catch(err => {
            console.warn('⚠️ SW: فشل caching:', request.url);
          });
        }

        return networkResponse;
      } catch (error) {
        // 3. فشل الاتصال — رجّع صفحة offline للـ HTML
        if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
          const offlinePage = await caches.match('./offline.html');
          if (offlinePage) return offlinePage;
        }

        // 4. رد بديل للصور
        if (request.destination === 'image') {
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#1a1a35"/><text x="50" y="55" font-size="30" text-anchor="middle" fill="#7c3aed">📱</text></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        }

        // 5. رفض الباقي
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    })()
  );
});

// ============ 📨 MESSAGES ============
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(keys => {
      keys.forEach(key => caches.delete(key));
    });
  }
});

// ============ 🔔 PUSH (اختياري للمستقبل) ============
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'المحفظة المالية', {
      body: data.body || '',
      icon: 'icons/icon-192.png',
      badge: 'icons/icon-72.png',
      dir: 'rtl',
      lang: 'ar'
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes('index.html') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./index.html');
      }
    })
  );
});

console.log('📦 SW: Service Worker file loaded');