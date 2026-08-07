'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ORDER ALERT — Sound + Browser Notification on new orders
// Polls every 10 seconds for new orders
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function useOrderAlert() {
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const lastKnownCount = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/sounds/order-alert.mp3');
      audioRef.current.volume = 1.0;

      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Play alert sound
  const playSound = useCallback(() => {
    if (!soundEnabled || !audioRef.current) return;
    try {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Browser may block autoplay, ignore silently
        console.log('🔇 Sound blocked by browser autoplay policy');
      });
    } catch (e) {}
  }, [soundEnabled]);

  // Show browser notification
  const showNotification = useCallback((orderId: string, total: number) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('🔔 New Order!', {
        body: `Order #${orderId.slice(0, 8)} • ₹${total}\nTap to view`,
        icon: '/icons/icon-144.png',
        badge: '/icons/icon-144.png',
        tag: 'new-order',
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after 15 seconds
      setTimeout(() => notification.close(), 15000);
    }
  }, []);

  // Poll for new orders
  const checkForNewOrders = useCallback(async () => {
    try {
      const savedProfile = localStorage.getItem('noe-vendor-profile');
      if (!savedProfile) return;
      
      const profile = JSON.parse(savedProfile);
      if (!profile.id) return;
      // Check both fields for admin panel compatibility
      const isLive = profile.onboardingStatus === 'active' 
        || profile.onboardingStatus === 'approved'
        || profile.status === 'approved';
      if (!isLive) return;

      const res = await fetch(`/api/vendor/orders?vendorId=${profile.id}`);
      const data = await res.json();

      if (data.success && data.orders) {
        const newOrders = data.orders.filter((o: any) => o.status === 'placed');
        const currentCount = newOrders.length;

        // If new orders arrived since last check
        if (currentCount > lastKnownCount.current && lastKnownCount.current >= 0) {
          const diff = currentCount - lastKnownCount.current;
          
          if (lastKnownCount.current > 0) {
            // Play sound for each new order
            playSound();
            
            // Show toast
            toast('🔔 New order received!', {
              icon: '🛎️',
              duration: 5000,
              style: {
                background: '#0E9F6E',
                color: '#fff',
                fontWeight: 'bold',
              },
            });

            // Show browser notification for latest order
            if (newOrders.length > 0) {
              const latest = newOrders[0];
              showNotification(latest.id, latest.total || 0);
            }
          }
        }

        lastKnownCount.current = currentCount;
        setNewOrderCount(currentCount);
      }
    } catch (err) {
      // Silent fail — don't spam errors
    }
  }, [playSound, showNotification]);

  // Start polling
  const startPolling = useCallback(() => {
    // Initial check
    checkForNewOrders();

    // Poll every 10 seconds
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(checkForNewOrders, 10000);
  }, [checkForNewOrders]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Toggle sound
  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const next = !prev;
      toast.success(next ? '🔊 Sound alerts ON' : '🔇 Sound alerts OFF');
      return next;
    });
  }, []);

  // Test sound (for user to verify)
  const testSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        toast.error('Sound blocked. Click anywhere first to enable audio.');
      });
    }
  }, []);

  return {
    newOrderCount,
    soundEnabled,
    toggleSound,
    testSound,
    startPolling,
    stopPolling,
  };
}
