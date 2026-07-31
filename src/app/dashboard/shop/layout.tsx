'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ShoppingBag, UtensilsCrossed, BarChart3, Wallet,
  Settings, Star, Bell, ChevronLeft, ChevronRight, Store, Bike, LogOut,
  Menu, X,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard/shop', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/shop/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/dashboard/shop/menu', label: 'Menu Manager', icon: UtensilsCrossed },
  { href: '/dashboard/shop/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/shop/payouts', label: 'Payouts', icon: Wallet },
  { href: '/dashboard/shop/reviews', label: 'Reviews', icon: Star },
  { href: '/dashboard/shop/settings', label: 'Settings', icon: Settings },
];

export default function ShopDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
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
            <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <Store size={16} className="text-white" />
            </div>
            {!collapsed && (
              <div className="animate-fade-in">
                <h1 className="text-xs font-black text-body leading-tight">NammaOoru</h1>
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
                    ? 'bg-orange-500/12 text-accent border border-orange-500/20 shadow-sm'
                    : 'text-muted hover:bg-[var(--card-hover)] hover:text-secondary'
                  }
                  ${collapsed ? 'justify-center px-2' : ''}
                `}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={16} className={isActive ? 'text-accent' : ''} />
                {!collapsed && <span>{item.label}</span>}
                {item.label === 'Orders' && !collapsed && (
                  <span className="ml-auto w-5 h-5 bg-orange-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
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
              <div className="w-8 h-8 bg-orange-500/10 rounded-full flex items-center justify-center">
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
                  {NAV_ITEMS.find(i => pathname === i.href || (i.href !== '/dashboard/shop' && pathname.startsWith(i.href)))?.label || 'Dashboard'}
                </h2>
                <p className="text-[10px] text-faint">Welcome back, Shop Owner</p>
              </div>
              {/* Mobile title */}
              <h2 className="text-sm font-black text-body lg:hidden flex items-center gap-1.5">
                <Store size={14} className="text-accent" />
                Vendor Panel
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {/* Notifications */}
              <button className="btn-icon relative">
                <Bell size={16} />
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                  3
                </span>
              </button>
              {/* Quick links */}
              <Link href="/dashboard/rider" className="hidden sm:flex btn-icon" title="Rider Dashboard">
                <Bike size={16} />
              </Link>
              <Link href="/" className="btn-icon" title="Customer App">
                <LogOut size={15} />
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
