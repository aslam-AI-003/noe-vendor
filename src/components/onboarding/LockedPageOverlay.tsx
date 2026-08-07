'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Lock, ArrowRight, Rocket } from 'lucide-react';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LockedPageOverlay — Shows blurred content + motivation
// Used on Analytics, Payouts, Reviews pages in setup mode
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface LockedPageOverlayProps {
  title: string;
  description: string;
  features: string[];
  actionLabel?: string;
  actionHref?: string;
  icon?: React.ReactNode;
  children: React.ReactNode; // The blurred content behind
}

export default function LockedPageOverlay({
  title,
  description,
  features,
  actionLabel = 'Complete Setup',
  actionHref = '/dashboard/shop',
  icon,
  children,
}: LockedPageOverlayProps) {
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('noe-vendor-profile');
    if (saved) {
      const profile = JSON.parse(saved);
      setIsLive(profile.onboardingStatus === 'active');
    }
  }, []);

  // If vendor is live/approved, show actual content without overlay
  if (isLive) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blurred background content */}
      <div className="blur-[3px] opacity-40 pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>

      {/* Overlay card */}
      <div className="absolute inset-0 flex items-center justify-center p-4 z-10">
        <div className="glass-card rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl border border-subtle">
          {/* Lock icon */}
          <div className="w-14 h-14 bg-[#0E9F6E]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            {icon || <Lock size={24} className="text-accent" />}
          </div>

          {/* Title */}
          <h3 className="text-lg font-black text-body">{title}</h3>
          <p className="text-xs text-muted mt-1.5">{description}</p>

          {/* Features list */}
          <div className="mt-4 text-left space-y-2">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-5 h-5 bg-emerald-500/10 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-[10px] text-emerald-600">✓</span>
                </div>
                <span className="text-xs text-secondary">{feature}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Link href={actionHref}
            className="btn-primary w-full mt-5 py-3 text-sm inline-flex items-center justify-center gap-2">
            <Rocket size={14} />
            {actionLabel}
            <ArrowRight size={14} />
          </Link>

          <p className="text-[10px] text-faint mt-3">
            Complete your shop setup to unlock this feature
          </p>
        </div>
      </div>
    </div>
  );
}
