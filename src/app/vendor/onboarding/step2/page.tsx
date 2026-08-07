'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  MapPin, Building2, ArrowRight, Loader2, CreditCard, Smartphone,
  CheckCircle2, Store,
} from 'lucide-react';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ONBOARDING STEP 2 — Address + Bank/UPI
// Saves to Firestore via API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function OnboardingStep2Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [vendorId, setVendorId] = useState<string | null>(null);

  // Address fields
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Thanjavur');
  const [pincode, setPincode] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locatingGPS, setLocatingGPS] = useState(false);

  // Bank/UPI fields
  const [paymentMode, setPaymentMode] = useState<'upi' | 'bank'>('upi');
  const [upiId, setUpiId] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('noe-vendor-profile');
    if (saved) {
      const profile = JSON.parse(saved);
      setVendorId(profile.id);
      // Pre-fill if already saved
      if (profile.address) setAddress(profile.address);
      if (profile.city) setCity(profile.city);
      if (profile.pincode) setPincode(profile.pincode);
      if (profile.lat) setLat(profile.lat);
      if (profile.lng) setLng(profile.lng);
      if (profile.upiId) setUpiId(profile.upiId);
    } else {
      toast.error('Please register first');
      router.push('/vendor/register');
    }
  }, [router]);

  // Get GPS location
  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error('GPS not supported on this device');
      return;
    }
    setLocatingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocatingGPS(false);
        toast.success('Location captured!');
      },
      (err) => {
        setLocatingGPS(false);
        toast.error('Could not get location. Please allow GPS access.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Save to Firestore
  const handleSave = async () => {
    if (!address.trim()) {
      toast.error('Please enter your shop address');
      return;
    }
    if (!pincode || pincode.length !== 6) {
      toast.error('Enter a valid 6-digit pincode');
      return;
    }
    if (paymentMode === 'upi' && !upiId.trim()) {
      toast.error('Enter your UPI ID');
      return;
    }
    if (paymentMode === 'bank' && (!accountNumber || !ifscCode || !accountHolder)) {
      toast.error('Fill all bank details');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/vendor/onboarding/step2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId,
          address: address.trim(),
          landmark: landmark.trim(),
          city,
          pincode,
          lat,
          lng,
          paymentMode,
          upiId: paymentMode === 'upi' ? upiId.trim() : null,
          bankName: paymentMode === 'bank' ? bankName.trim() : null,
          accountNumber: paymentMode === 'bank' ? accountNumber.trim() : null,
          ifscCode: paymentMode === 'bank' ? ifscCode.trim().toUpperCase() : null,
          accountHolder: paymentMode === 'bank' ? accountHolder.trim() : null,
        }),
      });
      const data = await res.json();

      if (data.success) {
        // Update localStorage
        const saved = localStorage.getItem('noe-vendor-profile');
        if (saved) {
          const profile = JSON.parse(saved);
          const updated = {
            ...profile,
            address: address.trim(),
            landmark: landmark.trim(),
            city,
            pincode,
            lat,
            lng,
            upiId: paymentMode === 'upi' ? upiId.trim() : null,
            bankAccount: paymentMode === 'bank' ? `${bankName} ****${accountNumber.slice(-4)}` : null,
            onboardingStep: 2,
          };
          localStorage.setItem('noe-vendor-profile', JSON.stringify(updated));
        }
        toast.success('Address & payment details saved! ✅');
        router.push('/vendor/onboarding/step3');
      } else {
        toast.error(data.error || 'Failed to save');
      }
    } catch (err) {
      toast.error('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen app-bg flex flex-col items-center px-4 py-8">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="orb orb-yellow w-72 h-72 -top-20 -right-20 opacity-30" />
        <div className="orb orb-orange w-56 h-56 bottom-20 -left-20 opacity-25" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-[#0E9F6E] to-[#087f58] rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-orange-500/25 mb-3">
            <Store size={24} className="text-white" />
          </div>
          <h1 className="text-lg font-black text-body">
            Namma Ooru <span className="text-accent">Express</span>
          </h1>
          <p className="text-xs text-muted mt-1">Step 2 of 3 — Address & Payment</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                s < 2 ? 'bg-emerald-500 text-white' :
                s === 2 ? 'bg-[#0E9F6E] text-white scale-110 shadow-lg shadow-orange-500/30' :
                'bg-[var(--bg3)] text-faint'
              }`}>
                {s < 2 ? <CheckCircle2 size={14} /> : s}
              </div>
              {s < 3 && <div className={`w-8 h-0.5 mx-1 ${s < 2 ? 'bg-emerald-500' : 'bg-[var(--bg3)]'}`} />}
            </div>
          ))}
        </div>

        {/* ━━━ ADDRESS SECTION ━━━ */}
        <div className="glass-card rounded-3xl p-6 space-y-4 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={16} className="text-accent" />
            <h2 className="text-sm font-black text-body">Shop Address</h2>
          </div>

          <div>
            <label className="text-[10px] font-bold text-faint uppercase mb-1 block">Full Address *</label>
            <textarea
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="e.g., 12, East Main Street, near temple..."
              className="input-glass text-sm py-3 h-20 resize-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-faint uppercase mb-1 block">Landmark</label>
            <input
              value={landmark}
              onChange={e => setLandmark(e.target.value)}
              placeholder="Near bus stand, opposite to..."
              className="input-glass text-sm py-3"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-faint uppercase mb-1 block">City</label>
              <input
                value={city}
                onChange={e => setCity(e.target.value)}
                className="input-glass text-sm py-3"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-faint uppercase mb-1 block">Pincode *</label>
              <input
                type="tel"
                value={pincode}
                onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="613001"
                className="input-glass text-sm py-3"
                maxLength={6}
              />
            </div>
          </div>

          {/* GPS Location */}
          <div className="flex items-center gap-3 p-3 surface rounded-xl">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              lat ? 'bg-emerald-500/10' : 'bg-[#0E9F6E]/10'
            }`}>
              <MapPin size={16} className={lat ? 'text-emerald-600' : 'text-accent'} />
            </div>
            <div className="flex-1">
              {lat ? (
                <>
                  <p className="text-xs font-bold text-body">Location Set ✓</p>
                  <p className="text-[10px] text-faint font-mono">{lat.toFixed(4)}, {lng?.toFixed(4)}</p>
                </>
              ) : (
                <p className="text-xs text-muted">GPS location not set</p>
              )}
            </div>
            <button
              onClick={getLocation}
              disabled={locatingGPS}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#0E9F6E]/10 text-accent border border-[#0E9F6E]/20 hover:bg-[#0E9F6E]/15 transition-all disabled:opacity-50"
            >
              {locatingGPS ? <Loader2 size={12} className="animate-spin" /> : lat ? 'Update' : 'Get GPS'}
            </button>
          </div>
        </div>

        {/* ━━━ PAYMENT SECTION ━━━ */}
        <div className="glass-card rounded-3xl p-6 space-y-4 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={16} className="text-accent" />
            <h2 className="text-sm font-black text-body">Payment Details</h2>
          </div>
          <p className="text-[10px] text-faint">Where should we send your earnings?</p>

          {/* Toggle UPI / Bank */}
          <div className="flex gap-2 p-1 surface rounded-xl">
            <button
              onClick={() => setPaymentMode('upi')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                paymentMode === 'upi' ? 'bg-[#0E9F6E] text-white shadow-sm' : 'text-muted'
              }`}
            >
              <Smartphone size={13} /> UPI
            </button>
            <button
              onClick={() => setPaymentMode('bank')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                paymentMode === 'bank' ? 'bg-[#0E9F6E] text-white shadow-sm' : 'text-muted'
              }`}
            >
              <CreditCard size={13} /> Bank Account
            </button>
          </div>

          {/* UPI Mode */}
          {paymentMode === 'upi' && (
            <div className="space-y-3 animate-fade-in">
              <div>
                <label className="text-[10px] font-bold text-faint uppercase mb-1 block">UPI ID *</label>
                <input
                  value={upiId}
                  onChange={e => setUpiId(e.target.value)}
                  placeholder="shopname@upi or 9876543210@paytm"
                  className="input-glass text-sm py-3"
                />
              </div>
              <p className="text-[10px] text-faint">Accepts: Google Pay, PhonePe, Paytm, etc.</p>
            </div>
          )}

          {/* Bank Account Mode */}
          {paymentMode === 'bank' && (
            <div className="space-y-3 animate-fade-in">
              <div>
                <label className="text-[10px] font-bold text-faint uppercase mb-1 block">Account Holder Name *</label>
                <input
                  value={accountHolder}
                  onChange={e => setAccountHolder(e.target.value)}
                  placeholder="As on passbook"
                  className="input-glass text-sm py-3"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-faint uppercase mb-1 block">Bank Name</label>
                <input
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  placeholder="e.g., HDFC Bank"
                  className="input-glass text-sm py-3"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-faint uppercase mb-1 block">Account Number *</label>
                <input
                  type="tel"
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter account number"
                  className="input-glass text-sm py-3"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-faint uppercase mb-1 block">IFSC Code *</label>
                <input
                  value={ifscCode}
                  onChange={e => setIfscCode(e.target.value.toUpperCase().slice(0, 11))}
                  placeholder="e.g., HDFC0001234"
                  className="input-glass text-sm py-3 uppercase"
                  maxLength={11}
                />
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn-primary w-full py-4 text-base disabled:opacity-50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <>Save & Continue <ArrowRight size={16} /></>}
        </button>

        <button
          onClick={() => router.push('/dashboard/shop')}
          className="text-xs text-muted hover:text-body mx-auto block mt-4"
        >
          Skip for now →
        </button>
      </div>
    </div>
  );
}
