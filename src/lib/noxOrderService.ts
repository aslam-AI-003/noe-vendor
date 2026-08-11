/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * NOX ORDER SERVICE — Vendor Operations
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * Vendor App Operations:
 * - Listen for new orders (real-time)
 * - Accept order
 * - Mark as preparing
 * - Mark as ready for pickup
 * - Reject/cancel order
 * - Get order history
 */

import {
  collection, doc, getDoc, getDocs, updateDoc,
  query, where, orderBy, onSnapshot, serverTimestamp, limit,
} from 'firebase/firestore';
import { db } from './firebase';
import type { NoxOrder, NoxOrderStatus } from '@/types/noxOrder';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function getDb() {
  if (!db) {
    console.warn('⚠️ Firebase not initialized.');
    return null;
  }
  return db;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LISTEN SHOP ORDERS — Real-time listener for incoming orders
// Queries by shopId AND shopName for maximum matching (handles seed IDs + Firestore IDs)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function listenShopOrders(shopId: string, callback: (orders: NoxOrder[]) => void, shopName?: string): () => void {
  const firestore = getDb();
  if (!firestore) return () => {};

  // Primary query: by shopId (Firestore vendor doc ID)
  const q1 = query(
    collection(firestore, 'orders'),
    where('shopId', '==', shopId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  const allOrders = new Map<string, NoxOrder>();
  const unsubs: (() => void)[] = [];

  const emitAll = () => {
    const sorted = Array.from(allOrders.values()).sort((a, b) =>
      (b.createdAt || '').localeCompare(a.createdAt || '')
    );
    callback(sorted);
  };

  // Listener 1: by shopId
  unsubs.push(onSnapshot(q1, (snapshot: any) => {
    snapshot.docs.forEach((d: any) => {
      const data = d.data() as NoxOrder;
      allOrders.set(d.id, data);
    });
    emitAll();
  }, (_error: any) => {
    console.error('Listen shop orders (shopId) error:', _error);
  }));

  // Listener 2: by shopName (catches orders where customer saved seed shopId instead of vendor docId)
  if (shopName) {
    const q2 = query(
      collection(firestore, 'orders'),
      where('shopName', '==', shopName),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    unsubs.push(onSnapshot(q2, (snapshot: any) => {
      snapshot.docs.forEach((d: any) => {
        const data = d.data() as NoxOrder;
        allOrders.set(d.id, data);
      });
      emitAll();
    }, (_error: any) => {
      console.error('Listen shop orders (shopName) error:', _error);
    }));
  }

  // Listener 3: by vendorId field (if customer saved it)
  const q3 = query(
    collection(firestore, 'orders'),
    where('vendorId', '==', shopId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  unsubs.push(onSnapshot(q3, (snapshot: any) => {
    snapshot.docs.forEach((d: any) => {
      const data = d.data() as NoxOrder;
      allOrders.set(d.id, data);
    });
    emitAll();
  }, (_error: any) => {
    // vendorId field may not exist on all orders — that's fine
  }));

  return () => unsubs.forEach(u => u());
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LISTEN NEW/PENDING ORDERS — Only placed orders
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function listenNewOrders(shopId: string, callback: (orders: NoxOrder[]) => void): () => void {
  const firestore = getDb();
  if (!firestore) return () => {};

  const q = query(
    collection(firestore, 'orders'),
    where('shopId', '==', shopId),
    where('status', '==', 'placed')
  );

  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => doc.data() as NoxOrder);
    callback(orders);
  }, (error) => {
    console.error('Listen new orders error:', error);
    callback([]);
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LISTEN ACTIVE ORDERS — Orders being processed
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function listenActiveOrders(shopId: string, callback: (orders: NoxOrder[]) => void): () => void {
  const firestore = getDb();
  if (!firestore) return () => {};

  const q = query(
    collection(firestore, 'orders'),
    where('shopId', '==', shopId),
    where('status', 'in', ['accepted', 'preparing', 'ready'])
  );

  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => doc.data() as NoxOrder);
    callback(orders);
  }, (error) => {
    console.error('Listen active orders error:', error);
    callback([]);
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ACCEPT ORDER — Vendor accepts the order
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function acceptOrder(orderId: string, vendorId: string, prepTime?: number): Promise<boolean> {
  const firestore = getDb();
  if (!firestore) return false;

  try {
    const orderRef = doc(firestore, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) return false;

    const order = orderSnap.data() as NoxOrder;
    const updatedTimeline = [...order.timeline, {
      status: 'accepted' as NoxOrderStatus,
      timestamp: new Date().toISOString(),
      note: prepTime ? `Preparing — estimated ${prepTime} mins` : 'Order accepted',
      updatedBy: vendorId,
    }];

    await updateDoc(orderRef, {
      status: 'accepted',
      acceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      timeline: updatedTimeline,
      estimatedDelivery: prepTime ? `${prepTime + 10} mins` : order.estimatedDelivery,
    });

    console.log('✅ Order accepted:', orderId);
    return true;
  } catch (error) {
    console.error('Error accepting order:', error);
    return false;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MARK PREPARING — Vendor starts preparing
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function markPreparing(orderId: string, vendorId: string): Promise<boolean> {
  const firestore = getDb();
  if (!firestore) return false;

  try {
    const orderRef = doc(firestore, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) return false;

    const order = orderSnap.data() as NoxOrder;
    const updatedTimeline = [...order.timeline, {
      status: 'preparing' as NoxOrderStatus,
      timestamp: new Date().toISOString(),
      note: 'Shop is preparing your order',
      updatedBy: vendorId,
    }];

    await updateDoc(orderRef, {
      status: 'preparing',
      preparedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      timeline: updatedTimeline,
    });

    return true;
  } catch (error) {
    console.error('Error marking preparing:', error);
    return false;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MARK READY — Order ready for pickup by rider
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function markReady(orderId: string, vendorId: string): Promise<boolean> {
  const firestore = getDb();
  if (!firestore) return false;

  try {
    const orderRef = doc(firestore, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) return false;

    const order = orderSnap.data() as NoxOrder;
    const updatedTimeline = [...order.timeline, {
      status: 'ready' as NoxOrderStatus,
      timestamp: new Date().toISOString(),
      note: 'Order ready for pickup',
      updatedBy: vendorId,
    }];

    await updateDoc(orderRef, {
      status: 'ready',
      updatedAt: serverTimestamp(),
      timeline: updatedTimeline,
    });

    console.log('✅ Order marked ready:', orderId);
    return true;
  } catch (error) {
    console.error('Error marking ready:', error);
    return false;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REJECT ORDER — Vendor rejects/cancels
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function rejectOrder(orderId: string, vendorId: string, reason: string): Promise<boolean> {
  const firestore = getDb();
  if (!firestore) return false;

  try {
    const orderRef = doc(firestore, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) return false;

    const order = orderSnap.data() as NoxOrder;
    const updatedTimeline = [...order.timeline, {
      status: 'cancelled' as NoxOrderStatus,
      timestamp: new Date().toISOString(),
      note: `Rejected by shop: ${reason}`,
      updatedBy: vendorId,
    }];

    await updateDoc(orderRef, {
      status: 'cancelled',
      cancelReason: reason,
      cancelledBy: vendorId,
      cancelledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      timeline: updatedTimeline,
    });

    return true;
  } catch (error) {
    console.error('Error rejecting order:', error);
    return false;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET TODAY'S ORDERS — For dashboard stats
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function getTodayOrders(shopId: string): Promise<NoxOrder[]> {
  const firestore = getDb();
  if (!firestore) return [];

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const q = query(
      collection(firestore, 'orders'),
      where('shopId', '==', shopId),
      where('createdAt', '>=', today),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as NoxOrder);
  } catch (error) {
    console.error('Error fetching today orders:', error);
    return [];
  }
}
