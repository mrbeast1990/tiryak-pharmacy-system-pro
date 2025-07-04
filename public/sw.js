
const CACHE_NAME = 'tiryak-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/src/main.tsx',
  '/src/index.css',
  '/lovable-uploads/e077b2e2-5bf4-4f3c-b603-29c91f59991e.png'
];

// تثبيت Service Worker وحفظ الملفات الأساسية
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching essential files');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// تفعيل Service Worker وحذف الكاشات القديمة
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// استراتيجية Cache First للملفات الثابتة و Network First للبيانات الديناميكية
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // تجاهل طلبات Supabase في وضع عدم الاتصال
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ 
            error: 'Offline', 
            message: 'البيانات غير متوفرة في وضع عدم الاتصال' 
          }),
          { 
            status: 503, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      })
    );
    return;
  }

  // Cache First للملفات الثابتة
  if (request.method === 'GET' && 
      (request.destination === 'script' || 
       request.destination === 'style' || 
       request.destination === 'image' ||
       url.pathname.endsWith('.tsx') ||
       url.pathname.endsWith('.css'))) {
    
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(request)
            .then(response => {
              if (response && response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(request, responseClone);
                  });
              }
              return response;
            });
        })
        .catch(() => {
          // إرجاع صفحة offline للطلبات الأساسية
          if (request.mode === 'navigate') {
            return caches.match('/');
          }
        })
    );
    return;
  }

  // Network First للصفحات والبيانات الديناميكية
  if (request.method === 'GET') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              
              // إرجاع صفحة offline للتنقل
              if (request.mode === 'navigate') {
                return caches.match('/');
              }
              
              return new Response('Offline', { status: 503 });
            });
        })
    );
  }
});

// مزامنة الخلفية
self.addEventListener('sync', event => {
  if (event.tag === 'pharmacy-sync') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  try {
    // إشعار الصفحات المفتوحة لبدء المزامنة
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_OFFLINE_DATA' });
    });
  } catch (error) {
    console.error('خطأ في مزامنة البيانات:', error);
  }
}
