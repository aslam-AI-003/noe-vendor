'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet, IndianRupee, ArrowUpRight, ArrowDownRight, Calendar,
  Building2, CreditCard, Clock, CheckCircle2, Download, Filter,
} from 'lucide-react';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PAYOUTS & SETTLEMENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DEMO_TRANSACTIONS = [
  { id: 'TXN001', date: '2026-07-29', amount: 2840, type: 'credit', status: 'completed', desc: 'Daily Settlement - 18 orders' },
  { id: 'TXN002', date: '2026-07-28', amount: 3200, type: 'credit', status: 'completed', desc: 'Daily Settlement - 22 orders' },
  { id: 'TXN003', date: '2026-07-27', amount: 1890, type: 'credit', status: 'completed', desc: 'Daily Settlement - 12 orders' },
  { id: 'TXN004', date: '2026-07-26', amount: 4120, type: 'credit', status: 'completed', desc: 'Daily Settlement - 28 orders' },
  { id: 'TXN005', date: '2026-07-25', amount: 3560, type: 'credit', status: 'processing', desc: 'Daily Settlement - 24 orders' },
  { id: 'TXN006', date: '2026-07-24', amount: 450, type: 'debit', status: 'completed', desc: 'Platform Commission (15%)' },
  { id: 'TXN007', date: '2026-07-23', amount: 2980, type: 'credit', status: 'completed', desc: 'Daily Settlement - 19 orders' },
  { id: 'TXN008', date: '2026-07-22', amount: 380, type: 'debit', status: 'completed', desc: 'Platform Commission (15%)' },
];

export default function PayoutsPage() {
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div className="space-y-4 animate-pulse"><div className="h-32 rounded-2xl skeleton" /><div className="h-64 rounded-2xl skeleton" /></div>;

  const filtered = filter === 'all' ? DEMO_TRANSACTIONS : DEMO_TRANSACTIONS.filter(t => t.type === filter);
  const totalEarnings = DEMO_TRANSACTIONS.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const totalCommission = DEMO_TRANSACTIONS.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
  const netBalance = totalEarnings - totalCommission;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-body">Payouts & Settlement</h1>
          <p className="text-sm text-faint">Track your earnings and settlements</p>
        </div>
        <button className="btn-secondary text-xs px-4 py-2.5 flex items-center gap-1.5 self-start">
          <Download size={13} /> Export Report
        </button>
      </div>

      {/* ── Balance Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Current Balance */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.06) 0%, rgba(251,191,36,0.04) 100%)' }}>
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-orange-500/5" />
          <Wallet size={20} className="text-accent mb-2" />
          <p className="text-[10px] text-faint font-medium uppercase">Available Balance</p>
          <p className="text-2xl font-black text-body mt-1">₹{netBalance.toLocaleString()}</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5 mt-1">
            <ArrowUpRight size={10} /> Next payout: Tomorrow
          </p>
        </div>

        {/* Total Earnings */}
        <div className="glass-card rounded-2xl p-5">
          <IndianRupee size={18} className="text-emerald-600 dark:text-emerald-400 mb-2" />
          <p className="text-[10px] text-faint font-medium uppercase">Total Earnings</p>
          <p className="text-xl font-black text-body mt-1">₹{totalEarnings.toLocaleString()}</p>
          <p className="text-[10px] text-faint mt-1">This month • 149 orders</p>
        </div>

        {/* Commission */}
        <div className="glass-card rounded-2xl p-5">
          <CreditCard size={18} className="text-orange-600 dark:text-orange-400 mb-2" />
          <p className="text-[10px] text-faint font-medium uppercase">Commission Paid</p>
          <p className="text-xl font-black text-body mt-1">₹{totalCommission.toLocaleString()}</p>
          <p className="text-[10px] text-faint mt-1">15% platform fee</p>
        </div>
      </div>

      {/* ── Bank Account ── */}
      <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
          <Building2 size={18} className="text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-body">HDFC Bank ****4521</p>
          <p className="text-[10px] text-faint">Auto-settlement every day at 6:00 AM</p>
        </div>
        <button className="text-xs text-accent font-bold hover:opacity-80">Change</button>
      </div>

      {/* ── Settlement Schedule ── */}
      <div className="glass-card rounded-2xl p-4">
        <h3 className="text-sm font-black text-body mb-3">Settlement Schedule</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { day: 'Yesterday', amount: '₹3,200', status: 'Settled', color: 'text-emerald-600 dark:text-emerald-400' },
            { day: 'Today', amount: '₹2,840', status: 'Processing', color: 'text-orange-600 dark:text-orange-400' },
            { day: 'Tomorrow', amount: '₹1,890', status: 'Scheduled', color: 'text-blue-600 dark:text-blue-400' },
          ].map((item, i) => (
            <div key={i} className="p-3 surface rounded-xl text-center">
              <p className="text-[10px] text-faint font-medium">{item.day}</p>
              <p className="text-base font-black text-body mt-1">{item.amount}</p>
              <p className={`text-[10px] font-bold mt-1 ${item.color}`}>{item.status}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Transaction History ── */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-subtle flex items-center justify-between">
          <h3 className="text-sm font-black text-body">Transaction History</h3>
          <div className="flex gap-1 p-0.5 surface rounded-lg">
            {(['all', 'credit', 'debit'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                  filter === f ? 'bg-orange-500 text-white' : 'text-faint hover:text-secondary'
                }`}>
                {f === 'all' ? 'All' : f === 'credit' ? 'Earnings' : 'Deductions'}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-subtle">
          {filtered.map(txn => (
            <div key={txn.id} className="px-4 py-3.5 flex items-center gap-3 hover:bg-[var(--card-hover)] transition-colors">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                txn.type === 'credit' ? 'bg-emerald-500/10' : 'bg-red-500/10'
              }`}>
                {txn.type === 'credit' ? (
                  <ArrowDownRight size={16} className="text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ArrowUpRight size={16} className="text-red-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-body">{txn.desc}</p>
                <p className="text-[10px] text-faint flex items-center gap-1">
                  <Calendar size={9} /> {new Date(txn.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  <span className="mx-1">•</span>
                  {txn.id}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-black ${txn.type === 'credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                  {txn.type === 'credit' ? '+' : '-'}₹{txn.amount.toLocaleString()}
                </p>
                <p className={`text-[9px] font-bold ${
                  txn.status === 'completed' ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'
                }`}>
                  {txn.status === 'completed' ? '✓ Settled' : '⏳ Processing'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
