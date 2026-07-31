'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Store, Phone, Lock, LogIn, ArrowLeft } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { vendorService } from '@/lib/firestoreService';
import toast from 'react-hot-toast';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VENDOR LOGIN — Phone + Shop ID (Password)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function VendorLoginPage() {
  const router = useRouter();
  const setUser = useStore(s => s.setUser);
  const vendorRegistrations = useStore(s => s.vendorRegistrations);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Wait for hydration
  React.useEffect(() => { setMounted(true); }, []);

  const handleLogin = () => {
    if (!phone || !password) {
      toast.error('Enter phone number and Shop ID');
      return;
    }

    setLoading(true);

    // Small delay to ensure store is hydrated
    setTimeout(() => {
      const state = useStore.getState();
      const allVendors = state.vendorRegistrations;
      
      // Try exact match first, then try case-insensitive
      let vendor = allVendors.find(
        r => r.status === 'approved' && r.phone === phone.trim() && r.password === password.trim()
      );
      
      // Fallback: case-insensitive password match
      if (!vendor) {
        vendor = allVendors.find(
          r => r.status === 'approved' && 
               r.phone === phone.trim() && 
               r.password?.toUpperCase() === password.trim().toUpperCase()
        );
      }

      if (vendor) {
        // Set user as vendor with shopId
        setUser({
          uid: vendor.shopId || vendor.id,
          displayName: vendor.ownerName,
          phone: vendor.phone,
          email: vendor.email,
          role: 'vendor',
        });

        toast.success(`Welcome, ${vendor.ownerName}! 🎉`);
        router.push('/dashboard/shop');
      } else {
        toast.error('Invalid credentials. Check phone & Shop ID.');
        console.log('[Login Debug] Entered:', { phone: phone.trim(), password: password.trim() });
        console.log('[Login Debug] Available:', allVendors.map(r => ({ 
          phone: r.phone, password: r.password, status: r.status, shopId: r.shopId 
        })));
      }

      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen app-bg flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted hover:text-secondary mb-6">
          <ArrowLeft size={16} /> Back to home
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20">
            <Store size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-body">Vendor Login</h1>
          <p className="text-sm text-muted mt-1">Login to your shop dashboard</p>
        </div>

        {/* Login Form */}
        <div className="glass-card p-6 space-y-5">
          <div>
            <label className="text-xs font-bold text-muted mb-2 block flex items-center gap-1.5">
              <Phone size={12} /> Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Enter registered phone number"
              className="input-glass text-sm"
              maxLength={15}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-muted mb-2 block flex items-center gap-1.5">
              <Lock size={12} /> Shop ID (Password)
            </label>
            <input
              type="text"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your Shop ID (e.g., NOE-XXXXX)"
              className="input-glass text-sm"
            />
            <p className="text-[10px] text-faint mt-1.5">
              Your Shop ID was provided by admin after approval
            </p>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <>
                <LogIn size={16} /> Login to Dashboard
              </>
            )}
          </button>
        </div>

        {/* Help */}
        <div className="mt-6 text-center space-y-3">
          <p className="text-xs text-faint">
            Don&apos;t have an account?{' '}
            <Link href="/shop/register" className="text-accent font-bold hover:underline">
              Register your shop
            </Link>
          </p>
          <p className="text-xs text-faint">
            <Link href="/support" className="text-muted hover:text-secondary">
              Need help? Contact support
            </Link>
          </p>
        </div>

        {/* Demo credentials hint */}
        <div className="mt-6 surface rounded-xl p-4">
          <p className="text-[10px] font-bold text-faint uppercase mb-2">How to get credentials:</p>
          <ol className="text-[11px] text-muted space-y-1.5 list-decimal list-inside">
            <li>Register your shop at <span className="text-accent font-bold">/shop/register</span></li>
            <li>Admin approves at <span className="text-accent font-bold">/admin/vendors</span></li>
            <li>Use Phone + Shop ID to login here</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
