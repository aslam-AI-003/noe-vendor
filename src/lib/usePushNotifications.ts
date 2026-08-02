'use client';

import { useEffect, useState } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Push Notification Hook
// Requests permission, gets FCM token, listens for foreground messages
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setPermission(Notification.permission);
  }, []);

  const requestPermission = async () => {
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm === 'granted') {
        // Get FCM token
        const { getApp } = await import('firebase/app');
        const app = getApp();
        const messaging = getMessaging(app);

        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: await navigator.serviceWorker.register('/firebase-messaging-sw.js'),
        });

        if (token) {
          setFcmToken(token);

          // Save token to Firestore via API
          const saved = localStorage.getItem('noe-vendor-profile');
          if (saved) {
            const profile = JSON.parse(saved);
            await fetch('/api/vendor/notifications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                vendorId: profile.id,
                fcmToken: token,
                action: 'save_token',
              }),
            });
          }
          toast.success('Notifications enabled! 🔔');
        }

        // Listen for foreground messages
        onMessage(messaging, (payload) => {
          console.log('🔔 Foreground notification:', payload);
          const { title, body } = payload.notification || {};
          toast(body || 'New notification', {
            icon: '🛒',
            duration: 5000,
            style: { fontWeight: 'bold' },
          });

          // Show browser notification too
          if (Notification.permission === 'granted') {
            new Notification(title || 'Namma Ooru Express', {
              body: body || 'New update',
              icon: '/icons/icon-192.png',
            });
          }
        });
      } else {
        toast.error('Notification permission denied');
      }
    } catch (err) {
      console.error('FCM Error:', err);
      toast.error('Failed to enable notifications');
    }
  };

  return { permission, fcmToken, requestPermission };
}
