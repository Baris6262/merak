importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const CACHE = 'bm-v40';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/sorular.js',
  '/sorular-ek.js',
  '/kelimeler.js',
  '/manifest.json',
  '/icon.svg',
  '/icon-maskable.svg',
  '/favicon.svg',
  '/images/tarih.jpg',
  '/images/sanat.jpg',
  '/images/spor.jpg',
  '/images/cografya.jpg',
  '/images/bilim.jpg',
  '/images/sinema.jpg',
  '/images/muzik.jpg',
  '/images/teknoloji.jpg',
  '/images/yemek.jpg',
  '/images/edebiyat.jpg',
  '/images/mitoloji.jpg',
  '/images/astronomi.svg',
  '/images/saglik.svg',
  '/images/ekonomi.svg',
  '/images/hayvanlar.svg',
  '/images/bayrak.svg',
  '/images/logo.svg',
  '/images/astronomi.jpg',
  '/images/hayvanlar.jpg'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

firebase.initializeApp({
  apiKey: 'AIzaSyAqZ5Xdr2J4iOTSs587DrFtD6dqTzAN8ac',
  authDomain: 'baris-2ddf6.firebaseapp.com',
  projectId: 'baris-2ddf6',
  storageBucket: 'baris-2ddf6.firebasestorage.app',
  messagingSenderId: '736508330364',
  appId: '1:736508330364:web:7a4281b2ee1f1dfd7d24f9'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const notificationTitle = payload.notification.title || 'Merak.io';
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.svg',
    badge: '/icon-maskable.svg'
  };
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data?.url || '/'));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      });
    })
  );
});
