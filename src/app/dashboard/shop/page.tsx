'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore, DemoOrder } from '@/store/useStore';
import toast from 'react-hot-toast';
import {
  Package, TrendingUp, Clock, CheckCircle2, XCircle, IndianRupee,
  ShoppingBag, ChefHat, Bike, Bell, Eye, ArrowUpRight, ArrowDownRight,
  Zap, Timer, Star, Users, ToggleLeft, ToggleRight,
} from 'lucide-react';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VENDOR DASHBOARD HOME — Premium Swiggy/Zepto style
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function ShopDashboardHome() {
  const { demoOrders, updateDemoOrderStatus } = useStore();
  const [mounted, setMounted] = useState(false);
  const [shopOnline, setShopOnline] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted) return <DashboardSkeleton />;

  // ── Stats Calculations ──
  const allOrders = demoOrders;
  const todayOrders = allOrders.filter(o => {
    const orderDate = new Date(o.createdAt);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });

  const stats = {
    totalOrders: todayOrders.length,
    newOrders: todayOrders.filter(o => o.status === 'placed').length,
    preparing: todayOrders.filter(o => ['confirmed', 'preparing'].includes(o.status)).length,
    completed: todayOrders.filter(o => o.status === 'delivered').length,
    cancelled: todayOrders.filter(o => o.status === 'cancelled').length,
    revenue: todayOrders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total, 0),
    avgPrepTime: 18, // minutes (demo)
    rating: 4.6,
    activeOrders: todayOrders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length,
  };

  const recentOrders = allOrders.slice(0, 5);
  const newOrdersList = allOrders.filter(o => o.status === 'placed');

  const handleAcceptOrder = (orderId: string) => {
    updateDemoOrderStatus(orderId, 'confirmed');
    toast.success('Order accepted! Start preparing.');
  };

  const handleRejectOrder = (orderId: string) => {
    updateDemoOrderStatus(orderId, 'cancelled');
    toast.error('Order rejected');
  };

  const toggleShopStatus = () => {
    setShopOnline(!shopOnline);
    toast.success(shopOnline ? 'Shop is now Offline' : 'Shop is now Online!');
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  const greeting = () => {
    const h = currentTime.getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">

      {/* ── Hero Banner: Shop Status ── */}
      <div className="relative overflow-hidden rounded-2xl p-5 lg:p-6"
        style={{
          background: shopOnline
            ? 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(249,115,22,0.06) 100%)'
            : 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(161,161,170,0.06) 100%)',
          border: `1px solid ${shopOnline ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
        }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-faint font-medium">{greeting()} 👋</p>
            <h1 className="text-xl lg:text-2xl font-black text-body mt-1">Dashboard Overview</h1>
            <p className="text-sm text-muted mt-0.5">
              {currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={toggleShopStatus}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-300 shadow-lg active:scale-95 ${
              shopOnline
                ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                : 'bg-red-500 text-white shadow-red-500/30'
            }`}>
            {shopOnline ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
            <span>{shopOnline ? 'Shop Online' : 'Shop Offline'}</span>
          </button>
        </div>
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-[0.03]"
          style={{ background: shopOnline ? '#10B981' : '#EF4444' }} />
        <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full opacity-[0.04]"
          style={{ background: '#F97316' }} />
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          icon={ShoppingBag} label="Today's Orders" value={stats.totalOrders}
          trend={stats.totalOrders > 0 ? '+12%' : undefined} trendUp color="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-500/8"
        />
        <StatCard
          icon={IndianRupee} label="Revenue" value={`₹${stats.revenue.toLocaleString()}`}
          trend={stats.revenue > 0 ? '+8%' : undefined} trendUp color="text-emerald-600 dark:text-emerald-400"
          bgColor="bg-emerald-500/8"
        />
        <StatCard
          icon={Timer} label="Avg Prep Time" value={`${stats.avgPrepTime}m`}
          trend="-2m" trendUp color="text-orange-600 dark:text-orange-400"
          bgColor="bg-orange-500/8"
        />
        <StatCard
          icon={Star} label="Rating" value={stats.rating.toString()}
          trend="+0.1" trendUp color="text-amber-600 dark:text-amber-400"
          bgColor="bg-amber-500/8"
        />
      </div>

      {/* ── Live Order Status Strip ── */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'New', count: stats.newOrders, color: 'bg-blue-500', pulse: stats.newOrders > 0 },
          { label: 'Preparing', count: stats.preparing, color: 'bg-orange-500', pulse: false },
          { label: 'Completed', count: stats.completed, color: 'bg-emerald-500', pulse: false },
          { label: 'Cancelled', count: stats.cancelled, color: 'bg-red-500', pulse: false },
        ].map((item) => (
          <div key={item.label} className="glass-sm p-3 text-center rounded-xl relative overflow-hidden">
            <div className={`w-2 h-2 rounded-full mx-auto mb-1.5 ${item.color} ${item.pulse ? 'animate-pulse' : ''}`} />
            <p className="text-lg lg:text-xl font-black text-body">{item.count}</p>
            <p className="text-[10px] text-faint font-medium">{item.label}</p>
          </div>
        ))}
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid lg:grid-cols-5 gap-4 lg:gap-5">

        {/* New Orders Alert (Left - 3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* New Orders Section */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-subtle flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <Bell size={15} className="text-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-body">New Orders</h3>
                  <p className="text-[10px] text-faint">{stats.newOrders} pending acceptance</p>
                </div>
              </div>
              <Link href="/dashboard/shop/orders" className="text-xs text-accent font-bold hover:opacity-80">
                View All →
              </Link>
            </div>

            {newOrdersList.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-orange-500/6 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package size={24} className="text-faint" />
                </div>
                <p className="text-sm font-bold text-muted">No new orders</p>
                <p className="text-xs text-faint mt-1">New orders will appear here in real-time</p>
              </div>
            ) : (
              <div className="divide-y divide-subtle">
                {newOrdersList.slice(0, 3).map((order) => (
                  <NewOrderCard
                    key={order.id}
                    order={order}
                    onAccept={() => handleAcceptOrder(order.id)}
                    onReject={() => handleRejectOrder(order.id)}
                    timeAgo={timeAgo(order.createdAt)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-subtle flex items-center justify-between">
              <h3 className="text-sm font-black text-body flex items-center gap-2">
                <Clock size={14} className="text-muted" />
                Recent Activity
              </h3>
              <Link href="/dashboard/shop/orders" className="text-xs text-accent font-bold hover:opacity-80">
                All Orders →
              </Link>
            </div>
            {recentOrders.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-xs text-faint">No recent activity</p>
              </div>
            ) : (
              <div className="divide-y divide-subtle">
                {recentOrders.map((order) => (
                  <div key={order.id} className="px-4 py-3 flex items-center gap-3 hover:bg-[var(--card-hover)] transition-colors">
                    <OrderStatusDot status={order.status} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-body">#{order.id}</p>
                      <p className="text-[10px] text-faint truncate">{order.customerName} • {order.items.length} items</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-body">₹{order.total}</p>
                      <p className="text-[10px] text-faint">{timeAgo(order.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel (2 cols) */}
        <div className="lg:col-span-2 space-y-4">

          {/* Quick Actions */}
          <div className="glass-card rounded-2xl p-4">
            <h3 className="text-sm font-black text-body mb-3 flex items-center gap-2">
              <Zap size={14} className="text-accent" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: '/dashboard/shop/orders', icon: ShoppingBag, label: 'Manage Orders', color: 'bg-blue-500/8 text-blue-600 dark:text-blue-400' },
                { href: '/dashboard/shop/menu', icon: ChefHat, label: 'Edit Menu', color: 'bg-orange-500/8 text-orange-600 dark:text-orange-400' },
                { href: '/dashboard/shop/analytics', icon: TrendingUp, label: 'View Reports', color: 'bg-emerald-500/8 text-emerald-600 dark:text-emerald-400' },
                { href: '/dashboard/shop/settings', icon: Users, label: 'Shop Settings', color: 'bg-purple-500/8 text-purple-600 dark:text-purple-400' },
              ].map(action => (
                <Link key={action.href} href={action.href}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl surface surface-hover transition-all group">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>
                    <action.icon size={18} />
                  </div>
                  <span className="text-[10px] font-bold text-muted group-hover:text-body text-center">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Today's Performance */}
          <div className="glass-card rounded-2xl p-4">
            <h3 className="text-sm font-black text-body mb-3">Today&apos;s Performance</h3>
            <div className="space-y-3">
              <PerformanceRow label="Acceptance Rate" value="95%" good />
              <PerformanceRow label="Avg Preparation" value="18 min" good />
              <PerformanceRow label="Order Completion" value="92%" good />
              <PerformanceRow label="Customer Rating" value="4.6 ★" good />
            </div>
          </div>

          {/* Top Selling Items */}
          <div className="glass-card rounded-2xl p-4">
            <h3 className="text-sm font-black text-body mb-3 flex items-center gap-2">
              <TrendingUp size={14} className="text-accent" />
              Top Selling Today
            </h3>
            <div className="space-y-2.5">
              {[
                { name: 'Chicken Biryani', qty: 24, revenue: '₹4,560' },
                { name: 'Masala Dosa', qty: 18, revenue: '₹1,440' },
                { name: 'Filter Coffee', qty: 32, revenue: '₹960' },
                { name: 'Meals Thali', qty: 12, revenue: '₹1,800' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--card-hover)] transition-colors">
                  <span className="w-6 h-6 rounded-lg bg-orange-500/10 flex items-center justify-center text-[10px] font-black text-accent">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-body truncate">{item.name}</p>
                    <p className="text-[10px] text-faint">{item.qty} orders</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{item.revenue}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hourly Chart (simplified) */}
          <div className="glass-card rounded-2xl p-4">
            <h3 className="text-sm font-black text-body mb-3">Orders by Hour</h3>
            <div className="flex items-end gap-1 h-20">
              {[2, 5, 8, 15, 22, 18, 25, 20, 12, 8, 4, 2].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-orange-500/60 to-orange-400/80 transition-all duration-500"
                    style={{ height: `${(val / 25) * 100}%`, minHeight: '4px' }}
                  />
                  <span className="text-[8px] text-faint">{8 + i}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-faint text-center mt-2">Peak hours: 12 PM - 2 PM</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Sub-components
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function StatCard({ icon: Icon, label, value, trend, trendUp, color, bgColor }: {
  icon: React.ElementType; label: string; value: string | number;
  trend?: string; trendUp?: boolean; color: string; bgColor: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-4 hover:shadow-md transition-all duration-300 group">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgColor} group-hover:scale-110 transition-transform`}>
          <Icon size={18} className={color} />
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-[10px] font-bold ${trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
            {trendUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {trend}
          </span>
        )}
      </div>
      <p className="text-xl lg:text-2xl font-black text-body">{value}</p>
      <p className="text-[10px] text-faint font-medium mt-0.5">{label}</p>
    </div>
  );
}

function NewOrderCard({ order, onAccept, onReject, timeAgo }: {
  order: DemoOrder; onAccept: () => void; onReject: () => void; timeAgo: string;
}) {
  return (
    <div className="p-4 bg-orange-500/[0.02] hover:bg-orange-500/[0.04] transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <ShoppingBag size={16} className="text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-sm font-black text-body">#{order.id}</p>
            <span className="text-[10px] text-faint">{timeAgo}</span>
          </div>
          <p className="text-xs text-muted">{order.customerName} • {order.customerPhone}</p>
          <div className="mt-2 space-y-0.5">
            {order.items.slice(0, 3).map((item, i) => (
              <p key={i} className="text-[11px] text-secondary">
                {item.name} × {item.quantity}
              </p>
            ))}
            {order.items.length > 3 && (
              <p className="text-[10px] text-faint">+{order.items.length - 3} more items</p>
            )}
          </div>
          <div className="flex items-center justify-between mt-3">
            <div>
              <span className="text-sm font-black text-accent">₹{order.total}</span>
              <span className="text-[10px] text-faint ml-2">{order.paymentMethod.toUpperCase()}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={onReject}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/15 active:scale-95 transition-all">
                Reject
              </button>
              <button onClick={onAccept}
                className="px-4 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-500 text-white shadow-md shadow-emerald-500/25 hover:bg-emerald-600 active:scale-95 transition-all">
                Accept ✓
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderStatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    placed: 'bg-blue-500',
    confirmed: 'bg-purple-500',
    preparing: 'bg-orange-500',
    ready: 'bg-amber-500',
    picked_up: 'bg-indigo-500',
    on_the_way: 'bg-cyan-500',
    delivered: 'bg-emerald-500',
    cancelled: 'bg-red-500',
  };
  return <div className={`w-2.5 h-2.5 rounded-full ${colors[status] || 'bg-gray-400'}`} />;
}

function PerformanceRow({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted">{label}</span>
      <span className={`text-xs font-bold ${good ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
        {value}
      </span>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-pulse">
      <div className="h-28 rounded-2xl skeleton" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-2xl skeleton" />)}
      </div>
      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 h-64 rounded-2xl skeleton" />
        <div className="lg:col-span-2 h-64 rounded-2xl skeleton" />
      </div>
    </div>
  );
}
