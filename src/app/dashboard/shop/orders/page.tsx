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
import {
  listenShopOrders, listenNewOrders, listenActiveOrders,
  acceptOrder, markPreparing, markReady, rejectOrder,
} from '@/lib/noxOrderService';
import type { NoxOrder } from '@/types/noxOrder';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ORDERS PAGE — Real-time vendor order management (NOX System)
// Uses noxOrderService for all operations
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
  total?: number;
  deliveryAddress: string;
  status: string;
  paymentMethod: string;
  createdAt?: any;
  acceptedAt?: any;
  estimatedPrepTime?: number;
  estimatedDelivery?: string;
  deliveryOTP?: string;
  itemCount?: number;
}

// Map NOX status to vendor display status
function normalizeStatus(status: string): string {
  // NOX uses 'placed', old system uses 'new'
  if (status === 'placed') return 'new';
  if (status === 'rider_assigned' || status === 'picked_up' || status === 'in_transit') return 'picked_up';
  return status;
}

const STATUS_FLOW = ['new', 'placed', 'accepted', 'preparing', 'ready', 'picked_up', 'delivered'];

export default function OrdersPage() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendorId, setVendorId] = useState('');
  const [shopName, setShopName] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [showPrepPicker, setShowPrepPicker] = useState<string | null>(null);

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
            const approvedDoc = snap.docs.find((d: any) => d.data().status === 'approved');
            const correctDoc = approvedDoc || snap.docs[0];
            const correctId = correctDoc.id;
            const correctData = correctDoc.data();
            
            const updatedProfile = { ...profile, id: correctId, shopName: correctData.shopName, shopId: correctData.shopId || correctId };
            localStorage.setItem('noe-vendor-profile', JSON.stringify(updatedProfile));
            
            setVendorId(correctId);
            setShopName(correctData.shopName || profile.shopName || '');
          }
        }).catch(() => {
          setVendorId(profile.id);
          setShopName(profile.shopName || '');
        });
      } else {
        setVendorId(profile.id);
        setShopName(profile.shopName || '');
      }
    }
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Real-time Firestore listener using NOX Order Service
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    if (!vendorId || !db) return;

    // Listen to ALL orders for this shop (queries by shopId + shopName + vendorId)
    const unsubscribe = listenShopOrders(vendorId, (noxOrders: NoxOrder[]) => {
      // Convert NoxOrder[] to local Order format for display (shopName passed as 3rd arg below)
      const mappedOrders: Order[] = noxOrders.map(o => ({
        id: o.orderId,
        orderId: o.orderId,
        customerName: o.customerName || 'Customer',
        customerPhone: o.customerPhone || '',
        items: o.items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
        totalAmount: o.total,
        total: o.total,
        deliveryAddress: o.deliveryAddress || '',
        status: normalizeStatus(o.status),
        paymentMethod: o.paymentMethod || 'COD',
        createdAt: o.createdAt,
        acceptedAt: o.acceptedAt,
        estimatedPrepTime: o.estimatedDelivery ? parseInt(o.estimatedDelivery) || 20 : undefined,
        estimatedDelivery: o.estimatedDelivery,
        deliveryOTP: o.deliveryOTP,
        itemCount: o.itemCount,
      }));

      // Detect new orders (play sound)
      const newCount = mappedOrders.filter(o => o.status === 'new').length;
      if (newCount > prevOrderCountRef.current && prevOrderCountRef.current > 0) {
        try { new Audio('/sounds/order-alert.mp3').play(); } catch {}
        toast('🔔 New order received!', {
          icon: '🛎️',
          duration: 5000,
          style: { background: '#0E9F6E', color: '#fff', fontWeight: 'bold' },
        });
      }
      prevOrderCountRef.current = newCount;

      setOrders(mappedOrders);
      setLoading(false);
    }, shopName || undefined);

    // Also listen to old-format orders (backward compatibility)
    let unsubOld: (() => void) | undefined;
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('vendorId', '==', vendorId));
      unsubOld = onSnapshot(q, (snapshot) => {
        const oldOrders: Order[] = snapshot.docs
          .filter(doc => !doc.data().orderId?.startsWith('NOX-')) // Skip NOX orders (already handled)
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            status: normalizeStatus(doc.data().status),
          })) as Order[];
        
        if (oldOrders.length > 0) {
          setOrders(prev => {
            const noxIds = new Set(prev.map(o => o.id));
            const newOnes = oldOrders.filter(o => !noxIds.has(o.id));
            return newOnes.length > 0 ? [...prev, ...newOnes] : prev;
          });
        }
      });
    } catch (err) {
      console.warn('Old order listener setup failed:', err);
    }

    return () => {
      unsubscribe();
      if (unsubOld) unsubOld();
    };
  }, [vendorId, shopName]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // UPDATE STATUS — Uses NOX Order Service
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const updateStatus = async (orderId: string, newStatus: string, prepTime?: number) => {
    setUpdatingOrder(orderId);
    try {
      let success = false;

      if (orderId.startsWith('NOX-')) {
        // Use NOX Order Service
        switch (newStatus) {
          case 'accepted':
            success = await acceptOrder(orderId, vendorId, prepTime);
            break;
          case 'preparing':
            success = await markPreparing(orderId, vendorId);
            break;
          case 'ready':
            success = await markReady(orderId, vendorId);
            break;
          case 'cancelled':
            success = await rejectOrder(orderId, vendorId, 'Rejected by vendor');
            break;
          default:
            // Fallback to API for other statuses
            const res = await fetch('/api/vendor/orders', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId, status: newStatus, prepTime }),
            });
            const data = await res.json();
            success = data.success;
        }
      } else {
        // Old system — use API
        const res = await fetch('/api/vendor/orders', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, status: newStatus, prepTime }),
        });
        const data = await res.json();
        success = data.success;
      }

      if (success) {
        // Optimistic update (real-time listener will also update)
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        toast.success(newStatus === 'cancelled' ? t('order_cancelled') : t('order_updated'));
        if (newStatus === 'accepted') {
          try { new Audio('/sounds/order-accept.mp3').play(); } catch {}
        }
      } else {
        toast.error('Failed to update order');
      }
    } catch (err) {
      toast.error('Failed to update order');
    } finally {
      setUpdatingOrder(null);
    }
  };

  const activeOrders = orders.filter(o => ['new', 'placed', 'accepted', 'preparing', 'ready'].includes(o.status));
  const completedOrders = orders.filter(o => ['delivered', 'picked_up'].includes(o.status));
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');

  const displayOrders = activeTab === 'active' ? activeOrders : activeTab === 'completed' ? completedOrders : cancelledOrders;
  const newOrdersCount = orders.filter(o => o.status === 'new').length;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-red-500 text-white animate-pulse',
      placed: 'bg-red-500 text-white animate-pulse',
      accepted: 'bg-blue-500 text-white',
      preparing: 'bg-[#0E9F6E] text-white',
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
      placed: { label: t('accept_order'), next: 'accepted', icon: CheckCircle2 },
      accepted: { label: t('start_preparing'), next: 'preparing', icon: ChefHat },
      preparing: { label: t('mark_ready'), next: 'ready', icon: Package },
    };
    return actions[status];
  };

  const getTimeAgo = (createdAt: any) => {
    if (!createdAt) return '';
    // Handle Firestore Timestamp
    if (createdAt?.seconds) {
      const diff = Math.floor((Date.now() / 1000) - createdAt.seconds);
      if (diff < 60) return `${diff}s ago`;
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      return `${Math.floor(diff / 3600)}h ago`;
    }
    // Handle ISO string
    if (typeof createdAt === 'string') {
      const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
      if (diff < 60) return `${diff}s ago`;
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      return `${Math.floor(diff / 3600)}h ago`;
    }
    return '';
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
              activeTab === tab.id ? 'bg-[#0E9F6E] text-white shadow-lg shadow-[#0E9F6E]/20' : 'glass-sm text-muted'
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
                  <p className="text-base font-black text-accent">₹{order.totalAmount || order.total}</p>
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
                  {order.deliveryAddress && (
                    <span className="flex items-center gap-1 truncate max-w-[150px]"><MapPin size={10} /> {order.deliveryAddress}</span>
                  )}
                  <span className="flex items-center gap-1"><IndianRupee size={10} /> {order.paymentMethod}</span>
                </div>

                {/* Delivery OTP Display (for ready orders) */}
                {order.status === 'ready' && order.deliveryOTP && (
                  <div className="px-4 pb-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-2">
                      <Truck size={14} className="text-purple-500" />
                      <span className="text-xs text-muted">Delivery OTP:</span>
                      <span className="text-sm font-black text-purple-600 tracking-widest">{order.deliveryOTP}</span>
                    </div>
                  </div>
                )}

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
                {(order.status === 'new' || order.status === 'placed') && showPrepPicker === order.id ? (
                  <PrepTimePicker
                    onAccept={(prepTime) => {
                      updateStatus(order.id, 'accepted', prepTime);
                      setShowPrepPicker(null);
                    }}
                    onCancel={() => setShowPrepPicker(null)}
                    isUpdating={updatingOrder === order.id}
                  />
                ) : (order.status === 'new' || order.status === 'placed') ? (
                  <div className="p-3 border-t border-subtle flex gap-2">
                    <button
                      onClick={() => setShowPrepPicker(order.id)}
                      disabled={updatingOrder === order.id}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0E9F6E] text-white text-xs font-bold hover:bg-[#087f58] transition-all disabled:opacity-50 active:scale-95"
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
                ) : order.status === 'accepted' ? (
                  <div className="p-3 border-t border-subtle">
                    <button
                      onClick={() => updateStatus(order.id, 'preparing')}
                      disabled={updatingOrder === order.id}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 transition-all disabled:opacity-50 active:scale-95"
                    >
                      <ChefHat size={14} />
                      {updatingOrder === order.id ? t('loading') : t('start_preparing')}
                    </button>
                  </div>
                ) : order.status === 'preparing' ? (
                  <div className="p-3 border-t border-subtle">
                    <button
                      onClick={() => updateStatus(order.id, 'ready')}
                      disabled={updatingOrder === order.id}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-all disabled:opacity-50 active:scale-95"
                    >
                      <Package size={14} />
                      {updatingOrder === order.id ? t('loading') : t('mark_ready')}
                    </button>
                  </div>
                ) : order.status === 'ready' ? (
                  <div className="p-3 border-t border-subtle">
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-500/10 text-purple-600">
                      <Truck size={14} />
                      <span className="text-xs font-bold">Waiting for rider to pick up...</span>
                    </div>
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
          {t('auto_refreshing')} • NOX Real-time
        </p>
      </div>
    </div>
  );
}
