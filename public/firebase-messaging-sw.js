// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Firebase Cloud Messaging Service Worker
// Handles push notifications when app is in background
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Initialize Firebase in service worker
firebase.initializeApp({
  apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxx", // Will be replaced with actual key
  authDomain: "noed-4008d.firebaseapp.com",
  projectId: "noed-4008d",
  storageBucket: "noed-4008d.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('📨 Background notification:', payload);

  const { title, body, icon, data } = payload.notification || {};

  const notificationOptions = {
    body: body || 'New notification from Namma Ooru Express',
    icon: icon || '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [200, 100, 200],
    tag: data?.orderId || 'noe-notification',
    data: {
      url: data?.url || '/dashboard/shop/orders',
      orderId: data?.orderId,
      type: data?.type,
    },
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  self.registration.showNotification(
    title || '🛒 Namma Ooru Express',
    notificationOptions
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification.data);
  event.notification.close();

  const url = event.notification.data?.url || '/dashboard/shop/orders';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes('/dashboard') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      return clients.openWindow(url);
    })
  );
});
