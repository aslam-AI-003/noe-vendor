'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useLanguage } from '@/lib/i18n/index';
import {
  CheckCircle2, Circle, Camera, MapPin, Building2, FileText,
  Clock, ArrowRight, Store, Eye, Rocket, ChefHat, Sparkles,
  Shield, AlertCircle, Loader2,
} from 'lucide-react';
import { VendorProfile, VendorOnboardingStatus } from '@/types/vendor';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SETUP MODE DASHBOARD
// Shows checklist + customer preview for vendors not yet approved
// Option C + D: Real productive tasks + Preview of how they look
// Reads REAL-TIME data from Firestore (admin status changes reflect instantly)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface SetupStep {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
  href?: string;
  required: boolean;
}

export default function SetupModeDashboard() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Partial<VendorProfile> | null>(null);
  const [menuCount, setMenuCount] = useState(0);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [hasHours, setHasHours] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // First load from localStorage for instant display
    const saved = localStorage.getItem('noe-vendor-profile');
    if (saved) {
      const localProfile = JSON.parse(saved);
      setProfile(localProfile);

      // Check if hours are set (operatingHours field in profile)
      if ((localProfile as any).operatingHours || (localProfile as any).businessHours) {
        setHasHours(true);
      }

      // Fetch menu items
      if (localProfile.id) {
        fetch(`/api/vendor/menu?vendorId=${localProfile.id}`)
          .then(r => r.json())
          .then(data => {
            if (data.success && (data.items || data.products)) {
              const items = data.items || data.products;
              setMenuCount(items.length);
              setMenuItems(items.slice(0, 5)); // Show first 5 in preview
            }
          })
          .catch(() => {});
      }

      // Then listen to Firestore for real-time updates (admin approve/reject)
      if (db && localProfile.id) {
        const unsubscribe = onSnapshot(doc(db, 'vendors', localProfile.id), (docSnap) => {
          if (docSnap.exists()) {
            const rawData = docSnap.data();
            const firestoreData = { id: docSnap.id, ...rawData } as Partial<VendorProfile>;

            // COMPATIBILITY: Admin panel writes 'status' field, vendor app uses 'onboardingStatus'
            // Sync them: if admin sets status='approved' but onboardingStatus is still 'pending_approval'
            if (rawData.status === 'approved' && rawData.onboardingStatus !== 'approved') {
              firestoreData.onboardingStatus = 'approved' as VendorOnboardingStatus;
            }
            if (rawData.status === 'rejected' && rawData.onboardingStatus !== 'rejected') {
              firestoreData.onboardingStatus = 'rejected' as VendorOnboardingStatus;
              firestoreData.rejectionReason = rawData.rejectionReason;
            }

            setProfile(firestoreData);
            // Check hours from Firestore data too
            if ((firestoreData as any).operatingHours || (firestoreData as any).businessHours) {
              setHasHours(true);
            }
            // Sync back to localStorage
            localStorage.setItem('noe-vendor-profile', JSON.stringify(firestoreData));
          }
        });
        return () => unsubscribe();
      }
    }
  }, []);

  // Submit for review handler
  const handleSubmitForReview = async () => {
    if (!profile?.id) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/vendor/onboarding/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId: profile.id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Submitted for review! 🎉');
        // Update local state
        const updated = { ...profile, onboardingStatus: 'pending_approval' as VendorOnboardingStatus };
        setProfile(updated);
        localStorage.setItem('noe-vendor-profile', JSON.stringify(updated));
      } else {
        toast.error(data.error || 'Failed to submit');
      }
    } catch (err) {
      toast.error('Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!profile) return null;

  // Calculate completion based on what's filled
  const steps: SetupStep[] = [
    {
      id: 'phone',
      label: t('phone_verified'),
      description: t('otp_complete'),
      icon: Shield,
      completed: true,
      required: true,
    },
    {
      id: 'photo',
      label: t('shop_photo'),
      description: t('upload_shop_photo'),
      icon: Camera,
      completed: !!profile.shopPhotoUrl,
      href: '/vendor/onboarding/step1',
      required: true,
    },
    {
      id: 'name',
      label: t('shop_name_type'),
      description: t('basic_info'),
      icon: Store,
      completed: !!profile.shopName && !!profile.shopType,
      required: true,
    },
    {
      id: 'menu',
      label: t('add_menu_items'),
      description: `${t('add_5_items')} (${menuCount}/5)`,
      icon: ChefHat,
      completed: menuCount >= 5,
      href: '/dashboard/shop/menu',
      required: true,
    },
    {
      id: 'hours',
      label: t('set_opening_hours'),
      description: t('when_open'),
      icon: Clock,
      completed: hasHours,
      href: '/dashboard/shop/settings',
      required: true,
    },
    {
      id: 'address',
      label: t('shop_address'),
      description: t('add_address_map'),
      icon: MapPin,
      completed: !!profile.address,
      href: '/vendor/onboarding/step2',
      required: true,
    },
    {
      id: 'bank',
      label: t('bank_details'),
      description: t('add_bank_upi'),
      icon: Building2,
      completed: !!profile.upiId || !!(profile as any).accountNumber || !!profile.bankAccount,
      href: '/vendor/onboarding/step2',
      required: true,
    },
    {
      id: 'kyc',
      label: t('id_verification'),
      description: t('upload_aadhaar'),
      icon: FileText,
      completed: !!profile.aadhaarUrl,
      href: '/vendor/onboarding/step3',
      required: true,
    },
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const totalSteps = steps.length;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);
  const allDone = completedCount === totalSteps;

  // Status-specific banners
  const statusBanner = () => {
    switch (profile.onboardingStatus) {
      case 'pending_approval':
        return (
          <div className="rounded-2xl border border-purple-500/20 p-4 bg-gradient-to-r from-purple-500/5 to-violet-500/5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center shrink-0">
                <Clock size={18} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-body">{t('under_review')}</p>
                <p className="text-xs text-muted mt-0.5">{t('under_review_desc')}</p>
                <p className="text-[10px] text-faint mt-1">{t('submitted_label')}: {profile.updatedAt ? new Date(profile.updatedAt).toLocaleString('en-IN') : 'Invalid Date'}</p>
              </div>
            </div>
          </div>
        );
      case 'rejected':
        return (
          <div className="rounded-2xl border border-red-500/20 p-4 bg-gradient-to-r from-red-500/5 to-rose-500/5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center shrink-0">
                <AlertCircle size={18} className="text-red-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-body">{t('changes_required')}</p>
                <p className="text-xs text-muted mt-0.5">{profile.rejectionReason || ''}</p>
                <p className="text-[10px] text-accent font-bold mt-2 cursor-pointer">{t('fix_resubmit')}</p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">

      {/* ── Setup Mode Header ── */}
      <div className="relative overflow-hidden rounded-2xl p-5 lg:p-6 border border-amber-500/15 bg-gradient-to-br from-amber-500/[0.04] to-orange-500/[0.03]">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                {t('setup_mode')}
              </span>
            </div>
            <h1 className="text-xl font-black text-body mt-2">
              Hey, {profile.shopName || 'Shop Owner'}! 👋
            </h1>
            <p className="text-sm text-muted mt-0.5">
              {t('complete_setup')}
            </p>
          </div>
          <div className="text-right">
            <div className="w-16 h-16 relative">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="var(--bg3)" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="#F97316" strokeWidth="3"
                  strokeDasharray={`${progressPercent}, 100`}
                  strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-black text-accent">{progressPercent}%</span>
              </div>
            </div>
          </div>
        </div>
        {/* Decorative */}
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-orange-500 opacity-[0.02]" />
      </div>

      {/* Status Banner (if pending/rejected) */}
      {statusBanner()}

      {/* ── Setup Checklist ── */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-accent" />
            <h2 className="text-sm font-black text-body">{t('shop_readiness')}</h2>
          </div>
          <span className="text-xs text-muted font-bold">{completedCount}/{totalSteps} {t('done_label')}</span>
        </div>

        <div className="divide-y divide-subtle">
          {steps.map((step, index) => (
            <div key={step.id} className={`px-4 py-3.5 flex items-center gap-3 transition-colors ${
              step.completed ? 'bg-emerald-500/[0.02]' : 'hover:bg-[var(--card-hover)]'
            }`}>
              {/* Status icon */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                step.completed
                  ? 'bg-emerald-500/15'
                  : 'bg-[var(--bg3)]'
              }`}>
                {step.completed ? (
                  <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <step.icon size={14} className="text-faint" />
                )}
              </div>

              {/* Label */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${step.completed ? 'text-muted line-through' : 'text-body'}`}>
                  {step.label}
                </p>
                <p className="text-[10px] text-faint">{step.description}</p>
              </div>

              {/* Action */}
              {!step.completed && step.href && (
                <Link href={step.href}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-orange-500/10 text-accent border border-orange-500/20 hover:bg-orange-500/15 active:scale-95 transition-all shrink-0">
                  {t('do_it')}
                </Link>
              )}
              {step.completed && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{t('done_check')}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Submit for Review Button ── */}
      {profile.onboardingStatus !== 'pending_approval' && (
        <div className={`rounded-2xl p-5 text-center border ${
          allDone
            ? 'border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 to-green-500/5'
            : 'border-subtle bg-[var(--bg2)]'
        }`}>
          {allDone ? (
            <>
              <Rocket size={28} className="text-emerald-600 mx-auto mb-2" />
              <h3 className="text-base font-black text-body">{t('all_set_live')}</h3>
              <p className="text-xs text-muted mt-1">{t('submit_approval_hint')}</p>
              <button
                onClick={handleSubmitForReview}
                disabled={submitting}
                className="btn-primary mt-4 px-8 py-3 disabled:opacity-50"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
                {submitting ? t('loading') : t('submit_for_review')}
              </button>
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-[var(--bg3)] rounded-full flex items-center justify-center mx-auto mb-2">
                <Rocket size={20} className="text-faint" />
              </div>
              <h3 className="text-sm font-bold text-muted">{t('complete_steps_live')}</h3>
              <p className="text-xs text-faint mt-1">{totalSteps - completedCount} {t('steps_remaining')}</p>
            </>
          )}
        </div>
      )}

      {/* ── Customer Preview (Option D) ── */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-subtle flex items-center gap-2">
          <Eye size={16} className="text-accent" />
          <h2 className="text-sm font-black text-body">{t('customer_preview')}</h2>
          <span className="text-[10px] text-faint ml-auto">{t('how_customers_see')}</span>
        </div>

        <div className="p-4">
          {/* Mini preview card */}
          <div className="rounded-xl border border-subtle p-4 bg-[var(--bg2)]">
            <div className="flex gap-3">
              {/* Shop image */}
              <div className="w-20 h-20 rounded-xl bg-[var(--bg3)] overflow-hidden shrink-0 flex items-center justify-center">
                {profile.shopPhotoUrl ? (
                  <img src={profile.shopPhotoUrl} alt="Shop" className="w-full h-full object-cover" />
                ) : (
                  <Camera size={20} className="text-faint" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-black text-body truncate">
                  {profile.shopName || 'Your Shop Name'}
                </h3>
                <p className="text-[10px] text-muted mt-0.5 capitalize">
                  {profile.shopType?.replace('_', ' ') || 'Shop Type'}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-bold text-emerald-600">● Open</span>
                  <span className="text-[10px] text-faint">• 1.2 km</span>
                  <span className="text-[10px] text-faint">• ⭐ New</span>
                </div>
                <div className="mt-2 flex gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-[9px] font-bold text-accent">Free Delivery</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-[9px] font-bold text-emerald-700 dark:text-emerald-400">20 min</span>
                </div>
              </div>
            </div>

            {/* Menu preview */}
            <div className="mt-4 pt-3 border-t border-subtle">
              <p className="text-[10px] font-bold text-muted mb-2">{t('menu_preview')} {menuCount > 0 && <span className="text-faint">({menuCount} items)</span>}</p>
              <div className="space-y-1.5">
                {menuItems.length > 0 ? (
                  <>
                    {menuItems.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-sm border ${item.isVeg !== false ? 'border-emerald-500 bg-emerald-500/20' : 'border-red-500 bg-red-500/20'}`}>
                            <span className={`block w-1.5 h-1.5 rounded-full m-[2px] ${item.isVeg !== false ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          </span>
                          <span className="text-xs text-body font-medium">{item.name}</span>
                        </div>
                        <span className="text-xs font-bold text-accent">₹{item.discountPrice || item.price}</span>
                      </div>
                    ))}
                    {menuCount > 5 && (
                      <p className="text-[10px] text-faint text-center pt-1">+{menuCount - 5} more items</p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-faint italic">{t('no_menu_yet')} <Link href="/dashboard/shop/menu" className="text-accent font-bold">{t('add_items_link')}</Link></p>
                )}
              </div>
            </div>
          </div>

          <p className="text-[10px] text-faint text-center mt-3">
            {t('add_more_hint')}
          </p>
        </div>
      </div>

      {/* ── Quick Tips ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="surface rounded-xl p-4">
          <p className="text-xs font-bold text-body">{t('pro_tip')}</p>
          <p className="text-[11px] text-muted mt-1">{t('pro_tip_desc')}</p>
        </div>
        <div className="surface rounded-xl p-4">
          <p className="text-xs font-bold text-body">{t('better_photos')}</p>
          <p className="text-[11px] text-muted mt-1">{t('better_photos_desc')}</p>
        </div>
      </div>
    </div>
  );
}
