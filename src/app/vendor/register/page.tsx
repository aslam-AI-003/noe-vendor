'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Phone, Store, Camera, ArrowRight, CheckCircle2, Shield,
  Loader2, X, RefreshCw,
} from 'lucide-react';
import { SHOP_TYPES, ShopType } from '@/types/vendor';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VENDOR REGISTRATION — Progressive Onboarding Step 1
// Dev mode: OTP is 1234 | Production: Will use Firebase Phone Auth
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type Step = 'phone' | 'otp' | 'details';

export default function VendorRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [shopName, setShopName] = useState('');
  const [shopType, setShopType] = useState<ShopType | ''>('');
  const [shopPhoto, setShopPhoto] = useState<string | null>(null);
  const [shopPhotoFile, setShopPhotoFile] = useState<File | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      toast.error('Enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+91${phone}`, purpose: 'vendor_register' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('OTP sent to +91 ' + phone);
        setStep('otp');
        startTimer();
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        toast.error(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      toast.error('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const startTimer = () => {
    setOtpTimer(30);
    const interval = setInterval(() => {
      setOtpTimer(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
    if (newOtp.every(d => d) && newOtp.join('').length === 4) {
      verifyOTP(newOtp.join(''));
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const verifyOTP = async (otpCode: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+91${phone}`, otp: otpCode, purpose: 'vendor_register' }),
      });
      const data = await res.json();
      if (data.success && data.verified) {
        toast.success('Phone verified! ✓');
        setStep('details');
      } else {
        toast.error(data.error || 'Invalid OTP');
        setOtp(['', '', '', '']);
        otpRefs.current[0]?.focus();
      }
    } catch (err) {
      toast.error('Verification failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setShowCamera(true);
    } catch (err) {
      toast.error('Camera access denied.');
      document.getElementById('shop-photo-input')?.click();
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setShopPhoto(dataUrl);
      canvas.toBlob((blob) => {
        if (blob) setShopPhotoFile(new File([blob], 'shop_photo.jpg', { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.8);
    }
    stopCamera();
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setShowCamera(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo too large. Max 5MB.'); return; }
    setShopPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setShopPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRegister = async () => {
    if (!shopName.trim()) { toast.error('Enter your shop name'); return; }
    if (!shopType) { toast.error('Select your shop type'); return; }
    setLoading(true);
    try {
      let shopPhotoUrl = '';
      if (shopPhotoFile) {
        const formData = new FormData();
        formData.append('file', shopPhotoFile);
        formData.append('vendorId', `temp_${phone}`);
        formData.append('fileType', 'shop_photo');
        const uploadRes = await fetch('/api/vendor/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (uploadData.success) shopPhotoUrl = uploadData.url;
      }
      const res = await fetch('/api/vendor/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+91${phone}`, shopName: shopName.trim(), shopType, shopPhotoUrl }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('noe-vendor-profile', JSON.stringify(data.vendor));
        toast.success('Welcome aboard! 🎉');
        router.push('/dashboard/shop');
      } else {
        toast.error(data.error || 'Registration failed');
      }
    } catch (err) {
      toast.error('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen app-bg flex flex-col items-center justify-center px-4 py-8">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="orb orb-yellow w-72 h-72 -top-20 -right-20 opacity-40" />
        <div className="orb orb-orange w-56 h-56 bottom-20 -left-20 opacity-30" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#0E9F6E] to-[#087f58] rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-orange-500/25 mb-4">
            <Store size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-body">
            Namma Ooru <span className="gradient-text">Express</span>
          </h1>
          <p className="text-sm text-muted mt-1">Start selling in under 2 minutes</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {['phone', 'otp', 'details'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                step === s ? 'bg-[#0E9F6E] text-white scale-110 shadow-lg shadow-orange-500/30' :
                ['phone', 'otp', 'details'].indexOf(step) > i ? 'bg-emerald-500 text-white' :
                'bg-[var(--bg3)] text-faint'
              }`}>
                {['phone', 'otp', 'details'].indexOf(step) > i ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              {i < 2 && <div className={`w-8 h-0.5 mx-1 transition-all ${
                ['phone', 'otp', 'details'].indexOf(step) > i ? 'bg-emerald-500' : 'bg-[var(--bg3)]'
              }`} />}
            </div>
          ))}
        </div>

        {step === 'phone' && (
          <div className="glass-card rounded-3xl p-6 space-y-5 animate-scale-in">
            <div className="text-center">
              <h2 className="text-lg font-bold text-body">Enter your phone number</h2>
              <p className="text-xs text-muted mt-1">We&apos;ll send a 4-digit verification code</p>
            </div>
            <div className="flex items-center gap-0 rounded-xl border border-subtle bg-[var(--bg2)] overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-4 text-sm font-bold text-body bg-[var(--bg3)] border-r border-subtle shrink-0">
                <span>+91</span>
              </div>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="98765 43210"
                className="flex-1 bg-transparent text-lg font-bold px-4 py-4 tracking-wider outline-none text-body placeholder:text-faint"
                maxLength={10}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
              />
              <Phone size={18} className="text-faint mr-4 shrink-0" />
            </div>
            <button
              onClick={handleSendOTP}
              disabled={loading || phone.length < 10}
              className="btn-primary w-full py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <>Send OTP <ArrowRight size={16} /></>}
            </button>
            <p className="text-[10px] text-faint text-center">By continuing, you agree to our Terms & Privacy Policy</p>
            <div className="border-t border-subtle pt-4 text-center">
              <p className="text-xs text-muted">Prefer phone assistance?</p>
              <p className="text-sm font-bold text-accent mt-1">📞 Give missed call: 1800-XXX-XXXX</p>
            </div>
            <div className="text-center">
              <Link href="/vendor/login" className="text-xs text-accent font-bold hover:opacity-80">
                Already registered? Login →
              </Link>
            </div>
          </div>
        )}

        {step === 'otp' && (
          <div className="glass-card rounded-3xl p-6 space-y-5 animate-scale-in">
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield size={22} className="text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-body">Verify OTP</h2>
              <p className="text-xs text-muted mt-1">
                Enter the 4-digit code sent to <span className="font-bold text-body">+91 {phone}</span>
              </p>
            </div>
            <div className="flex justify-center gap-3">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { otpRefs.current[i] = el; }}
                  type="tel"
                  value={digit}
                  onChange={e => handleOTPChange(i, e.target.value)}
                  onKeyDown={e => handleOTPKeyDown(i, e)}
                  className="w-14 h-14 text-center text-2xl font-black rounded-xl input-glass focus:border-[#0E9F6E]"
                  maxLength={1}
                  inputMode="numeric"
                />
              ))}
            </div>
            {loading && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted">
                <Loader2 size={14} className="animate-spin" /> Verifying...
              </div>
            )}
            <div className="text-center">
              {otpTimer > 0 ? (
                <p className="text-xs text-faint">Resend in <span className="font-bold text-body">{otpTimer}s</span></p>
              ) : (
                <button onClick={handleSendOTP} className="text-xs text-accent font-bold flex items-center gap-1 mx-auto hover:opacity-80">
                  <RefreshCw size={11} /> Resend OTP
                </button>
              )}
            </div>
            <button onClick={() => { setStep('phone'); setOtp(['', '', '', '']); }}
              className="text-xs text-muted hover:text-body mx-auto block">
              ← Change phone number
            </button>
            <p className="text-[10px] text-faint text-center">💡 Dev mode: Use OTP <span className="font-bold">1234</span></p>
          </div>
        )}

        {step === 'details' && (
          <div className="glass-card rounded-3xl p-6 space-y-5 animate-scale-in">
            <div className="text-center">
              <h2 className="text-lg font-bold text-body">Almost done! 🎉</h2>
              <p className="text-xs text-muted mt-1">Set up your shop in 30 seconds</p>
            </div>
            <div>
              <label className="text-xs font-bold text-muted mb-2 block">Shop Photo</label>
              {shopPhoto ? (
                <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-subtle">
                  <img src={shopPhoto} alt="Shop" className="w-full h-full object-cover" />
                  <button onClick={() => { setShopPhoto(null); setShopPhotoFile(null); }}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button onClick={startCamera}
                  className="w-full h-40 rounded-2xl border-2 border-dashed border-[#0E9F6E]/30 bg-[#0E9F6E]/[0.03] flex flex-col items-center justify-center gap-2 hover:bg-[#0E9F6E]/[0.06] transition-all active:scale-[0.98]">
                  <div className="w-12 h-12 bg-[#0E9F6E]/10 rounded-full flex items-center justify-center">
                    <Camera size={22} className="text-accent" />
                  </div>
                  <p className="text-xs font-bold text-accent">Tap to capture shop photo</p>
                  <p className="text-[10px] text-faint">or click to upload from gallery</p>
                </button>
              )}
              <input id="shop-photo-input" type="file" accept="image/*" capture="environment" onChange={handleFileInput} className="hidden" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted mb-1.5 block">Shop Name *</label>
              <input value={shopName} onChange={e => setShopName(e.target.value)}
                placeholder="e.g., Sri Lakshmi Stores" className="input-glass text-sm py-3.5" autoFocus />
            </div>
            <div>
              <label className="text-xs font-bold text-muted mb-2 block">Shop Type *</label>
              <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
                {SHOP_TYPES.map(type => (
                  <button key={type.id} onClick={() => setShopType(type.id)}
                    className={`p-3 rounded-xl text-center border transition-all active:scale-95 ${
                      shopType === type.id
                        ? 'border-[#0E9F6E] bg-[#0E9F6E]/10 shadow-sm shadow-orange-500/10'
                        : 'border-transparent surface hover:border-[#0E9F6E]/30'
                    }`}>
                    <span className="text-xl block mb-1">{type.icon}</span>
                    <span className="text-[10px] font-bold text-secondary block leading-tight">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleRegister} disabled={loading || !shopName.trim() || !shopType}
              className="btn-primary w-full py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <>Create My Shop <ArrowRight size={16} /></>}
            </button>
            <p className="text-[10px] text-faint text-center">⚡ You&apos;ll get instant access to your dashboard</p>
          </div>
        )}
      </div>

      {showCamera && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col">
          <div className="flex-1 relative">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline autoPlay muted />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-72 h-52 border-2 border-white/40 rounded-2xl" />
            </div>
            <p className="absolute top-6 left-0 right-0 text-center text-white text-sm font-bold">📸 Point at your shop front</p>
          </div>
          <div className="p-6 bg-black flex items-center justify-center gap-6">
            <button onClick={stopCamera} className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <X size={20} />
            </button>
            <button onClick={capturePhoto} className="w-16 h-16 rounded-full bg-white border-4 border-[#0E9F6E] flex items-center justify-center active:scale-90 transition-transform">
              <Camera size={24} className="text-[#0E9F6E]" />
            </button>
            <div className="w-12 h-12" />
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  );
}
