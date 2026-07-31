'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import {
  TrendingUp, TrendingDown, IndianRupee, ShoppingBag, Clock, Star,
  Users, Package, ArrowUpRight, ArrowDownRight, Calendar,
} from 'lucide-react';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ANALYTICS & REPORTS — Charts, Revenue, Performance
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type Period = 'today' | 'week' | 'month';

const DEMO_REVENUE_WEEK = [2840, 3200, 1890, 4120, 3560, 2980, 4250];
const DEMO_ORDERS_WEEK = [18, 22, 12, 28, 24, 19, 26];
const DEMO_HOURLY = [2, 5, 8, 15, 22, 28, 25, 20, 18, 12, 8, 4];

export default function AnalyticsPage() {
  const { demoOrders } = useStore();
  const [mounted, setMounted] = useState(false);
  const [period, setPeriod] = useState<Period>('week');

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-12 rounded-2xl skeleton" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl skeleton" />)}</div>
      <div className="h-48 rounded-2xl skeleton" />
    </div>
  );

  // Demo stats
  const totalRevenue = DEMO_REVENUE_WEEK.reduce((a, b) => a + b, 0);
  const totalOrders = DEMO_ORDERS_WEEK.reduce((a, b) => a + b, 0);
  const avgOrderValue = Math.round(totalRevenue / totalOrders);
  const maxRevenue = Math.max(...DEMO_REVENUE_WEEK);
  const maxOrders = Math.max(...DEMO_ORDERS_WEEK);
  const maxHourly = Math.max(...DEMO_HOURLY);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-body">Analytics & Reports</h1>
          <p className="text-sm text-faint">Insights to grow your business</p>
        </div>
        <div className="flex gap-1 p-1 surface rounded-xl">
          {(['today', 'week', 'month'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                period === p ? 'bg-orange-500 text-white' : 'text-muted hover:text-secondary'
              }`}>
              {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard icon={IndianRupee} label="Revenue" value={`₹${totalRevenue.toLocaleString()}`} trend="+12.5%" up bgColor="bg-emerald-500/8" color="text-emerald-600 dark:text-emerald-400" />
        <KPICard icon={ShoppingBag} label="Orders" value={totalOrders.toString()} trend="+8.2%" up bgColor="bg-blue-500/8" color="text-blue-600 dark:text-blue-400" />
        <KPICard icon={IndianRupee} label="Avg Order" value={`₹${avgOrderValue}`} trend="+3.1%" up bgColor="bg-purple-500/8" color="text-purple-600 dark:text-purple-400" />
        <KPICard icon={Star} label="Rating" value="4.6" trend="+0.2" up bgColor="bg-amber-500/8" color="text-amber-600 dark:text-amber-400" />
      </div>

      {/* ── Charts Grid ── */}
      <div className="grid lg:grid-cols-2 gap-4">

        {/* Revenue Chart */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-body">Revenue</h3>
              <p className="text-[10px] text-faint">Last 7 days</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-body">₹{totalRevenue.toLocaleString()}</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5 justify-end">
                <ArrowUpRight size={10} /> +12.5% vs last week
              </p>
            </div>
          </div>
          <div className="flex items-end gap-2 h-32">
            {DEMO_REVENUE_WEEK.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[8px] text-faint">₹{(val/1000).toFixed(1)}k</span>
                <div className="w-full rounded-t-lg transition-all duration-700 bg-gradient-to-t from-orange-500 to-amber-400"
                  style={{ height: `${(val / maxRevenue) * 100}%`, minHeight: '8px' }} />
                <span className="text-[9px] text-faint font-medium">{days[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Orders Chart */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-body">Orders</h3>
              <p className="text-[10px] text-faint">Last 7 days</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-body">{totalOrders}</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5 justify-end">
                <ArrowUpRight size={10} /> +8.2% vs last week
              </p>
            </div>
          </div>
          <div className="flex items-end gap-2 h-32">
            {DEMO_ORDERS_WEEK.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[8px] text-faint">{val}</span>
                <div className="w-full rounded-t-lg transition-all duration-700 bg-gradient-to-t from-blue-500 to-cyan-400"
                  style={{ height: `${(val / maxOrders) * 100}%`, minHeight: '8px' }} />
                <span className="text-[9px] text-faint font-medium">{days[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Peak Hours & Top Items ── */}
      <div className="grid lg:grid-cols-2 gap-4">

        {/* Peak Hours */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-black text-body mb-1">Peak Hours</h3>
          <p className="text-[10px] text-faint mb-4">Busiest times of the day</p>
          <div className="flex items-end gap-1.5 h-24">
            {DEMO_HOURLY.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-full rounded-t-md transition-all duration-500 ${
                  val >= 20 ? 'bg-gradient-to-t from-red-500 to-orange-400' :
                  val >= 10 ? 'bg-gradient-to-t from-orange-500/70 to-amber-400/80' :
                  'bg-gradient-to-t from-orange-500/30 to-orange-400/40'
                }`} style={{ height: `${(val / maxHourly) * 100}%`, minHeight: '4px' }} />
                <span className="text-[8px] text-faint">{8 + i}h</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-4 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-500/80" /> Rush Hour</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-orange-500/60" /> Moderate</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-orange-500/30" /> Slow</span>
          </div>
        </div>

        {/* Top Selling */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-black text-body mb-1">Top Selling Items</h3>
          <p className="text-[10px] text-faint mb-4">This week&apos;s bestsellers</p>
          <div className="space-y-3">
            {[
              { name: 'Chicken Biryani', orders: 142, revenue: '₹26,980', growth: '+15%' },
              { name: 'Masala Dosa', orders: 98, revenue: '₹7,840', growth: '+8%' },
              { name: 'Filter Coffee', orders: 186, revenue: '₹5,580', growth: '+22%' },
              { name: 'Meals Thali', orders: 67, revenue: '₹10,050', growth: '+5%' },
              { name: 'Parotta + Salna', orders: 54, revenue: '₹4,860', growth: '-3%' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center text-[10px] font-black text-accent flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-body truncate">{item.name}</p>
                  <p className="text-[10px] text-faint">{item.orders} orders</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-body">{item.revenue}</p>
                  <p className={`text-[10px] font-bold ${item.growth.startsWith('+') ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                    {item.growth}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Performance Metrics ── */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-black text-body mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Acceptance Rate', value: '95%', target: '> 90%', good: true, icon: '✓' },
            { label: 'Avg Prep Time', value: '18 min', target: '< 25 min', good: true, icon: '⏱' },
            { label: 'Cancellation Rate', value: '3%', target: '< 5%', good: true, icon: '✕' },
            { label: 'Customer Rating', value: '4.6 / 5', target: '> 4.0', good: true, icon: '★' },
          ].map((metric, i) => (
            <div key={i} className="p-3 surface rounded-xl text-center">
              <span className="text-xl mb-1 block">{metric.icon}</span>
              <p className={`text-lg font-black ${metric.good ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                {metric.value}
              </p>
              <p className="text-xs font-bold text-body mt-0.5">{metric.label}</p>
              <p className="text-[10px] text-faint">Target: {metric.target}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Customer Insights ── */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-black text-body mb-4 flex items-center gap-2">
          <Users size={14} className="text-accent" />
          Customer Insights
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <InsightCard label="Total Customers" value="284" sub="This month" />
          <InsightCard label="Repeat Customers" value="67%" sub="High loyalty" />
          <InsightCard label="New Customers" value="42" sub="This week" />
          <InsightCard label="Avg Orders/Customer" value="2.8" sub="Per month" />
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, trend, up, bgColor, color }: {
  icon: React.ElementType; label: string; value: string; trend: string; up: boolean; bgColor: string; color: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-4 group hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-2.5">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bgColor} group-hover:scale-110 transition-transform`}>
          <Icon size={16} className={color} />
        </div>
        <span className={`flex items-center gap-0.5 text-[10px] font-bold ${up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
          {up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
          {trend}
        </span>
      </div>
      <p className="text-xl font-black text-body">{value}</p>
      <p className="text-[10px] text-faint font-medium">{label}</p>
    </div>
  );
}

function InsightCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="p-3 surface rounded-xl text-center">
      <p className="text-xl font-black text-body">{value}</p>
      <p className="text-xs font-bold text-secondary mt-0.5">{label}</p>
      <p className="text-[10px] text-faint">{sub}</p>
    </div>
  );
}
