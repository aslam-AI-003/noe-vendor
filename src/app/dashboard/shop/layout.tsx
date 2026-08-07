'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ShoppingBag, UtensilsCrossed, BarChart3, Wallet,
  Settings, Star, Bell, ChevronLeft, ChevronRight, Store, Bike, LogOut,
  Menu, X, Volume2, VolumeX, Sun, Moon,
} from 'lucide-react';
import { useOrderAlert } from '@/lib/useOrderAlert';
import { useTheme } from '@/lib/useTheme';
import { AuthGuard, useLogout } from '@/components/auth/AuthGuard';
import { useLanguage } from '@/lib/i18n/index';

const NAV_ITEMS = [
  { href: '/dashboard/shop', labelKey: 'nav_dashboard' as const, icon: LayoutDashboard },
  { href: '/dashboard/shop/orders', labelKey: 'nav_orders' as const, icon: ShoppingBag },
  { href: '/dashboard/shop/menu', labelKey: 'nav_menu' as const, icon: UtensilsCrossed },
  { href: '/dashboard/shop/analytics', labelKey: 'nav_analytics' as const, icon: BarChart3 },
  { href: '/dashboard/shop/payouts', labelKey: 'nav_payouts' as const, icon: Wallet },
  { href: '/dashboard/shop/reviews', labelKey: 'nav_reviews' as const, icon: Star },
  { href: '/dashboard/shop/settings', labelKey: 'nav_settings' as const, icon: Settings },
];

export default function ShopDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { newOrderCount, soundEnabled, toggleSound, testSound, startPolling, stopPolling } = useOrderAlert();
  const { isDark, toggleDarkMode } = useTheme();
  const { logout } = useLogout();
  const { t, lang, toggleLang } = useLanguage();

  // Start polling for new orders when layout mounts
  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  return (
    <AuthGuard>
    <div className="min-h-screen app-bg flex">
      {/* ── Mobile Overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed top-0 left-0 h-screen z-[70] flex flex-col transition-all duration-300 ease-out
        border-r border-subtle bg-section
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:sticky lg:top-0
        ${collapsed ? 'lg:w-[72px]' : 'lg:w-60'}
      `}>
        {/* Logo */}
        <div className="p-4 border-b border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 bg-gradient-to-br from-[#0E9F6E] to-[#087f58] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <Store size={16} className="text-white" />
            </div>
            {!collapsed && (
              <div className="animate-fade-in">
                <h1 className="text-xs font-black text-body leading-tight">Namma Ooru Express</h1>
                <p className="text-[10px] text-accent font-bold">Vendor Panel</p>
              </div>
            )}
          </div>
          {/* Close on mobile */}
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden btn-icon">
            <X size={16} />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard/shop' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200
                  ${isActive
                    ? 'bg-[#0E9F6E]/12 text-accent border border-[#0E9F6E]/20 shadow-sm'
                    : 'text-muted hover:bg-[var(--card-hover)] hover:text-secondary'
                  }
                  ${collapsed ? 'justify-center px-2' : ''}
                `}
                title={collapsed ? t(item.labelKey) : undefined}
              >
                <item.icon size={16} className={isActive ? 'text-accent' : ''} />
                {!collapsed && <span>{t(item.labelKey)}</span>}
                {item.labelKey === 'nav_orders' && !collapsed && (
                  <span className="ml-auto w-5 h-5 bg-[#0E9F6E] text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                    •
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-subtle space-y-2">
          {!collapsed && (
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="w-8 h-8 bg-[#0E9F6E]/10 rounded-full flex items-center justify-center">
                <Store size={14} className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-body truncate">Demo Shop</p>
                <p className="text-[10px] text-faint">Thanjavur</p>
              </div>
            </div>
          )}
          {/* Collapse toggle - desktop only */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-full items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs text-faint hover:text-secondary hover:bg-[var(--card-hover)] transition-all"
          >
            {collapsed ? <ChevronRight size={14} /> : <><ChevronLeft size={14} /> <span>Collapse</span></>}
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 min-h-screen flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-50 header-glass">
          <div className="px-4 lg:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="btn-icon lg:hidden">
                <Menu size={18} />
              </button>
              <div className="hidden lg:block">
                <h2 className="text-sm font-black text-body">
                  {t(NAV_ITEMS.find(i => pathname === i.href || (i.href !== '/dashboard/shop' && pathname.startsWith(i.href)))?.labelKey || 'nav_dashboard')}
                </h2>
                <p className="text-[10px] text-faint">{t('welcome_shop_owner')}</p>
              </div>
              {/* Mobile title */}
              <h2 className="text-sm font-black text-body lg:hidden flex items-center gap-1.5">
                <Store size={14} className="text-accent" />
                {t('vendor_panel')}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {/* Language Toggle */}
              <button
                onClick={toggleLang}
                className="btn-icon relative text-blue-500 hover:text-blue-600 transition-colors"
                title={lang === 'en' ? 'Switch to தமிழ்' : 'Switch to English'}
              >
                <span className="text-[10px] font-black">{lang === 'en' ? 'த' : 'EN'}</span>
              </button>
              {/* Dark/Light Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="btn-icon relative text-[#0E9F6E] hover:text-amber-600 transition-colors"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              {/* Sound Alert Toggle */}
              <button
                onClick={toggleSound}
                className={`btn-icon relative ${soundEnabled ? 'text-emerald-600' : 'text-red-500'}`}
                title={soundEnabled ? 'Sound alerts ON (click to mute)' : 'Sound alerts OFF (click to unmute)'}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              {/* Notifications */}
              <button className="btn-icon relative">
                <Bell size={16} />
                {newOrderCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-pulse">
                    {newOrderCount}
                  </span>
                )}
              </button>
              {/* Logout */}
              <button
                onClick={logout}
                className="btn-icon text-red-400 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
    </AuthGuard>
  );
}
