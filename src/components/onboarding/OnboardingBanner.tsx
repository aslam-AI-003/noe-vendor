'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, ArrowRight, Clock, Rocket } from 'lucide-react';
import { VendorOnboardingStatus } from '@/types/vendor';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// OnboardingBanner — Shows on dashboard based on vendor status
// Guides vendor through remaining onboarding steps
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface VendorProfile {
  onboardingStatus: VendorOnboardingStatus;
  onboardingStep: number;
  shopName: string;
}

export default function OnboardingBanner() {
  const [profile, setProfile] = useState<VendorProfile | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('noe-vendor-profile');
    if (saved) {
      setProfile(JSON.parse(saved));
    }
  }, []);

  if (!profile) return null;

  const { onboardingStatus, onboardingStep } = profile;

  // Don't show banner if fully active
  if (onboardingStatus === 'active') return null;

  const bannerConfig: Record<string, { bg: string; icon: React.ReactNode; title: string; desc: string; action?: { label: string; href: string } }> = {
    otp_verified: {
      bg: 'from-amber-500/10 to-[#087f58]/10 border-[#0E9F6E]/20',
      icon: <AlertCircle size={18} className="text-amber-600" />,
      title: 'Complete your profile to go live!',
      desc: 'Add address & bank details (Step 2) to start receiving orders.',
      action: { label: 'Complete Step 2', href: '/vendor/onboarding/step2' },
    },
    pending_profile: {
      bg: 'from-blue-500/10 to-indigo-500/10 border-blue-500/20',
      icon: <Clock size={18} className="text-blue-600" />,
      title: 'Almost there! Verify your identity',
      desc: 'Upload ID proof & FSSAI to request approval (Step 3).',
      action: { label: 'Complete Step 3', href: '/vendor/onboarding/step3' },
    },
    pending_approval: {
      bg: 'from-purple-500/10 to-violet-500/10 border-purple-500/20',
      icon: <Clock size={18} className="text-purple-600" />,
      title: 'Under Review',
      desc: 'Your application is being reviewed by our team. Usually takes 2-4 hours.',
    },
    rejected: {
      bg: 'from-red-500/10 to-rose-500/10 border-red-500/20',
      icon: <AlertCircle size={18} className="text-red-600" />,
      title: 'Application needs changes',
      desc: 'Please review the feedback and resubmit.',
      action: { label: 'View Details', href: '/vendor/onboarding/step3' },
    },
  };

  const config = bannerConfig[onboardingStatus];
  if (!config) return null;

  return (
    <div className={`rounded-2xl border p-4 bg-gradient-to-r ${config.bg} mb-4`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{config.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-body">{config.title}</p>
          <p className="text-xs text-muted mt-0.5">{config.desc}</p>
          
          {/* Progress dots */}
          <div className="flex items-center gap-1.5 mt-2">
            {[1, 2, 3].map(step => (
              <div key={step} className={`h-1.5 rounded-full transition-all ${
                step <= onboardingStep ? 'w-8 bg-emerald-500' : 'w-4 bg-[var(--bg3)]'
              }`} />
            ))}
            <span className="text-[10px] text-faint ml-1">Step {onboardingStep}/3</span>
          </div>

          {config.action && (
            <Link href={config.action.href}
              className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-accent hover:opacity-80">
              {config.action.label} <ArrowRight size={12} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
