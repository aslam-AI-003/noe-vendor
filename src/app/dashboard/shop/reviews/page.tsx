'use client';

import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, ThumbsUp, TrendingUp, Filter, Search } from 'lucide-react';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RATINGS & REVIEWS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DEMO_REVIEWS = [
  { id: '1', customer: 'Priya M.', rating: 5, text: 'Best biryani in Thanjavur! Always hot and fresh. Delivery was super quick too.', date: '2026-07-29', orderId: 'NOE-281', replied: false },
  { id: '2', customer: 'Karthik R.', rating: 4, text: 'Good food, slightly delayed delivery. But taste was amazing as always.', date: '2026-07-28', orderId: 'NOE-275', replied: true, reply: 'Thank you Karthik! We are working on improving delivery times.' },
  { id: '3', customer: 'Lakshmi S.', rating: 5, text: 'Filter coffee is the best! Reminds me of home-made coffee. Will order again!', date: '2026-07-27', orderId: 'NOE-268', replied: false },
  { id: '4', customer: 'Senthil K.', rating: 3, text: 'Food was okay, but the portion size could be bigger for the price.', date: '2026-07-26', orderId: 'NOE-260', replied: true, reply: 'We appreciate your feedback Senthil. We have updated our portion sizes!' },
  { id: '5', customer: 'Divya P.', rating: 5, text: 'Parotta and salna combo was heavenly! 🔥 Ordering every weekend now.', date: '2026-07-25', orderId: 'NOE-252', replied: false },
  { id: '6', customer: 'Ravi A.', rating: 4, text: 'Consistent quality. Never disappoints. The masala dosa is my favorite.', date: '2026-07-24', orderId: 'NOE-245', replied: false },
  { id: '7', customer: 'Meena G.', rating: 2, text: 'Order arrived cold. Packaging needs improvement for hot items.', date: '2026-07-23', orderId: 'NOE-238', replied: true, reply: 'Sorry about this Meena. We have switched to insulated packaging now.' },
];

export default function ReviewsPage() {
  const [mounted, setMounted] = useState(false);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div className="space-y-4 animate-pulse"><div className="h-32 rounded-2xl skeleton" /><div className="h-64 rounded-2xl skeleton" /></div>;

  const filtered = filterRating ? DEMO_REVIEWS.filter(r => r.rating === filterRating) : DEMO_REVIEWS;
  const avgRating = (DEMO_REVIEWS.reduce((s, r) => s + r.rating, 0) / DEMO_REVIEWS.length).toFixed(1);
  const ratingDist = [5, 4, 3, 2, 1].map(r => ({
    star: r,
    count: DEMO_REVIEWS.filter(rev => rev.rating === r).length,
    pct: Math.round((DEMO_REVIEWS.filter(rev => rev.rating === r).length / DEMO_REVIEWS.length) * 100),
  }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-black text-body">Ratings & Reviews</h1>
        <p className="text-sm text-faint">{DEMO_REVIEWS.length} reviews from customers</p>
      </div>

      {/* ── Overview Card ── */}
      <div className="glass-card rounded-2xl p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Average Rating */}
          <div className="text-center sm:text-left">
            <div className="flex items-baseline gap-1 justify-center sm:justify-start">
              <span className="text-4xl font-black text-body">{avgRating}</span>
              <span className="text-lg text-faint">/5</span>
            </div>
            <div className="flex items-center gap-0.5 justify-center sm:justify-start mt-1">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} size={16} className={s <= Math.round(Number(avgRating)) ? 'text-amber-400 fill-amber-400' : 'text-faint'} />
              ))}
            </div>
            <p className="text-xs text-faint mt-1">{DEMO_REVIEWS.length} ratings</p>
          </div>

          {/* Rating Distribution */}
          <div className="sm:col-span-2 space-y-1.5">
            {ratingDist.map(r => (
              <div key={r.star} className="flex items-center gap-2">
                <span className="text-xs text-muted w-4 text-right">{r.star}</span>
                <Star size={11} className="text-amber-400 fill-amber-400" />
                <div className="flex-1 h-2 rounded-full bg-[var(--input-bg)] overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700"
                    style={{ width: `${r.pct}%` }} />
                </div>
                <span className="text-[10px] text-faint w-8">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-sm rounded-xl p-3 text-center">
          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">85%</p>
          <p className="text-[10px] text-faint">Positive (4-5★)</p>
        </div>
        <div className="glass-sm rounded-xl p-3 text-center">
          <p className="text-lg font-black text-body">43%</p>
          <p className="text-[10px] text-faint">Reply Rate</p>
        </div>
        <div className="glass-sm rounded-xl p-3 text-center">
          <p className="text-lg font-black text-accent">+0.2</p>
          <p className="text-[10px] text-faint">vs Last Month</p>
        </div>
      </div>

      {/* ── Filter ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button onClick={() => setFilterRating(null)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${!filterRating ? 'bg-orange-500 text-white' : 'glass-sm text-muted'}`}>
          All ({DEMO_REVIEWS.length})
        </button>
        {[5, 4, 3, 2, 1].map(r => (
          <button key={r} onClick={() => setFilterRating(r)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${filterRating === r ? 'bg-orange-500 text-white' : 'glass-sm text-muted'}`}>
            {r} <Star size={10} className={filterRating === r ? 'fill-white text-white' : 'fill-amber-400 text-amber-400'} />
          </button>
        ))}
      </div>

      {/* ── Reviews List ── */}
      <div className="space-y-3">
        {filtered.map(review => (
          <div key={review.id} className="glass-card rounded-2xl p-4 space-y-3">
            {/* Review Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-orange-500/10 flex items-center justify-center text-xs font-black text-accent">
                  {review.customer.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-body">{review.customer}</p>
                  <p className="text-[10px] text-faint">Order #{review.orderId} • {new Date(review.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={12} className={s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-faint'} />
                ))}
              </div>
            </div>

            {/* Review Text */}
            <p className="text-xs text-secondary leading-relaxed">{review.text}</p>

            {/* Shop Reply */}
            {review.replied && review.reply && (
              <div className="ml-4 p-3 bg-orange-500/5 border border-orange-500/15 rounded-xl">
                <p className="text-[10px] text-accent font-bold mb-1">Your Reply:</p>
                <p className="text-[11px] text-secondary">{review.reply}</p>
              </div>
            )}

            {/* Reply Input */}
            {replyingTo === review.id ? (
              <div className="ml-4 space-y-2">
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Write your reply..."
                  className="input-glass text-xs w-full h-20 resize-none"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => { setReplyingTo(null); setReplyText(''); }}
                    className="btn-secondary text-[10px] px-3 py-1.5">Cancel</button>
                  <button onClick={() => { setReplyingTo(null); setReplyText(''); }}
                    className="btn-primary text-[10px] px-3 py-1.5">Send Reply</button>
                </div>
              </div>
            ) : !review.replied ? (
              <button onClick={() => setReplyingTo(review.id)}
                className="text-[11px] text-accent font-bold hover:opacity-80 flex items-center gap-1">
                <MessageSquare size={11} /> Reply to review
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
