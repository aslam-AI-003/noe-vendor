'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  FileText, ArrowRight, Loader2, CheckCircle2, Store, Upload,
  Camera, X, Shield, Rocket,
} from 'lucide-react';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ONBOARDING STEP 3 — KYC Document Upload (Aadhaar)
// Uploads to Firebase Storage, saves URL to Firestore
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function OnboardingStep3Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [shopName, setShopName] = useState('');

  // Document states
  const [aadhaarFront, setAadhaarFront] = useState<string | null>(null);
  const [aadhaarFrontFile, setAadhaarFrontFile] = useState<File | null>(null);
  const [bankProof, setBankProof] = useState<string | null>(null);
  const [bankProofFile, setBankProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('noe-vendor-profile');
    if (saved) {
      const profile = JSON.parse(saved);
      setVendorId(profile.id);
      setShopName(profile.shopName || '');
      if (profile.aadhaarUrl) {
        setAadhaarFront(profile.aadhaarUrl);
      }
      if (profile.bankDocUrl) {
        setBankProof(profile.bankDocUrl);
      }
    } else {
      toast.error('Please register first');
      router.push('/vendor/register');
    }
  }, [router]);

  const handleBankProofInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Max 5MB.');
      return;
    }
    setBankProofFile(file);
    const reader = new FileReader();
    reader.onload = () => setBankProof(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Max 5MB.');
      return;
    }
    setAadhaarFrontFile(file);
    const reader = new FileReader();
    reader.onload = () => setAadhaarFront(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!aadhaarFrontFile && !aadhaarFront) {
      toast.error('Please upload your Aadhaar card');
      return;
    }
    if (!bankProofFile && !bankProof) {
      toast.error('Please upload bank proof (cancelled cheque/passbook)');
      return;
    }

    setLoading(true);
    try {
      let aadhaarUrl = aadhaarFront;
      let bankDocUrl = bankProof;

      // Upload Aadhaar to Firebase Storage if new file
      if (aadhaarFrontFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', aadhaarFrontFile);
        formData.append('vendorId', vendorId || '');
        formData.append('fileType', 'aadhaar');

        const uploadRes = await fetch('/api/vendor/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();

        if (uploadData.success) {
          aadhaarUrl = uploadData.url;
        } else {
          toast.error('Aadhaar upload failed: ' + uploadData.error);
          setLoading(false);
          setUploading(false);
          return;
        }
      }

      // Upload Bank Proof to Firebase Storage if new file
      if (bankProofFile) {
        const formData = new FormData();
        formData.append('file', bankProofFile);
        formData.append('vendorId', vendorId || '');
        formData.append('fileType', 'bank_proof');

        const uploadRes = await fetch('/api/vendor/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();

        if (uploadData.success) {
          bankDocUrl = uploadData.url;
        } else {
          toast.error('Bank proof upload failed: ' + uploadData.error);
          setLoading(false);
          setUploading(false);
          return;
        }
      }
      setUploading(false);

      // Save BOTH to Firestore via API
      const res = await fetch('/api/vendor/onboarding/step3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId,
          aadhaarUrl,
          bankDocUrl,
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
            aadhaarUrl,
            bankDocUrl,
            onboardingStep: 3,
          };
          localStorage.setItem('noe-vendor-profile', JSON.stringify(updated));
        }
        setSubmitted(true);
        toast.success('Documents saved! 🎉');
      } else {
        toast.error(data.error || 'Failed to save');
      }
    } catch (err) {
      toast.error('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // ━━━ SUCCESS STATE ━━━
  if (submitted) {
    return (
      <div className="min-h-screen app-bg flex flex-col items-center justify-center px-4 py-8">
        <div className="relative w-full max-w-md text-center">
          <div className="glass-card rounded-3xl p-8 space-y-5">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
              <Rocket size={36} className="text-emerald-600" />
            </div>
            <h1 className="text-2xl font-black text-body">All Done! 🎉</h1>
            <p className="text-sm text-muted">
              Your shop <span className="font-bold text-body">{shopName}</span> is now submitted for review.
            </p>
            <div className="surface rounded-xl p-4 text-left space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span className="text-xs text-body">Phone verified</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span className="text-xs text-body">Address & payment saved</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span className="text-xs text-body">ID proof uploaded</span>
              </div>
            </div>
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
              <p className="text-xs font-bold text-purple-700 dark:text-purple-400">⏳ Under Review</p>
              <p className="text-[10px] text-muted mt-1">Admin will verify within 2-4 hours. You'll get a notification once approved.</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/shop')}
              className="btn-primary w-full py-4 text-base"
            >
              Go to Dashboard <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-orange-500/25 mb-3">
            <Store size={24} className="text-white" />
          </div>
          <h1 className="text-lg font-black text-body">
            Namma Ooru <span className="text-accent">Express</span>
          </h1>
          <p className="text-xs text-muted mt-1">Step 3 of 3 — ID Verification</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                s < 3 ? 'bg-emerald-500 text-white' :
                s === 3 ? 'bg-orange-500 text-white scale-110 shadow-lg shadow-orange-500/30' :
                'bg-[var(--bg3)] text-faint'
              }`}>
                {s < 3 ? <CheckCircle2 size={14} /> : s}
              </div>
              {s < 3 && <div className={`w-8 h-0.5 mx-1 bg-emerald-500`} />}
            </div>
          ))}
        </div>

        {/* ━━━ KYC UPLOAD SECTION ━━━ */}
        <div className="glass-card rounded-3xl p-6 space-y-5 mb-6">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-accent" />
            <h2 className="text-sm font-black text-body">ID Verification</h2>
          </div>
          <p className="text-[10px] text-faint">Upload your Aadhaar card for identity verification. This is required for all vendors.</p>

          {/* Aadhaar Upload */}
          <div>
            <label className="text-[10px] font-bold text-faint uppercase mb-2 block">Aadhaar Card (Front) *</label>
            {aadhaarFront ? (
              <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-emerald-500/30 bg-emerald-500/[0.02]">
                <img src={aadhaarFront} alt="Aadhaar" className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button onClick={() => { setAadhaarFront(null); setAadhaarFrontFile(null); }}
                    className="w-7 h-7 bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center">
                    <X size={14} />
                  </button>
                </div>
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-emerald-500/90 rounded-lg">
                  <p className="text-[10px] font-bold text-white flex items-center gap-1">
                    <CheckCircle2 size={10} /> Uploaded
                  </p>
                </div>
              </div>
            ) : (
              <label htmlFor="aadhaar-input" className="block">
                <div className="w-full h-44 rounded-2xl border-2 border-dashed border-orange-500/30 bg-orange-500/[0.03] flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-orange-500/[0.06] transition-all active:scale-[0.98]">
                  <div className="w-14 h-14 bg-orange-500/10 rounded-full flex items-center justify-center">
                    <Upload size={24} className="text-accent" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-accent">Tap to upload Aadhaar</p>
                    <p className="text-[10px] text-faint mt-0.5">JPEG, PNG or PDF • Max 5MB</p>
                  </div>
                </div>
              </label>
            )}
            <input
              id="aadhaar-input"
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>

          {/* Bank Proof Upload */}
          <div>
            <label className="text-[10px] font-bold text-faint uppercase mb-2 block">Bank Proof (Cancelled Cheque / Passbook) *</label>
            {bankProof ? (
              <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-emerald-500/30 bg-emerald-500/[0.02]">
                <img src={bankProof} alt="Bank Proof" className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button onClick={() => { setBankProof(null); setBankProofFile(null); }}
                    className="w-7 h-7 bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center">
                    <X size={14} />
                  </button>
                </div>
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-emerald-500/90 rounded-lg">
                  <p className="text-[10px] font-bold text-white flex items-center gap-1">
                    <CheckCircle2 size={10} /> Uploaded
                  </p>
                </div>
              </div>
            ) : (
              <label htmlFor="bankproof-input" className="block">
                <div className="w-full h-36 rounded-2xl border-2 border-dashed border-blue-500/30 bg-blue-500/[0.03] flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-blue-500/[0.06] transition-all active:scale-[0.98]">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <Upload size={20} className="text-blue-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-blue-600">Tap to upload Bank Proof</p>
                    <p className="text-[10px] text-faint mt-0.5">Cancelled cheque or passbook front page</p>
                  </div>
                </div>
              </label>
            )}
            <input
              id="bankproof-input"
              type="file"
              accept="image/*,application/pdf"
              onChange={handleBankProofInput}
              className="hidden"
            />
          </div>

          {/* Info note */}
          <div className="surface rounded-xl p-3 flex items-start gap-2">
            <FileText size={14} className="text-faint shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] text-muted font-bold">Why do we need this?</p>
              <p className="text-[10px] text-faint mt-0.5">
                Government regulations require identity verification for all food delivery partners. Your data is encrypted and secure.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading || !aadhaarFront}
          className="btn-primary w-full py-4 text-base disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              {uploading ? 'Uploading...' : 'Submitting...'}
            </span>
          ) : (
            <>Submit for Review <Rocket size={16} /></>
          )}
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
