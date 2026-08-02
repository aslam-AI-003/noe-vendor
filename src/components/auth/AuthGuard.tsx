'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2, Store } from 'lucide-react';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AUTH GUARD — Protects vendor dashboard routes
// Redirects to /vendor/login if not authenticated
// Checks localStorage for vendor profile
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAuth();
  }, [pathname]);

  const checkAuth = () => {
    try {
      const vendorProfile = localStorage.getItem('noe-vendor-profile');
      
      if (!vendorProfile) {
        // No profile found — redirect to login
        console.log('🔒 Auth Guard: No vendor profile found, redirecting to login');
        router.replace('/vendor/login');
        return;
      }

      const profile = JSON.parse(vendorProfile);
      
      // Validate profile has minimum required fields
      if (!profile.id || !profile.phone) {
        console.log('🔒 Auth Guard: Invalid profile data, redirecting to login');
        localStorage.removeItem('noe-vendor-profile');
        router.replace('/vendor/login');
        return;
      }

      // Check if profile is too old (optional: 30 days expiry)
      if (profile.loginAt) {
        const loginTime = new Date(profile.loginAt).getTime();
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        if (Date.now() - loginTime > thirtyDays) {
          console.log('🔒 Auth Guard: Session expired (30 days), redirecting to login');
          localStorage.removeItem('noe-vendor-profile');
          router.replace('/vendor/login');
          return;
        }
      }

      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth Guard error:', error);
      localStorage.removeItem('noe-vendor-profile');
      router.replace('/vendor/login');
    } finally {
      setIsChecking(false);
    }
  };

  // Show loading while checking auth
  if (isChecking) {
    return (
      <div className="min-h-screen app-bg flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/25">
            <Store size={24} className="text-white" />
          </div>
          <div className="flex items-center gap-2">
            <Loader2 size={16} className="text-accent animate-spin" />
            <span className="text-sm font-semibold text-muted">Verifying session...</span>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated — don't render children (redirect happening)
  if (!isAuthenticated) {
    return null;
  }

  // Authenticated — render dashboard
  return <>{children}</>;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LOGOUT UTILITY — Clear session and redirect
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function useLogout() {
  const router = useRouter();

  const logout = () => {
    // Clear all vendor-related data
    localStorage.removeItem('noe-vendor-profile');
    localStorage.removeItem('noe-vendor-token');
    localStorage.removeItem('noe-fcm-token');
    
    // Redirect to login
    router.replace('/vendor/login');
  };

  return { logout };
}
