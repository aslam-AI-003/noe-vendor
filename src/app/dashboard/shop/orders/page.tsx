'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore, DemoOrder } from '@/store/useStore';
import { orderService } from '@/lib/firestoreService';
import toast from 'react-hot-toast';
import {
  Bell, CheckCircle2, ChefHat, Package, Bike, XCircle, Clock,
  UserRound, StickyNote, Phone, MapPin, Search, Filter,
  Timer, IndianRupee, ShoppingBag, Inbox,
} from 'lucide-react';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔊 NEW ORDER NOTIFICATION SOUND — Pleasant chime (LOUDER)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function playNewOrderSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // First tone (C5 - 523Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.value = 523.25; // C5
    gain1.gain.setValueAtTime(0.8, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.4);

    // Second tone (E5 - 659Hz) — slightly delayed
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = 659.25; // E5
    gain2.gain.setValueAtTime(0.8, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.55);

    // Third tone (G5 - 784Hz) — final ding
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.value = 783.99; // G5
    gain3.gain.setValueAtTime(0.7, ctx.currentTime + 0.3);
    gain3.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.9);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(ctx.currentTime + 0.3);
    osc3.stop(ctx.currentTime + 0.9);

    // Cleanup
    setTimeout(() => ctx.close(), 1200);
  } catch (e) {
    console.debug('Audio playback failed:', e);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VENDOR ORDER MANAGEMENT — Full Order Lifecycle
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type TabType = 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled';

const TABS: { id: TabType; label: string; icon: React.ElementType; statuses: string[] }[] = [
  { id: 'new', label: 'New', icon: Bell, statuses: ['placed'] },
  { id: 'preparing', label: 'Preparing', icon: ChefHat, statuses: ['confirmed', 'preparing'] },
  { id: 'ready', label: 'Ready', icon: Package, statuses: ['ready', 'picked_up', 'on_the_way'] },
  { id: 'completed', label: 'Completed', icon: CheckCircle2, statuses: ['delivered'] },
  { id: 'cancelled', label: 'Cancelled', icon: XCircle, statuses: ['cancelled'] },
];

const STATUS_FLOW: Record<string, { next: DemoOrder['status']; label: string; color: string; icon: React.ElementType }> = {
  placed: { next: 'confirmed', label: 'Accept Order', color: 'bg-emerald-500 shadow-emerald-500/25', icon: CheckCircle2 },
  confirmed: { next: 'preparing', label: 'Start Preparing', color: 'bg-blue-500 shadow-blue-500/25', icon: ChefHat },
  preparing: { next: 'ready', label: 'Mark Ready', color: 'bg-orange-500 shadow-orange-500/25', icon: Package },
};

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  placed: { label: 'New Order', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25' },
  confirmed: { label: 'Confirmed', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25' },
  preparing: { label: 'Preparing', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25' },
  ready: { label: 'Ready', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25' },
  picked_up: { label: 'Picked Up', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25' },
  on_the_way: { label: 'On the Way', color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/25' },
  delivered: { label: 'Delivered', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25' },
};

export default function OrderManagementPage() {
  const { demoOrders, updateDemoOrderStatus, user, riderRegistrations } = useStore();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('new');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const ringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevNewCountRef = useRef<number>(0);

  useEffect(() => {
    setMounted(true);
    // Subscribe to real-time Firestore orders for this vendor
    if (user?.role === 'vendor' && user.uid) {
      const unsub = orderService.onShopOrders(user.uid, (firestoreOrders) => {
        if (firestoreOrders.length > 0) {
          console.log('🔄 Firestore shop orders synced:', firestoreOrders.length);
        }
      });
      return () => unsub();
    }
  }, [user?.uid, user?.role]);

  // Filter orders for THIS vendor only (if logged in as vendor)
  const vendorShopId = user?.role === 'vendor' ? user.uid : null;
  const myOrders = vendorShopId
    ? demoOrders.filter(o => o.shopId === vendorShopId)
    : demoOrders; // Admin/fallback sees all

  // ━━━━━ 🔊 NEW ORDER ALERT — rings continuously until accepted ━━━━━
  const newOrderCount = myOrders.filter(o => o.status === 'placed').length;

  useEffect(() => {
    // If there are new unaccepted orders, ring continuously
    if (newOrderCount > 0) {
      // Play immediately when a new order arrives
      if (newOrderCount > prevNewCountRef.current) {
        playNewOrderSound();
        toast('🛵 New Order Received!', {
          icon: '🔔',
          style: { fontWeight: 'bold', background: '#1e293b', color: '#fff', border: '1px solid #f97316' },
          duration: 4000,
        });
      }
      // Ring every 3 seconds until order is accepted/rejected
      if (!ringIntervalRef.current) {
        ringIntervalRef.current = setInterval(() => {
          playNewOrderSound();
        }, 3000);
      }
    } else {
      // No new orders — stop ringing
      if (ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
    }
    prevNewCountRef.current = newOrderCount;

    return () => {
      if (ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
    };
  }, [newOrderCount]);

  if (!mounted) return <div className="space-y-4 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-32 rounded-2xl skeleton" />)}</div>;

  // Filter orders (use myOrders — vendor-specific)
  const currentTab = TABS.find(t => t.id === activeTab)!;
  let filteredOrders = myOrders.filter(o => currentTab.statuses.includes(o.status));

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredOrders = filteredOrders.filter(o =>
      o.id.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.includes(q)
    );
  }

  // Tab counts (vendor-specific)
  const tabCounts: Record<TabType, number> = {
    new: myOrders.filter(o => ['placed'].includes(o.status)).length,
    preparing: myOrders.filter(o => ['confirmed', 'preparing'].includes(o.status)).length,
    ready: myOrders.filter(o => ['ready', 'picked_up', 'on_the_way'].includes(o.status)).length,
    completed: myOrders.filter(o => o.status === 'delivered').length,
    cancelled: myOrders.filter(o => o.status === 'cancelled').length,
  };

  const handleStatusChange = async (orderId: string, newStatus: DemoOrder['status']) => {
    if (newStatus === 'ready') {
      // Auto-assign an available online rider
      const onlineRiders = riderRegistrations.filter(r => r.status === 'approved' && r.isOnline);
      let assignedRider = onlineRiders[0]; // Simple round-robin (first available)

      if (assignedRider) {
        updateDemoOrderStatus(orderId, newStatus, {
          riderId: assignedRider.riderId || assignedRider.id,
          riderName: assignedRider.name,
        });
        // Sync to Firestore
        orderService.updateStatus(orderId, newStatus, {
          riderId: assignedRider.riderId || assignedRider.id,
          riderName: assignedRider.name,
        }).catch(() => {});
        toast.success(`Order ready! Rider assigned: ${assignedRider.name} 🚴`);
      } else {
        updateDemoOrderStatus(orderId, newStatus, {
          riderId: 'rider-001',
          riderName: 'Murugan K (Auto)',
        });
        orderService.updateStatus(orderId, newStatus, {
          riderId: 'rider-001',
          riderName: 'Murugan K (Auto)',
        }).catch(() => {});
        toast.success('Order ready! No online riders — assigned to Murugan K');
      }
    } else {
      updateDemoOrderStatus(orderId, newStatus);
      // Sync to Firestore
      orderService.updateStatus(orderId, newStatus).catch(() => {});
      const badge = STATUS_BADGE[newStatus];
      toast.success(`Order → ${badge?.label || newStatus}`);
    }
  };

  const handleReject = (orderId: string) => {
    updateDemoOrderStatus(orderId, 'cancelled');
    orderService.updateStatus(orderId, 'cancelled').catch(() => {});
    toast.error('Order rejected');
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">

      {/* ── Header with search ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-body">Order Management</h1>
          <p className="text-sm text-faint">{myOrders.length} total orders</p>
        </div>
        <div className="relative max-w-xs w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by ID, name, phone..."
            className="input-glass pl-9 text-xs py-2.5 w-full"
          />
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'glass-sm text-muted hover:text-secondary'
            }`}
          >
            <tab.icon size={13} />
            {tab.label}
            {tabCounts[tab.id] > 0 && (
              <span className={`ml-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-orange-500/10 text-accent'
              }`}>
                {tabCounts[tab.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Orders List ── */}
      {filteredOrders.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-orange-500/6 rounded-full flex items-center justify-center mx-auto mb-4">
            <Inbox size={28} className="text-faint" />
          </div>
          <h3 className="text-base font-bold text-muted">No {currentTab.label.toLowerCase()} orders</h3>
          <p className="text-xs text-faint mt-1">
            {activeTab === 'new' ? 'New orders will appear here automatically' : 'Orders in this category will show up here'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const badge = STATUS_BADGE[order.status];
            const flow = STATUS_FLOW[order.status];
            const isExpanded = expandedOrder === order.id;

            return (
              <div
                key={order.id}
                className={`glass-card rounded-2xl overflow-hidden transition-all duration-300 ${
                  order.status === 'placed' ? 'border-l-4 border-l-blue-500' :
                  order.status === 'preparing' ? 'border-l-4 border-l-orange-500' :
                  order.status === 'ready' ? 'border-l-4 border-l-amber-500' : ''
                }`}
              >
                {/* Order Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-[var(--card-hover)] transition-colors"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  <div className="flex items-center gap-3">
                    {/* Order Avatar */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      order.status === 'placed' ? 'bg-blue-500/10' :
                      order.status === 'preparing' ? 'bg-orange-500/10' :
                      order.status === 'ready' ? 'bg-amber-500/10' :
                      order.status === 'delivered' ? 'bg-emerald-500/10' :
                      'bg-red-500/10'
                    }`}>
                      <ShoppingBag size={18} className={
                        order.status === 'placed' ? 'text-blue-600 dark:text-blue-400' :
                        order.status === 'preparing' ? 'text-orange-600 dark:text-orange-400' :
                        order.status === 'ready' ? 'text-amber-600 dark:text-amber-400' :
                        order.status === 'delivered' ? 'text-emerald-600 dark:text-emerald-400' :
                        'text-red-600 dark:text-red-400'
                      } />
                    </div>

                    {/* Order Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-black text-body">#{order.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${badge?.color || ''}`}>
                          {badge?.label || order.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted truncate">{order.customerName} • {order.items.length} items</p>
                    </div>

                    {/* Price & Time */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-black text-accent">₹{order.total}</p>
                      <p className="text-[10px] text-faint flex items-center gap-0.5 justify-end">
                        <Clock size={9} /> {timeAgo(order.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 animate-slide-down border-t border-subtle pt-3">
                    {/* Customer Info */}
                    <div className="flex items-center gap-3 p-3 surface rounded-xl">
                      <div className="w-9 h-9 bg-orange-500/10 rounded-full flex items-center justify-center">
                        <UserRound size={16} className="text-accent" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-body">{order.customerName}</p>
                        <p className="text-[10px] text-faint flex items-center gap-1">
                          <Phone size={9} /> {order.customerPhone}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-faint uppercase font-bold">{order.paymentMethod}</p>
                      </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="flex items-start gap-2 p-2.5 surface rounded-lg">
                      <MapPin size={13} className="text-faint mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[11px] text-secondary font-medium">{order.address.label}</p>
                        <p className="text-[10px] text-faint">{order.address.fullAddress}</p>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-faint font-bold uppercase">Items ({order.items.length})</p>
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5 border-b border-subtle last:border-0">
                          <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-sm border-2 flex-shrink-0 ${
                              item.isVeg ? 'border-emerald-500' : 'border-red-500'
                            }`}>
                              <span className={`block w-1.5 h-1.5 rounded-full m-[1px] ${
                                item.isVeg ? 'bg-emerald-500' : 'bg-red-500'
                              }`} />
                            </span>
                            <span className="text-xs text-secondary">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-faint">×{item.quantity}</span>
                            <span className="text-xs font-bold text-body">₹{(item.discountPrice || item.price) * item.quantity}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bill */}
                    <div className="surface rounded-xl p-3 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted">Subtotal</span>
                        <span className="text-body font-bold">₹{order.subtotal}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted">Delivery</span>
                        <span className="text-body">₹{order.deliveryCharge}</span>
                      </div>
                      <div className="divider my-1" />
                      <div className="flex justify-between text-sm">
                        <span className="font-bold text-body">Total</span>
                        <span className="font-black text-accent">₹{order.total}</span>
                      </div>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                      <div className="flex items-start gap-2 p-2.5 bg-orange-500/5 border border-orange-500/15 rounded-lg">
                        <StickyNote size={12} className="text-accent mt-0.5 flex-shrink-0" />
                        <p className="text-[11px] text-accent">{order.notes}</p>
                      </div>
                    )}

                    {/* Rider info */}
                    {order.riderName && (
                      <div className="flex items-center gap-2 p-2.5 bg-purple-500/5 border border-purple-500/15 rounded-lg">
                        <Bike size={14} className="text-purple-600 dark:text-purple-400" />
                        <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                          Rider: {order.riderName}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {flow && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleStatusChange(order.id, flow.next)}
                          className={`flex-1 flex items-center justify-center gap-2 ${flow.color} text-white text-xs font-bold py-3 rounded-xl shadow-lg active:scale-[0.97] transition-all`}
                        >
                          <flow.icon size={14} />
                          {flow.label}
                        </button>
                        {order.status === 'placed' && (
                          <button
                            onClick={() => handleReject(order.id)}
                            className="px-5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold py-3 rounded-xl active:scale-95 transition-all"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
