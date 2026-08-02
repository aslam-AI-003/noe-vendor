'use client';

import React, { useState, useEffect } from 'react';
import { Timer, Plus, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/index';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PREPARATION TIMER — Live countdown for each order
// Shows remaining time, color-coded status, +5 min button
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface PrepTimerProps {
  acceptedAt: { seconds: number } | null;  // Firestore timestamp
  estimatedPrepTime: number;               // minutes
  onMarkReady: () => void;
  onExtendTime: () => void;
  isUpdating: boolean;
}

export function PrepTimer({ acceptedAt, estimatedPrepTime, onMarkReady, onExtendTime, isUpdating }: PrepTimerProps) {
  const { t } = useLanguage();
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    if (!acceptedAt?.seconds || !estimatedPrepTime) return;

    const calculate = () => {
      const startTime = acceptedAt.seconds * 1000;
      const endTime = startTime + (estimatedPrepTime * 60 * 1000);
      const now = Date.now();
      const diff = Math.floor((endTime - now) / 1000);
      setRemainingSeconds(diff);
      setIsOverdue(diff <= 0);
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [acceptedAt, estimatedPrepTime]);

  if (!acceptedAt?.seconds) return null;

  const totalSeconds = estimatedPrepTime * 60;
  const elapsed = totalSeconds - remainingSeconds;
  const progress = Math.min(100, Math.max(0, (elapsed / totalSeconds) * 100));

  const formatTime = (seconds: number) => {
    const abs = Math.abs(seconds);
    const mins = Math.floor(abs / 60);
    const secs = abs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Color logic
  const getStatusColor = () => {
    if (isOverdue) return { bg: 'bg-red-500', text: 'text-red-600', bar: 'bg-red-500', ring: 'ring-red-500/30' };
    if (remainingSeconds < 300) return { bg: 'bg-amber-500', text: 'text-amber-600', bar: 'bg-amber-500', ring: 'ring-amber-500/30' };
    return { bg: 'bg-emerald-500', text: 'text-emerald-600', bar: 'bg-emerald-500', ring: 'ring-emerald-500/30' };
  };

  const colors = getStatusColor();

  return (
    <div className={`p-3 rounded-xl border ${isOverdue ? 'bg-red-500/5 border-red-500/20' : 'bg-orange-500/[0.03] border-orange-500/10'}`}>
      {/* Timer Display */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isOverdue ? 'bg-red-500/10' : 'bg-orange-500/10'}`}>
            {isOverdue ? <AlertTriangle size={14} className="text-red-500" /> : <Timer size={14} className="text-orange-500" />}
          </div>
          <div>
            <p className="text-[10px] text-faint font-medium">
              {isOverdue ? t('overdue') : t('prep_time_remaining')}
            </p>
            <p className={`text-lg font-black ${colors.text} dark:${colors.text}`}>
              {isOverdue ? '+' : ''}{formatTime(remainingSeconds)}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[10px] text-faint">{t('estimated')}</p>
          <p className="text-xs font-bold text-muted">{estimatedPrepTime} min</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 rounded-full bg-[var(--bg3)] overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${colors.bar}`}
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onMarkReady}
          disabled={isUpdating}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50"
        >
          <CheckCircle2 size={13} />
          {t('mark_ready')}
        </button>
        <button
          onClick={onExtendTime}
          disabled={isUpdating}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
        >
          <Plus size={13} />
          {t('add_5_min')}
        </button>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PREP TIME PICKER — Choose time when accepting order
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface PrepTimePickerProps {
  onAccept: (prepTime: number) => void;
  onCancel: () => void;
  isUpdating: boolean;
}

export function PrepTimePicker({ onAccept, onCancel, isUpdating }: PrepTimePickerProps) {
  const { t } = useLanguage();
  const [selectedTime, setSelectedTime] = useState(15);

  const timeOptions = [
    { value: 10, label: '10 min', emoji: '⚡' },
    { value: 15, label: '15 min', emoji: '🍳' },
    { value: 20, label: '20 min', emoji: '👨‍🍳' },
    { value: 30, label: '30 min', emoji: '🍲' },
  ];

  return (
    <div className="p-3 border-t border-subtle bg-orange-500/[0.02] space-y-3">
      <p className="text-xs font-bold text-body">{t('how_long_prepare')}</p>
      
      <div className="grid grid-cols-4 gap-2">
        {timeOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setSelectedTime(opt.value)}
            className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all active:scale-95 ${
              selectedTime === opt.value
                ? 'border-orange-500 bg-orange-500/10 shadow-sm'
                : 'border-transparent surface hover:border-orange-400/30'
            }`}
          >
            <span className="text-lg">{opt.emoji}</span>
            <span className="text-[10px] font-bold text-body">{opt.label}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onAccept(selectedTime)}
          disabled={isUpdating}
          className="flex-1 py-3 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50"
        >
          {isUpdating ? t('accepting') : `✅ ${t('accept_with_time')} (${selectedTime} min)`}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-3 rounded-xl bg-red-500/10 text-red-500 text-xs font-bold hover:bg-red-500/20 transition-all"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
