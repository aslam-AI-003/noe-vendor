'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet, IndianRupee, ArrowUpRight, Calendar,
  Building2, CreditCard, Clock, CheckCircle2, Loader2,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/index';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PAYOUTS — Real earnings from completed orders
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface Order {
  id: string;
  orderId: string;
  totalAmount: number;
  status: string;
  items: { name: string; quantity: number; price: number }[];
  createdAt?: { seconds: number };
}

const COMMISSION_RATE = 0.15; // 15% platform commission

export default function PayoutsPage() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorProfile, setVendorProfile] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('noe-vendor-profile');
    if (saved) {
      const profile = JSON.parse(saved);
      setVendorProfile(profile);
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
      console.error('Failed to fetch payouts:', err);
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

  const completedOrders = orders.filter(o => ['delivered', 'picked_up'].includes(o.status));
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalCommission = Math.round(totalRevenue * COMMISSION_RATE);
  const netEarnings = totalRevenue - totalCommission;

  // Group by day
  const dailyEarnings: Record<string, { date: string; revenue: number; orders: number; commission: number; net: number }> = {};
  completedOrders.forEach(order => {
    const date = order.createdAt?.seconds
      ? new Date(order.createdAt.seconds * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Unknown';
    if (!dailyEarnings[date]) {
      dailyEarnings[date] = { date, revenue: 0, orders: 0, commission: 0, net: 0 };
    }
    dailyEarnings[date].revenue += order.totalAmount;
    dailyEarnings[date].orders += 1;
    dailyEarnings[date].commission += Math.round(order.totalAmount * COMMISSION_RATE);
    dailyEarnings[date].net += Math.round(order.totalAmount * (1 - COMMISSION_RATE));
  });

  const dailyList = Object.values(dailyEarnings).sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Payment info
  const paymentMethod = vendorProfile?.upiId
    ? `UPI: ${vendorProfile.upiId}`
    : vendorProfile?.accountNumber
    ? `Bank: ****${vendorProfile.accountNumber.slice(-4)}`
    : 'Not configured';

  return (
    <div className="space-y-5 max-w-4xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-body flex items-center gap-2">
          <Wallet size={20} className="text-accent" />
          {t('payouts_title')}
        </h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="glass-card rounded-2xl p-4">
          <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-2">
            <IndianRupee size={14} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600">₹{netEarnings.toLocaleString()}</p>
          <p className="text-[10px] text-faint">{t('total_earnings')}</p>
        </div>

        <div className="glass-card rounded-2xl p-4">
          <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center mb-2">
            <ArrowUpRight size={14} className="text-blue-600" />
          </div>
          <p className="text-2xl font-black text-body">₹{totalRevenue.toLocaleString()}</p>
          <p className="text-[10px] text-faint">{t('revenue')}</p>
        </div>

        <div className="glass-card rounded-2xl p-4 col-span-2 lg:col-span-1">
          <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center mb-2">
            <CreditCard size={14} className="text-red-500" />
          </div>
          <p className="text-2xl font-black text-red-500">₹{totalCommission.toLocaleString()}</p>
          <p className="text-[10px] text-faint">{t('commission_label')}</p>
        </div>
      </div>

      {/* Payment Method */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <Building2 size={16} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-body">{t('settlement_account')}</p>
              <p className="text-[10px] text-faint">{paymentMethod}</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
            {vendorProfile?.upiId || vendorProfile?.accountNumber ? t('active_status') : t('setup_needed')}
          </span>
        </div>
      </div>

      {/* Daily Earnings */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-black text-body mb-4 flex items-center gap-2">
          <Calendar size={14} className="text-accent" />
          {t('daily_settlement')}
        </h3>

        {dailyList.length === 0 ? (
          <div className="text-center py-8">
            <Wallet size={24} className="text-faint mx-auto mb-2" />
            <p className="text-xs text-faint">{t('no_completed_orders_payout')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {dailyList.map(day => (
              <div key={day.date} className="flex items-center justify-between p-3 surface rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 size={12} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-body">{day.date}</p>
                    <p className="text-[10px] text-faint">{day.orders} {t('orders_label')} • ₹{day.commission} {t('commission_text')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-600">₹{day.net}</p>
                  <p className="text-[9px] text-faint">of ₹{day.revenue}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payout Schedule Info */}
      <div className="glass-card rounded-2xl p-4 border border-amber-500/20 bg-amber-500/5">
        <div className="flex items-start gap-3">
          <Clock size={16} className="text-amber-600 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-800">{t('payout_schedule')}</p>
            <p className="text-[10px] text-amber-700/80 mt-0.5">
              {t('payout_schedule_desc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
