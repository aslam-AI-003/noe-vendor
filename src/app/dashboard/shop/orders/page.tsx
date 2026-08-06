'use client';

import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  ShoppingBag, Clock, CheckCircle2, XCircle, ChefHat, Package,
  Truck, Bell, RefreshCw, Phone, MapPin, IndianRupee, Timer,
} from 'lucide-react';
import { PrepTimer, PrepTimePicker } from '@/components/orders/PrepTimer';
import { useLanguage } from '@/lib/i18n/index';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, getDocs } from 'firebase/firestore';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ORDERS PAGE — Real-time vendor order management
// Primary: Firestore onSnapshot (instant updates)
// Fallback: HTTP polling every 10s if Firestore fails
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryAddress: string;
  status: string;
  paymentMethod: string;
  createdAt?: any;
  acceptedAt?: any;
  estimatedPrepTime?: number;
}

const STATUS_FLOW = ['new', 'accepted', 'preparing', 'ready', 'picked_up', 'delivered'];

export default function OrdersPage() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendorId, setVendorId] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [showPrepPicker, setShowPrepPicker] = useState<string | null>(null); // orderId showing picker

  const prevOrderCountRef = useRef(0);

  useEffect(() => {
    const saved = localStorage.getItem('noe-vendor-profile');
    if (saved) {
      const profile = JSON.parse(saved);
      
      // Re-sync profile from Firestore using phone (fixes stale localStorage)
      if (db && profile.phone) {
        const vendorsRef = collection(db, 'vendors');
        const q2 = query(vendorsRef, where('phone', '==', profile.phone));
        getDocs(q2).then((snap: any) => {
          if (!snap.empty) {
            // Prefer approved vendor
            const approvedDoc = snap.docs.find((d: any) => d.data().status === 'approved');
            const correctDoc = approvedDoc || snap.docs[0];
            const correctId = correctDoc.id;
            const correctData = correctDoc.data();
            
            // Update localStorage with correct profile
            const updatedProfile = { ...profile, id: correctId, shopName: correctData.shopName, shopId: correctData.shopId || correctId };
            localStorage.setItem('noe-vendor-profile', JSON.stringify(updatedProfile));
            
            setVendorId(correctId);
            if (correctData.shopId) {
              (window as any).__vendorShopId = correctData.shopId;
            }
            fetchOrders(correctId);
          }
        }).catch(() => {
          // Fallback to cached profile
          setVendorId(profile.id);
          fetchOrders(profile.id);
        });
      } else {
        setVendorId(profile.id);
        if (profile.shopId) {
          (window as any).__vendorShopId = profile.shopId;
        }
        fetchOrders(profile.id);
      }
    }
  }, []);

  // Real-time Firestore listener (instant order updates)
  useEffect(() => {
    if (!vendorId || !db) return;

    const shopId = (window as any).__vendorShopId || '';

    try {
      const ordersRef = collection(db, 'orders');
      // Query by vendorId (Firestore doc ID)
      const q = query(
        ordersRef,
        where('vendorId', '==', vendorId),
        orderBy('createdAt', 'desc')
      );

      // Also query by shopId field (some orders have shopId but no vendorId)
      const q2 = query(ordersRef, where('shopId', '==', vendorId), orderBy('createdAt', 'desc'));
      const unsubShopId = onSnapshot(q2, (snapshot) => {
        const shopIdOrders: Order[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];
        if (shopIdOrders.length > 0) {
          setOrders(prev => {
            const ids = new Set(prev.map(o => o.id));
            const newOnes = shopIdOrders.filter(o => !ids.has(o.id));
            return newOnes.length > 0 ? [...prev, ...newOnes].sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0)) : prev;
          });
        }
      });

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const liveOrders: Order[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];

        // Detect new orders (play sound)
        const newCount = liveOrders.filter(o => o.status === 'new').length;
        if (newCount > prevOrderCountRef.current && prevOrderCountRef.current > 0) {
          // New order arrived!
          try { new Audio('/sounds/order-alert.mp3').play(); } catch {}
          toast('🔔 New order received!', {
            icon: '🛎️',
            duration: 5000,
            style: { background: '#F97316', color: '#fff', fontWeight: 'bold' },
          });
        }
        prevOrderCountRef.current = newCount;

        setOrders(liveOrders);
        setLoading(false);
      }, (error) => {
        console.error('Firestore listener error, falling back to polling:', error);
        // Fallback: start polling if Firestore listener fails
        startPollingFallback();
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Failed to setup Firestore listener:', err);
      startPollingFallback();
    }
  }, [vendorId]);

  // Fallback polling (in case Firestore real-time fails)
  const startPollingFallback = () => {
    if (!vendorId) return;
    const interval = setInterval(() => fetchOrders(vendorId), 10000);
    return () => clearInterval(interval);
  };

  const fetchOrders = async (id: string) => {
    try {
      const res = await fetch(`/api/vendor/orders?vendorId=${id}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string, prepTime?: number) => {
    setUpdatingOrder(orderId);
    try {
      const res = await fetch('/api/vendor/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus, prepTime }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        toast.success(newStatus === 'cancelled' ? t('order_cancelled') : t('order_updated'));
        // Play sound for new order acceptance
        if (newStatus === 'accepted') {
          try { new Audio('/sounds/order-accept.mp3').play(); } catch {}
        }
      }
    } catch (err) {
      toast.error('Failed to update order');
    } finally {
      setUpdatingOrder(null);
    }
  };

  const activeOrders = orders.filter(o => ['new', 'accepted', 'preparing', 'ready'].includes(o.status));
  const completedOrders = orders.filter(o => ['delivered', 'picked_up'].includes(o.status));
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');

  const displayOrders = activeTab === 'active' ? activeOrders : activeTab === 'completed' ? completedOrders : cancelledOrders;
  const newOrdersCount = orders.filter(o => o.status === 'new').length;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-red-500 text-white animate-pulse',
      accepted: 'bg-blue-500 text-white',
      preparing: 'bg-amber-500 text-white',
      ready: 'bg-emerald-500 text-white',
      picked_up: 'bg-purple-500 text-white',
      delivered: 'bg-emerald-600 text-white',
      cancelled: 'bg-gray-500 text-white',
    };
    return colors[status] || 'bg-gray-400 text-white';
  };

  const getNextAction = (status: string) => {
    const actions: Record<string, { label: string; next: string; icon: React.ElementType }> = {
      new: { label: t('accept_order'), next: 'accepted', icon: CheckCircle2 },
      accepted: { label: t('start_preparing'), next: 'preparing', icon: ChefHat },
      preparing: { label: t('mark_ready'), next: 'ready', icon: Package },
      ready: { label: t('picked_up'), next: 'picked_up', icon: Truck },
    };
    return actions[status];
  };

  const getTimeAgo = (createdAt: any) => {
    if (!createdAt?.seconds) return '';
    const diff = Math.floor((Date.now() / 1000) - createdAt.seconds);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-16 rounded-2xl skeleton" />
        <div className="h-32 rounded-2xl skeleton" />
        <div className="h-32 rounded-2xl skeleton" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-body flex items-center gap-2">
            <ShoppingBag size={20} className="text-accent" />
            {t('orders_title')}
            {newOrdersCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white animate-bounce">
                {newOrdersCount} {t('new_orders')}
              </span>
            )}
          </h1>
          <p className="text-sm text-faint">{orders.length} {t('total_orders')} • {activeOrders.length} {t('active')}</p>
        </div>
        <button onClick={() => fetchOrders(vendorId)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl glass-sm text-xs font-bold text-muted hover:text-body transition-all">
          <RefreshCw size={13} /> {t('refresh')}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'active', label: `${t('active')} (${activeOrders.length})`, icon: Bell },
          { id: 'completed', label: `${t('completed')} (${completedOrders.length})`, icon: CheckCircle2 },
          { id: 'cancelled', label: `${t('cancelled')} (${cancelledOrders.length})`, icon: XCircle },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'glass-sm text-muted'
            }`}>
            <tab.icon size={13} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {displayOrders.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <ShoppingBag size={32} className="text-faint mx-auto mb-3" />
          <p className="text-sm font-bold text-muted">
            {activeTab === 'active' ? t('no_active_orders') : activeTab === 'completed' ? t('no_completed_orders') : t('no_cancelled_orders')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayOrders.map(order => {
            const nextAction = getNextAction(order.status);
            return (
              <div key={order.id} className={`glass-card rounded-2xl overflow-hidden ${
                order.status === 'new' ? 'ring-2 ring-red-500/50 shadow-lg shadow-red-500/10' : ''
              }`}>
                {/* Order Header */}
                <div className="flex items-center justify-between p-4 border-b border-subtle">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${getStatusColor(order.status)}`}>
                      {order.status === 'new' ? t('new_label') : order.status === 'accepted' ? t('active') : order.status === 'preparing' ? t('preparing_label') : order.status === 'ready' ? t('ready_status') : order.status === 'picked_up' ? t('picked_up') : order.status === 'delivered' ? t('completed_label') : t('cancelled_label')}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-body">{order.orderId}</p>
                      <p className="text-[10px] text-faint">{getTimeAgo(order.createdAt)}</p>
                    </div>
                  </div>
                  <p className="text-base font-black text-accent">₹{order.totalAmount}</p>
                </div>

                {/* Order Items */}
                <div className="p-4 space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <p className="text-xs text-body">
                        <span className="font-bold">{item.quantity}x</span> {item.name}
                      </p>
                      <p className="text-xs text-muted">₹{item.price * item.quantity}</p>
                    </div>
                  ))}
                </div>

                {/* Customer Info */}
                <div className="px-4 pb-3 flex items-center gap-4 text-[10px] text-faint">
                  <span className="flex items-center gap-1"><Phone size={10} /> {order.customerName}</span>
                  <span className="flex items-center gap-1"><MapPin size={10} /> {order.deliveryAddress}</span>
                  <span className="flex items-center gap-1"><IndianRupee size={10} /> {order.paymentMethod.toUpperCase()}</span>
                </div>

                {/* Prep Timer for accepted/preparing orders */}
                {['accepted', 'preparing'].includes(order.status) && order.acceptedAt && order.estimatedPrepTime && (
                  <div className="px-4 pb-3">
                    <PrepTimer
                      acceptedAt={order.acceptedAt}
                      estimatedPrepTime={order.estimatedPrepTime}
                      onMarkReady={() => updateStatus(order.id, 'ready')}
                      onExtendTime={async () => {
                        setUpdatingOrder(order.id);
                        try {
                          await fetch('/api/vendor/orders', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ orderId: order.id, status: order.status, prepTime: (order.estimatedPrepTime || 15) + 5 }),
                          });
                          setOrders(prev => prev.map(o => o.id === order.id ? { ...o, estimatedPrepTime: (o.estimatedPrepTime || 15) + 5 } : o));
                          toast.success(t('add_5_min'));
                        } catch { toast.error('Failed'); }
                        finally { setUpdatingOrder(null); }
                      }}
                      isUpdating={updatingOrder === order.id}
                    />
                  </div>
                )}

                {/* Actions */}
                {order.status === 'new' && showPrepPicker === order.id ? (
                  <PrepTimePicker
                    onAccept={(prepTime) => {
                      updateStatus(order.id, 'accepted', prepTime);
                      setShowPrepPicker(null);
                    }}
                    onCancel={() => setShowPrepPicker(null)}
                    isUpdating={updatingOrder === order.id}
                  />
                ) : order.status === 'new' ? (
                  <div className="p-3 border-t border-subtle flex gap-2">
                    <button
                      onClick={() => setShowPrepPicker(order.id)}
                      disabled={updatingOrder === order.id}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-all disabled:opacity-50 active:scale-95"
                    >
                      <CheckCircle2 size={14} />
                      {t('accept_order')}
                    </button>
                    <button
                      onClick={() => updateStatus(order.id, 'cancelled')}
                      disabled={updatingOrder === order.id}
                      className="px-4 py-3 rounded-xl bg-red-500/10 text-red-500 text-xs font-bold hover:bg-red-500/20 transition-all"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                ) : order.status === 'ready' ? (
                  <div className="p-3 border-t border-subtle">
                    <button
                      onClick={() => updateStatus(order.id, 'picked_up')}
                      disabled={updatingOrder === order.id}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-500 text-white text-xs font-bold hover:bg-purple-600 transition-all disabled:opacity-50 active:scale-95"
                    >
                      <Truck size={14} />
                      {updatingOrder === order.id ? t('loading') : t('picked_up')}
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {/* Auto-refresh indicator */}
      <div className="text-center">
        <p className="text-[10px] text-faint flex items-center justify-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {t('auto_refreshing')}
        </p>
      </div>
    </div>
  );
}
