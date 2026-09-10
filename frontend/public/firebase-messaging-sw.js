// Firebase Cloud Messaging Service Worker
// Scripts for firebase and firebase messaging in service worker
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBmhaJAARxrFafZztQiQLqp9QlVpVZQdZE",
  authDomain: "ehms-c37a6.firebaseapp.com",
  projectId: "ehms-c37a6",
  storageBucket: "ehms-c37a6.firebasestorage.app",
  messagingSenderId: "206575333313",
  appId: "1:206575333313:web:397f1ab96553a374550940"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);

  const notificationTitle = payload.notification?.title || 'EHMS Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/favicon.ico',
    data: payload.data || {},
    badge: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const clickActionUrl = event.notification.data?.click_action || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === clickActionUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(clickActionUrl);
      }
    })
  );
});
