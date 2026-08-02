'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowRight, Shield, Loader2, RefreshCw, LogIn } from 'lucide-react';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VENDOR LOGIN — Phone OTP based authentication
// Dev mode: OTP is 1234 | Production: Will use Firebase Phone Auth
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function VendorLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const startTimer = () => {
    setOtpTimer(30);
    const interval = setInterval(() => {
      setOtpTimer(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

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
        body: JSON.stringify({ phone: `+91${phone}`, purpose: 'vendor_login' }),
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
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpCode: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+91${phone}`, otp: otpCode, purpose: 'vendor_login' }),
      });
      const data = await res.json();

      if (data.success && data.verified) {
        const loginRes = await fetch('/api/vendor/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: `+91${phone}` }),
        });
        const loginData = await loginRes.json();
        if (loginData.success && loginData.vendor) {
          // Add login timestamp for session expiry tracking
          const profileWithLogin = { ...loginData.vendor, loginAt: new Date().toISOString() };
          localStorage.setItem('noe-vendor-profile', JSON.stringify(profileWithLogin));
          toast.success(`Welcome back, ${loginData.vendor.shopName}! 🎉`);
          router.push('/dashboard/shop');
        } else if (loginData.notFound) {
          toast.error('No vendor account found. Please register first.');
          setTimeout(() => router.push('/vendor/register'), 1500);
        } else {
          toast.error(loginData.error || 'Login failed');
        }
      } else {
        toast.error(data.error || 'Invalid OTP');
        setOtp(['', '', '', '']);
        otpRefs.current[0]?.focus();
      }
    } catch (err) {
      toast.error('Login failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen app-bg flex flex-col items-center justify-center px-4 py-8">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="orb orb-yellow w-72 h-72 -top-20 -left-20 opacity-30" />
        <div className="orb orb-orange w-56 h-56 bottom-10 -right-10 opacity-25" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-orange-500/25 mb-4">
            <span className="text-2xl font-black text-white">N</span>
          </div>
          <h1 className="text-xl font-black text-body">
            Namma Ooru <span className="gradient-text">Express</span>
          </h1>
          <p className="text-sm text-muted mt-1">Vendor Partner Login</p>
        </div>

        {step === 'phone' && (
          <div className="glass-card rounded-3xl p-6 space-y-5 animate-scale-in">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <LogIn size={22} className="text-accent" />
              </div>
              <h2 className="text-lg font-bold text-body">Welcome back!</h2>
              <p className="text-xs text-muted mt-1">Enter your registered phone number</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-3 py-4 rounded-xl border border-subtle bg-[var(--bg2)] shrink-0">
                <span className="text-sm font-bold text-body">+91</span>
              </div>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter mobile number"
                className="input-glass text-lg font-bold py-4 tracking-wider flex-1"
                maxLength={10}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
              />
            </div>

            <button
              onClick={handleSendOTP}
              disabled={loading || phone.length < 10}
              className="btn-primary w-full py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <span className="flex items-center justify-center gap-2">Continue <ArrowRight size={16} /></span>}
            </button>

            <div className="text-center space-y-3 pt-2">
              <Link href="/vendor/register" className="text-xs text-accent font-bold hover:opacity-80 block">
                New vendor? Register your shop →
              </Link>
              <div className="border-t border-subtle pt-3">
                <p className="text-[10px] text-faint">Need help? Give missed call</p>
                <p className="text-sm font-bold text-accent">📞 1800-XXX-XXXX</p>
              </div>
            </div>
          </div>
        )}

        {step === 'otp' && (
          <div className="glass-card rounded-3xl p-6 space-y-5 animate-scale-in">
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield size={22} className="text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-body">Enter OTP</h2>
              <p className="text-xs text-muted mt-1">
                Sent to <span className="font-bold text-body">+91 {phone}</span>
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
                  className="w-14 h-14 text-center text-2xl font-black rounded-xl input-glass focus:border-orange-500"
                  maxLength={1}
                  inputMode="numeric"
                />
              ))}
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted">
                <Loader2 size={14} className="animate-spin" />
                Verifying...
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

            <button
              onClick={() => { setStep('phone'); setOtp(['', '', '', '']); }}
              className="text-xs text-muted hover:text-body mx-auto block"
            >
              ← Change phone number
            </button>

            <p className="text-[10px] text-faint text-center">💡 Dev mode: Use OTP <span className="font-bold">1234</span></p>
          </div>
        )}
      </div>
    </div>
  );
}
