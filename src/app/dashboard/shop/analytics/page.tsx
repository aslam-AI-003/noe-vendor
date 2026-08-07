'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp, IndianRupee, ShoppingBag, Clock,
  Users, Package, Calendar, BarChart3, Loader2,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/index';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ANALYTICS — Real data from Firestore orders
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  items: { name: string; quantity: number; price: number }[];
  createdAt?: { seconds: number };
  deliveredAt?: { seconds: number };
}

export default function AnalyticsPage() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'all'>('all');

  useEffect(() => {
    const saved = localStorage.getItem('noe-vendor-profile');
    if (saved) {
      const profile = JSON.parse(saved);
      fetchOrders(profile.id);
    }
  }, []);

  const fetchOrders = async (vendorId: string) => {
    try {
      const res = await fetch(`/api/vendor/orders?vendorId=${vendorId}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    );
  }

  // Calculate stats from real orders
  const now = Date.now() / 1000;
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayStartSec = todayStart.getTime() / 1000;
  const weekStartSec = todayStartSec - (7 * 86400);

  const filterOrders = (orderList: Order[]) => {
    if (period === 'today') return orderList.filter(o => (o.createdAt?.seconds || 0) >= todayStartSec);
    if (period === 'week') return orderList.filter(o => (o.createdAt?.seconds || 0) >= weekStartSec);
    return orderList;
  };

  const filteredOrders = filterOrders(orders);
  const completedOrders = filteredOrders.filter(o => ['delivered', 'picked_up'].includes(o.status));
  const cancelledOrders = filteredOrders.filter(o => o.status === 'cancelled');
  const activeOrders = filteredOrders.filter(o => ['new', 'accepted', 'preparing', 'ready'].includes(o.status));

  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalOrders = filteredOrders.length;
  const avgOrderValue = completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length) : 0;
  const totalItems = completedOrders.reduce((sum, o) => sum + (o.items?.reduce((s, i) => s + i.quantity, 0) || 0), 0);

  // Top selling items
  const itemCounts: Record<string, { name: string; qty: number; revenue: number }> = {};
  completedOrders.forEach(o => {
    o.items?.forEach(item => {
      if (!itemCounts[item.name]) itemCounts[item.name] = { name: item.name, qty: 0, revenue: 0 };
      itemCounts[item.name].qty += item.quantity;
      itemCounts[item.name].revenue += item.price * item.quantity;
    });
  });
  const topItems = Object.values(itemCounts).sort((a, b) => b.qty - a.qty).slice(0, 5);

  // Commission (15%)
  const commission = Math.round(totalRevenue * 0.15);
  const netEarnings = totalRevenue - commission;

  return (
    <div className="space-y-5 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-body flex items-center gap-2">
            <BarChart3 size={20} className="text-accent" />
            {t('analytics_title')}
          </h1>
        </div>
        <div className="flex gap-1.5 surface rounded-xl p-1">
          {(['today', 'week', 'all'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                period === p ? 'bg-[#0E9F6E] text-white' : 'text-muted'
              }`}>
              {p === 'today' ? t('today') : p === 'week' ? t('this_week') : t('all_time')}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <IndianRupee size={14} className="text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-body">₹{totalRevenue.toLocaleString()}</p>
          <p className="text-[10px] text-faint">{t('revenue')}</p>
        </div>

        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <ShoppingBag size={14} className="text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-body">{totalOrders}</p>
          <p className="text-[10px] text-faint">{t('total_orders')}</p>
        </div>

        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <TrendingUp size={14} className="text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-body">₹{avgOrderValue}</p>
          <p className="text-[10px] text-faint">{t('avg_order_value')}</p>
        </div>

        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-[#0E9F6E]/10 rounded-lg flex items-center justify-center">
              <Package size={14} className="text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-body">{totalItems}</p>
          <p className="text-[10px] text-faint">{t('items_sold')}</p>
        </div>
      </div>

      {/* Earnings Breakdown */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-black text-body mb-4 flex items-center gap-2">
          <IndianRupee size={14} className="text-accent" />
          {t('earnings_breakdown')}
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 surface rounded-xl">
            <span className="text-xs text-body">{t('gross_revenue')}</span>
            <span className="text-sm font-black text-body">₹{totalRevenue.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between p-3 surface rounded-xl">
            <span className="text-xs text-red-500">{t('platform_commission')}</span>
            <span className="text-sm font-bold text-red-500">- ₹{commission.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
            <span className="text-xs font-bold text-emerald-700">{t('net_earnings')}</span>
            <span className="text-lg font-black text-emerald-600">₹{netEarnings.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Order Status Breakdown */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-black text-body mb-4 flex items-center gap-2">
          <ShoppingBag size={14} className="text-accent" />
          {t('order_status')}
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 surface rounded-xl text-center">
            <p className="text-lg font-black text-blue-600">{activeOrders.length}</p>
            <p className="text-[10px] text-faint">{t('active')}</p>
          </div>
          <div className="p-3 surface rounded-xl text-center">
            <p className="text-lg font-black text-emerald-600">{completedOrders.length}</p>
            <p className="text-[10px] text-faint">{t('completed')}</p>
          </div>
          <div className="p-3 surface rounded-xl text-center">
            <p className="text-lg font-black text-red-500">{cancelledOrders.length}</p>
            <p className="text-[10px] text-faint">{t('cancelled')}</p>
          </div>
          <div className="p-3 surface rounded-xl text-center">
            <p className="text-lg font-black text-amber-600">
              {completedOrders.length > 0 ? Math.round((completedOrders.length / totalOrders) * 100) : 0}%
            </p>
            <p className="text-[10px] text-faint">{t('completion_rate')}</p>
          </div>
        </div>
      </div>

      {/* Top Selling Items */}
      {topItems.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-black text-body mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-accent" />
            {t('top_items')}
          </h3>
          <div className="space-y-2.5">
            {topItems.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-3 p-3 surface rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-[#0E9F6E]/10 flex items-center justify-center text-xs font-black text-accent">
                  #{idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-body truncate">{item.name}</p>
                  <p className="text-[10px] text-faint">{item.qty} {t('sold')}</p>
                </div>
                <p className="text-sm font-bold text-body">₹{item.revenue}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No data state */}
      {orders.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <BarChart3 size={32} className="text-faint mx-auto mb-3" />
          <p className="text-sm font-bold text-muted">{t('no_orders_yet')}</p>
          <p className="text-xs text-faint mt-1">{t('analytics_empty_hint')}</p>
        </div>
      )}
    </div>
  );
}
