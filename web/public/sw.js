// web/public/sw.js

const CACHE_NAME = "mynavw-cache-v1";
const OFFLINE_URL = "/offline.html";

// daftar resource awal yang mau dicache
const PRECACHE_URLS = ["/", "/offline.html", "/manifest.json"];

// install: cache file penting
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// activate: bersihkan cache lama jika ada
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// fetch: atur strategi cache
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // hanya tangani GET
  if (request.method !== "GET") return;

  // navigasi (user buka / reload halaman)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // kalau sukses, simpan ke cache
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, copy);
          });
          return response;
        })
        .catch(async () => {
          // kalau offline, coba dari cache atau offline page
          const cached = await caches.match(request);
          return cached || (await caches.match(OFFLINE_URL));
        })
    );
    return;
  }

  // untuk file statis / API: cache-first dengan fallback ke network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request)
        .then((networkResponse) => {
          // simpan di cache untuk kedepannya
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, copy);
          });
          return networkResponse;
        })
        .catch(() => {
          // kalau gagal dan tidak ada di cache, biarkan error bawaan
          return cachedResponse || Response.error();
        });
    })
  );
});
