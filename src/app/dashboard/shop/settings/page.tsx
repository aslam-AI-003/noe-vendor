'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Store, Clock, MapPin, Phone, Mail, Globe, Camera,
  Save, ToggleLeft, ToggleRight, Calendar, Shield, FileText,
} from 'lucide-react';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SHOP SETTINGS — Profile, Hours, Delivery, KYC
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState<'profile' | 'hours' | 'delivery' | 'documents'>('profile');
  const [holidayMode, setHolidayMode] = useState(false);

  const [shopData, setShopData] = useState({
    name: 'Anbu Mess & Restaurant',
    nameTamil: 'அன்பு மெஸ்',
    phone: '9876543210',
    email: 'anbu.mess@gmail.com',
    address: '12, East Main Street, Thanjavur',
    city: 'Thanjavur',
    pincode: '613001',
    gst: '33AABCT1234Z1Z5',
    fssai: '12345678901234',
    description: 'Traditional South Indian restaurant serving authentic Thanjavur-style meals, biryani, and filter coffee since 1998.',
    minOrder: 99,
    deliveryRadius: 5,
    prepTime: 20,
  });

  const [hours, setHours] = useState(
    DAYS.map(day => ({ day, open: '08:00', close: '22:00', closed: day === 'Sunday' }))
  );

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div className="space-y-4 animate-pulse"><div className="h-16 rounded-2xl skeleton" /><div className="h-64 rounded-2xl skeleton" /></div>;

  const sections = [
    { id: 'profile' as const, label: 'Shop Profile', icon: Store },
    { id: 'hours' as const, label: 'Operating Hours', icon: Clock },
    { id: 'delivery' as const, label: 'Delivery Settings', icon: MapPin },
    { id: 'documents' as const, label: 'Documents & KYC', icon: Shield },
  ];

  const handleSave = () => {
    toast.success('Settings saved successfully!');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-body">Shop Settings</h1>
          <p className="text-sm text-faint">Manage your shop profile and preferences</p>
        </div>
        <button onClick={handleSave} className="btn-primary text-xs px-4 py-2.5 flex items-center gap-1.5">
          <Save size={13} /> Save Changes
        </button>
      </div>

      {/* ── Section Tabs ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {sections.map(sec => (
          <button key={sec.id} onClick={() => setActiveSection(sec.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeSection === sec.id
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'glass-sm text-muted hover:text-secondary'
            }`}>
            <sec.icon size={13} />
            {sec.label}
          </button>
        ))}
      </div>

      {/* ── PROFILE SECTION ── */}
      {activeSection === 'profile' && (
        <div className="space-y-4">
          {/* Banner & Logo */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-black text-body mb-4">Shop Identity</h3>
            <div className="flex gap-4 items-start">
              <div className="w-20 h-20 rounded-2xl bg-orange-500/10 flex items-center justify-center border-2 border-dashed border-orange-500/30 cursor-pointer hover:bg-orange-500/15 transition-colors">
                <Camera size={20} className="text-accent" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-faint uppercase mb-1">Shop Name</label>
                  <input value={shopData.name} onChange={e => setShopData({...shopData, name: e.target.value})}
                    className="input-glass text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-faint uppercase mb-1">Tamil Name</label>
                  <input value={shopData.nameTamil} onChange={e => setShopData({...shopData, nameTamil: e.target.value})}
                    className="input-glass text-xs" />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-black text-body mb-3">Contact Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-faint uppercase mb-1">Phone</label>
                <div className="relative">
                  <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
                  <input value={shopData.phone} onChange={e => setShopData({...shopData, phone: e.target.value})}
                    className="input-glass text-xs pl-9" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-faint uppercase mb-1">Email</label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
                  <input value={shopData.email} onChange={e => setShopData({...shopData, email: e.target.value})}
                    className="input-glass text-xs pl-9" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-faint uppercase mb-1">Address</label>
              <input value={shopData.address} onChange={e => setShopData({...shopData, address: e.target.value})}
                className="input-glass text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-faint uppercase mb-1">City</label>
                <input value={shopData.city} onChange={e => setShopData({...shopData, city: e.target.value})}
                  className="input-glass text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-faint uppercase mb-1">Pincode</label>
                <input value={shopData.pincode} onChange={e => setShopData({...shopData, pincode: e.target.value})}
                  className="input-glass text-xs" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-black text-body mb-3">Description</h3>
            <textarea value={shopData.description} onChange={e => setShopData({...shopData, description: e.target.value})}
              className="input-glass text-xs w-full h-24 resize-none" />
            <p className="text-[10px] text-faint mt-1">{shopData.description.length}/500 characters</p>
          </div>
        </div>
      )}

      {/* ── HOURS SECTION ── */}
      {activeSection === 'hours' && (
        <div className="space-y-4">
          {/* Holiday Mode */}
          <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                <Calendar size={16} className="text-red-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-body">Holiday Mode</p>
                <p className="text-[10px] text-faint">Temporarily close shop for all orders</p>
              </div>
            </div>
            <button onClick={() => { setHolidayMode(!holidayMode); toast.success(holidayMode ? 'Holiday mode OFF' : 'Holiday mode ON — Shop is closed'); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                holidayMode ? 'bg-red-500 text-white' : 'glass-sm text-muted'
              }`}>
              {holidayMode ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
              {holidayMode ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Weekly Schedule */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-black text-body mb-4">Weekly Schedule</h3>
            <div className="space-y-2.5">
              {hours.map((h, i) => (
                <div key={h.day} className="flex items-center gap-3 p-2.5 surface rounded-xl">
                  <span className="text-xs font-bold text-body w-20">{h.day.slice(0, 3)}</span>
                  <button onClick={() => {
                    const updated = [...hours];
                    updated[i].closed = !updated[i].closed;
                    setHours(updated);
                  }} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                    h.closed
                      ? 'bg-red-500/10 border-red-500/25 text-red-600 dark:text-red-400'
                      : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {h.closed ? 'Closed' : 'Open'}
                  </button>
                  {!h.closed && (
                    <>
                      <input type="time" value={h.open}
                        onChange={e => { const u = [...hours]; u[i].open = e.target.value; setHours(u); }}
                        className="input-glass text-[10px] py-1 px-2 w-24" />
                      <span className="text-xs text-faint">to</span>
                      <input type="time" value={h.close}
                        onChange={e => { const u = [...hours]; u[i].close = e.target.value; setHours(u); }}
                        className="input-glass text-[10px] py-1 px-2 w-24" />
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── DELIVERY SECTION ── */}
      {activeSection === 'delivery' && (
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-black text-body">Delivery Configuration</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-faint uppercase mb-1">Min Order Amount (₹)</label>
              <input type="number" value={shopData.minOrder}
                onChange={e => setShopData({...shopData, minOrder: Number(e.target.value)})}
                className="input-glass text-xs" />
              <p className="text-[10px] text-faint mt-1">Minimum cart value for delivery</p>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-faint uppercase mb-1">Delivery Radius (km)</label>
              <input type="number" value={shopData.deliveryRadius}
                onChange={e => setShopData({...shopData, deliveryRadius: Number(e.target.value)})}
                className="input-glass text-xs" />
              <p className="text-[10px] text-faint mt-1">Max distance for delivery</p>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-faint uppercase mb-1">Avg Prep Time (min)</label>
              <input type="number" value={shopData.prepTime}
                onChange={e => setShopData({...shopData, prepTime: Number(e.target.value)})}
                className="input-glass text-xs" />
              <p className="text-[10px] text-faint mt-1">Shown to customers</p>
            </div>
          </div>

          {/* Visual radius */}
          <div className="p-4 surface rounded-xl text-center">
            <div className="w-32 h-32 mx-auto relative">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-orange-500/30 animate-pulse" />
              <div className="absolute inset-4 rounded-full border border-orange-500/50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div>
                  <MapPin size={20} className="text-accent mx-auto" />
                  <p className="text-xs font-bold text-body mt-1">{shopData.deliveryRadius} km</p>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-faint mt-2">Your delivery coverage area</p>
          </div>
        </div>
      )}

      {/* ── DOCUMENTS SECTION ── */}
      {activeSection === 'documents' && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-black text-body">Business Documents</h3>
            {[
              { label: 'GST Number', value: shopData.gst, verified: true },
              { label: 'FSSAI License', value: shopData.fssai, verified: true },
              { label: 'PAN Card', value: 'ABCDE1234F', verified: true },
              { label: 'Bank Account', value: 'HDFC ****4521', verified: true },
            ].map((doc, i) => (
              <div key={i} className="flex items-center gap-3 p-3 surface rounded-xl">
                <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <FileText size={15} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-body">{doc.label}</p>
                  <p className="text-[10px] text-faint font-mono">{doc.value}</p>
                </div>
                {doc.verified && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                    ✓ Verified
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="glass-sm rounded-xl p-4 text-center">
            <Shield size={20} className="text-faint mx-auto mb-2" />
            <p className="text-xs text-muted font-bold">All documents verified</p>
            <p className="text-[10px] text-faint mt-0.5">Your shop is fully compliant and approved</p>
          </div>
        </div>
      )}
    </div>
  );
}
