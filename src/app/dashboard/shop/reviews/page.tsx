'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Star, MessageSquare, ThumbsUp, TrendingUp, Send, Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/index';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REVIEWS — Real data from Firestore
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface Review {
  id: string;
  customerName: string;
  rating: number;
  text: string;
  orderId?: string;
  reply?: string | null;
  repliedAt?: any;
  createdAt?: { seconds: number };
}

export default function ReviewsPage() {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState('');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('noe-vendor-profile');
    if (saved) {
      const profile = JSON.parse(saved);
      setVendorId(profile.id);
      fetchReviews(profile.id);
    }
  }, []);

  const fetchReviews = async (id: string) => {
    try {
      const res = await fetch(`/api/vendor/reviews?vendorId=${id}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) { toast.error('Enter a reply'); return; }
    setSendingReply(true);
    try {
      const res = await fetch('/api/vendor/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reply', reviewId, reply: replyText }),
      });
      const data = await res.json();
      if (data.success) {
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, reply: replyText } : r));
        toast.success('Reply sent! 💬');
        setReplyingTo(null);
        setReplyText('');
      }
    } catch (err) {
      toast.error('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    );
  }

  const filtered = filterRating ? reviews.filter(r => r.rating === filterRating) : reviews;
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0';
  const ratingDist = [5, 4, 3, 2, 1].map(r => ({
    star: r,
    count: reviews.filter(rev => rev.rating === r).length,
    pct: reviews.length > 0 ? Math.round((reviews.filter(rev => rev.rating === r).length / reviews.length) * 100) : 0,
  }));

  const getTimeAgo = (createdAt: any) => {
    if (!createdAt?.seconds) return '';
    const diff = Math.floor((Date.now() / 1000) - createdAt.seconds);
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-body flex items-center gap-2">
          <Star size={20} className="text-[#0E9F6E]" />
          {t('reviews_title')}
        </h1>
        <p className="text-sm text-faint">{reviews.length} {t('total_reviews')}</p>
      </div>

      {/* Rating Overview */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-4xl font-black text-body">{avgRating}</p>
            <div className="flex items-center gap-0.5 mt-1 justify-center">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} size={12} className={s <= Math.round(Number(avgRating)) ? 'text-[#0E9F6E] fill-amber-500' : 'text-gray-300'} />
              ))}
            </div>
            <p className="text-[10px] text-faint mt-1">{reviews.length} {t('reviews_label')}</p>
          </div>

          <div className="flex-1 space-y-1.5">
            {ratingDist.map(r => (
              <div key={r.star} className="flex items-center gap-2">
                <button
                  onClick={() => setFilterRating(filterRating === r.star ? null : r.star)}
                  className={`text-xs font-bold w-4 ${filterRating === r.star ? 'text-[#0E9F6E]' : 'text-muted'}`}
                >
                  {r.star}
                </button>
                <Star size={10} className="text-[#0E9F6E]" />
                <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  <div className="h-full rounded-full bg-[#0E9F6E] transition-all" style={{ width: `${r.pct}%` }} />
                </div>
                <span className="text-[10px] text-faint w-8 text-right">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2">
        <button onClick={() => setFilterRating(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${!filterRating ? 'bg-[#0E9F6E] text-white' : 'glass-sm text-muted'}`}>
          All ({reviews.length})
        </button>
        {[5, 4, 3, 2, 1].map(r => (
          <button key={r} onClick={() => setFilterRating(filterRating === r ? null : r)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${filterRating === r ? 'bg-[#0E9F6E] text-white' : 'glass-sm text-muted'}`}>
            {r} <Star size={10} className={filterRating === r ? 'text-white' : 'text-[#0E9F6E]'} />
          </button>
        ))}
      </div>

      {/* Reviews List */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Star size={32} className="text-faint mx-auto mb-3" />
          <p className="text-sm font-bold text-muted">
            {reviews.length === 0 ? t('no_reviews_yet') : t('no_rating_filter')}
          </p>
          <p className="text-xs text-faint mt-1">{t('reviews_appear_hint')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(review => (
            <div key={review.id} className="glass-card rounded-2xl p-4 space-y-3">
              {/* Review header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#0E9F6E]/10 flex items-center justify-center text-xs font-black text-accent">
                    {review.customerName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-body">{review.customerName}</p>
                    <p className="text-[10px] text-faint">{getTimeAgo(review.createdAt)} {review.orderId && `• ${review.orderId}`}</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={12} className={s <= review.rating ? 'text-[#0E9F6E] fill-amber-500' : 'text-gray-300'} />
                  ))}
                </div>
              </div>

              {/* Review text */}
              {review.text && (
                <p className="text-xs text-body leading-relaxed">{review.text}</p>
              )}

              {/* Vendor reply */}
              {review.reply && (
                <div className="ml-4 p-3 surface rounded-xl border-l-3 border-[#0E9F6E]">
                  <p className="text-[10px] font-bold text-accent mb-1">{t('your_reply')}</p>
                  <p className="text-xs text-muted">{review.reply}</p>
                </div>
              )}

              {/* Reply button */}
              {!review.reply && (
                <>
                  {replyingTo === review.id ? (
                    <div className="flex gap-2">
                      <input
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder={t('write_reply')}
                        className="input-glass text-xs flex-1"
                        onKeyDown={e => e.key === 'Enter' && handleReply(review.id)}
                      />
                      <button
                        onClick={() => handleReply(review.id)}
                        disabled={sendingReply}
                        className="px-3 py-2 rounded-xl bg-[#0E9F6E] text-white text-xs font-bold flex items-center gap-1 disabled:opacity-50"
                      >
                        <Send size={12} /> {sendingReply ? '...' : t('reply_btn')}
                      </button>
                      <button
                        onClick={() => { setReplyingTo(null); setReplyText(''); }}
                        className="px-3 py-2 rounded-xl glass-sm text-xs font-bold text-muted"
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReplyingTo(review.id)}
                      className="flex items-center gap-1.5 text-xs font-bold text-accent hover:opacity-80"
                    >
                      <MessageSquare size={12} /> {t('reply_to_review')}
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tips */}
      {reviews.length > 0 && (
        <div className="glass-card rounded-2xl p-4 border border-blue-500/20 bg-blue-500/5">
          <div className="flex items-start gap-3">
            <TrendingUp size={16} className="text-blue-600 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-blue-800">{t('tips_title')}</p>
              <ul className="text-[10px] text-blue-700/80 mt-1 space-y-0.5">
                <li>• {t('tip_1')}</li>
                <li>• {t('tip_2')}</li>
                <li>• {t('tip_3')}</li>
                <li>• {t('tip_4')}</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
