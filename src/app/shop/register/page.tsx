'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Store, Check, Users, TrendingUp, Wallet, BarChart3, Upload, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { SEED_CATEGORIES } from '@/lib/seed-data';
import { useStore, VendorRegistration } from '@/store/useStore';
import { vendorService } from '@/lib/firestoreService';
import { SERVICE_AREAS } from '@/lib/serviceAreas';
import toast from 'react-hot-toast';

export default function ShopRegisterPage() {
  const router = useRouter();
  const { addVendorRegistration } = useStore();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [fssaiNumber, setFssaiNumber] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [deliveryAreas, setDeliveryAreas] = useState<string[]>([]);

  const handleSubmit = async () => {
    if (!shopName || !ownerName || !phone || !category || !address || !city) {
      toast.error('Please fill all required fields');
      return;
    }

    const registration: VendorRegistration = {
      id: 'REG-' + Date.now().toString(36).toUpperCase(),
      shopName,
      ownerName,
      phone,
      email,
      category,
      address,
      city,
      pincode,
      gstNumber: gstNumber || undefined,
      fssaiNumber: fssaiNumber || undefined,
      bankAccount: bankAccount || undefined,
      ifscCode: ifscCode || undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // Save to Zustand (instant UI)
    addVendorRegistration(registration);

    // Save to Firestore (persistence + multi-device)
    try {
      const firestoreId = await vendorService.create(registration);
      if (firestoreId) {
        console.log('✅ Vendor saved to Firestore:', firestoreId);
      }
    } catch (err) {
      console.warn('Firestore write failed (demo mode):', err);
    }

    setSubmitted(true);
    toast.success('Registration submitted successfully!');
  };

  if (submitted) {
    return (
      <div className="min-h-screen app-bg py-12 px-4">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-20 h-20 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-emerald-500" />
          </div>
          <h1 className="text-2xl font-black text-body mb-3">Registration Submitted! 🎉</h1>
          <p className="text-muted mb-6">
            Your shop registration is under review. Our admin team will verify your details and approve your shop within 24 hours.
          </p>
          <div className="glass-card p-5 text-left space-y-3 mb-6">
            <h3 className="font-bold text-body text-sm">What happens next?</h3>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#0E9F6E]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-accent">1</span>
              </div>
              <p className="text-xs text-muted">Admin verifies your shop details & documents</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#0E9F6E]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-accent">2</span>
              </div>
              <p className="text-xs text-muted">Once approved, you&apos;ll get login credentials (Phone + Shop ID)</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#0E9F6E]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-accent">3</span>
              </div>
              <p className="text-xs text-muted">Login to your Vendor Dashboard & start receiving orders!</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/" className="btn-secondary flex-1 py-3">Go Home</Link>
            <Link href="/vendor/login" className="btn-primary flex-1 py-3">Vendor Login →</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-bg py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#0E9F6E] to-[#087f58] rounded-2xl flex items-center justify-center shadow-lg">
              <Store size={26} className="text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-body">Register Your <span className="text-accent">Shop</span></h1>
          <p className="text-muted mt-2">Reach thousands of customers in your area</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`w-20 h-1.5 rounded-full ${s <= step ? 'bg-[#0E9F6E]' : 'bg-[var(--bg3)]'}`} />
          ))}
        </div>

        {/* Step 1: Shop Details */}
        {step === 1 && (
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-body mb-6">Shop Details</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted mb-1 block">Shop Name *</label>
                <input value={shopName} onChange={e => setShopName(e.target.value)} placeholder="Enter your shop name" className="input-glass" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted mb-1 block">Owner Name *</label>
                <input value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Enter owner name" className="input-glass" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted mb-1 block">Phone Number *</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Enter phone number" className="input-glass" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted mb-1 block">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter email" className="input-glass" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted mb-2 block">Shop Category *</label>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {SEED_CATEGORIES.slice(0, 12).map((cat) => (
                    <button key={cat.id} type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-3 rounded-xl text-center border transition-all ${category === cat.id ? 'border-[#0E9F6E] bg-[#0E9F6E]/10' : 'surface border-transparent hover:border-[#0E9F6E]/40'}`}>
                      <span className="text-[10px] text-secondary">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => {
                if (!shopName || !ownerName || !phone || !category) { toast.error('Fill all required fields'); return; }
                setStep(2);
              }} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                Next <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Address & Location */}
        {step === 2 && (
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-body mb-6">Shop Address</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted mb-1 block">Full Address *</label>
                <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Shop address with landmark" className="input-glass resize-none" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted mb-1 block">City *</label>
                  <input value={city} onChange={e => setCity(e.target.value)} placeholder="City" className="input-glass" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted mb-1 block">Pincode</label>
                  <input value={pincode} onChange={e => setPincode(e.target.value)} placeholder="Pincode" className="input-glass" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted mb-1 block">GST Number (optional)</label>
                <input value={gstNumber} onChange={e => setGstNumber(e.target.value)} placeholder="GST Number" className="input-glass" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted mb-1 block">FSSAI License (optional)</label>
                <input value={fssaiNumber} onChange={e => setFssaiNumber(e.target.value)} placeholder="FSSAI Number" className="input-glass" />
              </div>

              {/* Delivery Areas Multi-Select */}
              <div>
                <label className="text-xs font-bold text-muted mb-1 block">🚴 Delivery Coverage Areas *</label>
                <p className="text-[10px] text-faint mb-2">Select areas where you can deliver (within 60km corridor)</p>
                <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto p-2 surface rounded-xl">
                  {SERVICE_AREAS.map(area => (
                    <button
                      key={area.id}
                      type="button"
                      onClick={() => {
                        setDeliveryAreas(prev =>
                          prev.includes(area.id)
                            ? prev.filter(a => a !== area.id)
                            : [...prev, area.id]
                        );
                      }}
                      className={`text-left px-2.5 py-2 rounded-lg text-[10px] font-medium border transition-all ${
                        deliveryAreas.includes(area.id)
                          ? 'bg-[#0E9F6E]/10 border-[#0E9F6E]/40 text-accent'
                          : 'border-transparent hover:bg-[var(--card-hover)] text-muted'
                      }`}
                    >
                      {deliveryAreas.includes(area.id) ? '✓ ' : ''}{area.name}
                    </button>
                  ))}
                </div>
                {deliveryAreas.length > 0 && (
                  <p className="text-[10px] text-accent mt-1 font-bold">{deliveryAreas.length} areas selected</p>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1 py-3 flex items-center justify-center gap-2">
                  <ArrowLeft size={16} /> Back
                </button>
                <button onClick={() => {
                  if (!address || !city) { toast.error('Fill address and city'); return; }
                  if (deliveryAreas.length === 0) { toast.error('Select at least 1 delivery area'); return; }
                  setStep(3);
                }} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                  Next <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Bank Details & Submit */}
        {step === 3 && (
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-body mb-6">Bank Details (for payouts)</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted mb-1 block">Bank Account Number</label>
                <input value={bankAccount} onChange={e => setBankAccount(e.target.value)} placeholder="Account number" className="input-glass" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted mb-1 block">IFSC Code</label>
                <input value={ifscCode} onChange={e => setIfscCode(e.target.value)} placeholder="IFSC code" className="input-glass" />
              </div>

              {/* Summary */}
              <div className="surface rounded-xl p-4 space-y-2 mt-4">
                <h3 className="text-sm font-bold text-body">Registration Summary</h3>
                <div className="text-xs space-y-1.5 text-muted">
                  <p><span className="text-faint">Shop:</span> {shopName}</p>
                  <p><span className="text-faint">Owner:</span> {ownerName}</p>
                  <p><span className="text-faint">Phone:</span> {phone}</p>
                  <p><span className="text-faint">Category:</span> {category}</p>
                  <p><span className="text-faint">City:</span> {city}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="btn-secondary flex-1 py-3 flex items-center justify-center gap-2">
                  <ArrowLeft size={16} /> Back
                </button>
                <button onClick={handleSubmit} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                  <Check size={16} /> Submit Registration
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Benefits */}
        <div className="mt-8 grid grid-cols-2 gap-3">
          {[
            { icon: Users, label: '10K+ Customers', desc: 'Reach nearby customers' },
            { icon: TrendingUp, label: 'Grow Sales', desc: '3x revenue growth' },
            { icon: Wallet, label: 'Daily Payouts', desc: 'Get paid every day' },
            { icon: BarChart3, label: 'Analytics', desc: 'Track performance' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="glass-card p-4 text-center">
              <Icon size={20} className="text-accent mx-auto mb-2" />
              <p className="text-xs font-bold text-body">{label}</p>
              <p className="text-[10px] text-faint">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
