'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Store, Clock, MapPin, Phone, Mail, Globe, Camera,
  Save, ToggleLeft, ToggleRight, Calendar, Shield, FileText,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/index';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SHOP SETTINGS — Profile, Hours, Delivery, KYC
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_KEYS = ['day_mon', 'day_tue', 'day_wed', 'day_thu', 'day_fri', 'day_sat', 'day_sun'] as const;

export default function SettingsPage() {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState<'profile' | 'hours' | 'delivery' | 'documents'>('profile');
  const [holidayMode, setHolidayMode] = useState(false);

  const [vendorId, setVendorId] = useState('');
  const [saving, setSaving] = useState(false);

  const [shopData, setShopData] = useState({
    name: '',
    nameTamil: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    pincode: '',
    gst: '',
    fssai: '',
    description: '',
    minOrder: 99,
    deliveryRadius: 5,
    prepTime: 20,
  });

  const [hours, setHours] = useState(
    DAYS.map(day => ({ day, open: '08:00', close: '22:00', closed: day === 'Sunday' }))
  );

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('noe-vendor-profile');
    if (saved) {
      const profile = JSON.parse(saved);
      setVendorId(profile.id);
      fetchSettings(profile.id);
    }
  }, []);

  const fetchSettings = async (id: string) => {
    try {
      const res = await fetch(`/api/vendor/settings?vendorId=${id}`);
      const data = await res.json();
      if (data.success && data.settings) {
        const s = data.settings;
        setShopData({
          name: s.shopName || '',
          nameTamil: s.shopNameTamil || '',
          phone: s.phone || '',
          email: s.email || '',
          address: s.address || '',
          city: s.city || '',
          pincode: s.pincode || '',
          gst: s.gst || '',
          fssai: s.fssai || '',
          description: s.description || '',
          minOrder: s.minOrder || 99,
          deliveryRadius: s.deliveryRadius || 5,
          prepTime: s.prepTime || 20,
        });
        if (s.operatingHours) setHours(s.operatingHours);
        if (s.holidayMode !== undefined) setHolidayMode(s.holidayMode);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  if (!mounted) return <div className="space-y-4 animate-pulse"><div className="h-16 rounded-2xl skeleton" /><div className="h-64 rounded-2xl skeleton" /></div>;

  const sections = [
    { id: 'profile' as const, label: t('shop_profile'), icon: Store },
    { id: 'hours' as const, label: t('operating_hours'), icon: Clock },
    { id: 'delivery' as const, label: t('delivery_settings'), icon: MapPin },
    { id: 'documents' as const, label: t('documents_kyc'), icon: Shield },
  ];

  const handleSave = async () => {
    if (!vendorId) { toast.error('Not logged in'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/vendor/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId,
          shopName: shopData.name,
          shopNameTamil: shopData.nameTamil,
          phone: shopData.phone,
          email: shopData.email,
          address: shopData.address,
          city: shopData.city,
          pincode: shopData.pincode,
          gst: shopData.gst,
          fssai: shopData.fssai,
          description: shopData.description,
          minOrder: shopData.minOrder,
          deliveryRadius: shopData.deliveryRadius,
          prepTime: shopData.prepTime,
          operatingHours: hours,
          holidayMode,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Settings saved to Firestore! ✅');
        // Update localStorage too (include operatingHours for checklist detection)
        const saved = localStorage.getItem('noe-vendor-profile');
        if (saved) {
          const profile = JSON.parse(saved);
          const updated = {
            ...profile,
            shopName: shopData.name,
            phone: shopData.phone,
            email: shopData.email,
            address: shopData.address,
            city: shopData.city,
            pincode: shopData.pincode,
            description: shopData.description,
            operatingHours: hours,
            holidayMode,
            minOrder: shopData.minOrder,
            deliveryRadius: shopData.deliveryRadius,
            prepTime: shopData.prepTime,
          };
          localStorage.setItem('noe-vendor-profile', JSON.stringify(updated));
        }
      } else {
        toast.error(data.error || 'Failed to save');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-body">{t('settings_title')}</h1>
        </div>
        <button onClick={handleSave} className="btn-primary text-xs px-4 py-2.5 flex items-center gap-1.5">
          <Save size={13} /> {t('save_changes')}
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
            <h3 className="text-sm font-black text-body mb-4">{t('shop_identity')}</h3>
            <div className="flex gap-4 items-start">
              <div className="w-20 h-20 rounded-2xl bg-orange-500/10 flex items-center justify-center border-2 border-dashed border-orange-500/30 cursor-pointer hover:bg-orange-500/15 transition-colors">
                <Camera size={20} className="text-accent" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-faint uppercase mb-1">{t('shop_name')}</label>
                  <input value={shopData.name} onChange={e => setShopData({...shopData, name: e.target.value})}
                    className="input-glass text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-faint uppercase mb-1">{t('tamil_name')}</label>
                  <input value={shopData.nameTamil} onChange={e => setShopData({...shopData, nameTamil: e.target.value})}
                    className="input-glass text-xs" />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-black text-body mb-3">{t('contact_details')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-faint uppercase mb-1">{t('phone')}</label>
                <div className="relative">
                  <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
                  <input value={shopData.phone} onChange={e => setShopData({...shopData, phone: e.target.value})}
                    className="input-glass text-xs pl-9" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-faint uppercase mb-1">{t('email')}</label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
                  <input value={shopData.email} onChange={e => setShopData({...shopData, email: e.target.value})}
                    className="input-glass text-xs pl-9" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-faint uppercase mb-1">{t('address')}</label>
              <input value={shopData.address} onChange={e => setShopData({...shopData, address: e.target.value})}
                className="input-glass text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-faint uppercase mb-1">{t('city')}</label>
                <input value={shopData.city} onChange={e => setShopData({...shopData, city: e.target.value})}
                  className="input-glass text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-faint uppercase mb-1">{t('pincode')}</label>
                <input value={shopData.pincode} onChange={e => setShopData({...shopData, pincode: e.target.value})}
                  className="input-glass text-xs" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-black text-body mb-3">{t('description_label')}</h3>
            <textarea value={shopData.description} onChange={e => setShopData({...shopData, description: e.target.value})}
              className="input-glass text-xs w-full h-24 resize-none" />
            <p className="text-[10px] text-faint mt-1">{shopData.description.length}/500 {t('characters')}</p>
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
                <p className="text-xs font-bold text-body">{t('holiday_mode')}</p>
                <p className="text-[10px] text-faint">{t('holiday_mode_desc')}</p>
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
            <h3 className="text-sm font-black text-body mb-4">{t('weekly_schedule')}</h3>
            <div className="space-y-2.5">
              {hours.map((h, i) => (
                <div key={h.day} className="flex items-center gap-3 p-2.5 surface rounded-xl">
                  <span className="text-xs font-bold text-body w-20">{t(DAY_KEYS[i])}</span>
                  <button onClick={() => {
                    const updated = [...hours];
                    updated[i].closed = !updated[i].closed;
                    setHours(updated);
                  }} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                    h.closed
                      ? 'bg-red-500/10 border-red-500/25 text-red-600 dark:text-red-400'
                      : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {h.closed ? t('closed') : t('open')}
                  </button>
                  {!h.closed && (
                    <>
                      <input type="time" value={h.open}
                        onChange={e => { const u = [...hours]; u[i].open = e.target.value; setHours(u); }}
                        className="input-glass text-[10px] py-1 px-2 w-24" />
                      <span className="text-xs text-faint">{t('to')}</span>
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
          <h3 className="text-sm font-black text-body">{t('delivery_config')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-faint uppercase mb-1">{t('min_order_amount')}</label>
              <input type="number" value={shopData.minOrder}
                onChange={e => setShopData({...shopData, minOrder: Number(e.target.value)})}
                className="input-glass text-xs" />
              <p className="text-[10px] text-faint mt-1">{t('min_cart_hint')}</p>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-faint uppercase mb-1">{t('delivery_radius')}</label>
              <input type="number" value={shopData.deliveryRadius}
                onChange={e => setShopData({...shopData, deliveryRadius: Number(e.target.value)})}
                className="input-glass text-xs" />
              <p className="text-[10px] text-faint mt-1">{t('max_distance_hint')}</p>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-faint uppercase mb-1">{t('avg_prep_time_setting')}</label>
              <input type="number" value={shopData.prepTime}
                onChange={e => setShopData({...shopData, prepTime: Number(e.target.value)})}
                className="input-glass text-xs" />
              <p className="text-[10px] text-faint mt-1">{t('shown_to_customers')}</p>
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
            <p className="text-[10px] text-faint mt-2">{t('delivery_coverage')}</p>
          </div>
        </div>
      )}

      {/* ── DOCUMENTS SECTION ── */}
      {activeSection === 'documents' && (
        <DocumentsKYCSection />
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DOCUMENTS & KYC — Status-based document cards
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type DocStatus = 'not_uploaded' | 'uploaded' | 'verified' | 'rejected' | 'optional';

interface DocItem {
  id: string;
  label: string;
  description: string;
  required: boolean;
  status: DocStatus;
  value?: string;
  rejectionReason?: string;
  uploadedAt?: string;
}

function DocumentsKYCSection() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<any>(null);
  const [uploading, setUploading] = useState<string | null>(null); // which doc is uploading
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('noe-vendor-profile');
    if (saved) {
      setProfile(JSON.parse(saved));
    }
  }, []);

  // Handle Upload button click — opens file picker
  const handleUploadClick = (docId: string) => {
    setCurrentDocId(docId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Handle file selected — upload to Firebase Storage
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentDocId || !profile?.id) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Max 5MB allowed.');
      return;
    }

    setUploading(currentDocId);

    try {
      // Map doc IDs to API-accepted fileType values
      const fileTypeMap: Record<string, string> = {
        aadhaar: 'aadhaar',
        bank: 'bank_proof',
        fssai: 'fssai',
        gst: 'gst',
        pan: 'pan',
      };
      const formData = new FormData();
      formData.append('file', file);
      formData.append('vendorId', profile.id);
      formData.append('fileType', fileTypeMap[currentDocId] || 'aadhaar');

      const res = await fetch('/api/vendor/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success && data.url) {
        // Map docId to profile field
        const fieldMap: Record<string, string> = {
          aadhaar: 'aadhaarUrl',
          bank: 'bankDocUrl',
          fssai: 'fssaiUrl',
          gst: 'gstUrl',
          pan: 'panUrl',
        };
        const fieldName = fieldMap[currentDocId] || `${currentDocId}Url`;

        // Save URL to Firestore via settings API
        const saveRes = await fetch('/api/vendor/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendorId: profile.id,
            [fieldName]: data.url,
          }),
        });

        if (saveRes.ok) {
          // Update local profile
          const updatedProfile = { ...profile, [fieldName]: data.url };
          setProfile(updatedProfile);
          localStorage.setItem('noe-vendor-profile', JSON.stringify(updatedProfile));
          toast.success(`${currentDocId === 'aadhaar' ? 'Aadhaar' : currentDocId === 'bank' ? 'Bank document' : currentDocId.toUpperCase()} uploaded successfully! ✅`);
        } else {
          toast.error('Upload succeeded but save failed. Try again.');
        }
      } else {
        toast.error(data.error || 'Upload failed. Try again.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Upload failed. Check your internet connection.');
    } finally {
      setUploading(null);
      setCurrentDocId(null);
    }
  };

  // Determine document statuses based on vendor profile
  const isLive = profile?.onboardingStatus === 'active' || profile?.onboardingStatus === 'approved';
  const isPending = profile?.onboardingStatus === 'pending_approval';

  const documents: DocItem[] = [
    {
      id: 'aadhaar',
      label: t('doc_aadhaar'),
      description: t('doc_aadhaar_desc'),
      required: true,
      status: isLive ? 'verified' : profile?.aadhaarUrl ? 'uploaded' : 'not_uploaded',
      value: profile?.aadhaarUrl ? t('doc_uploaded') : undefined,
    },
    {
      id: 'bank',
      label: t('doc_bank'),
      description: t('doc_bank_desc'),
      required: true,
      status: isLive ? 'verified' : (profile?.bankDocUrl || profile?.upiId || profile?.accountNumber || profile?.bankAccount) ? 'uploaded' : 'not_uploaded',
      value: profile?.bankDocUrl ? t('doc_uploaded') : (profile?.upiId || (profile?.accountNumber ? `****${profile.accountNumber.slice(-4)}` : null) || profile?.bankAccount || undefined),
    },
    {
      id: 'fssai',
      label: t('doc_fssai'),
      description: t('doc_fssai_desc'),
      required: false,
      status: isLive && profile?.fssaiNumber ? 'verified' : profile?.fssaiNumber ? 'uploaded' : 'optional',
      value: profile?.fssaiNumber || undefined,
    },
    {
      id: 'gst',
      label: t('doc_gst'),
      description: t('doc_gst_desc'),
      required: false,
      status: isLive && profile?.gstNumber ? 'verified' : profile?.gstNumber ? 'uploaded' : 'optional',
      value: profile?.gstNumber || undefined,
    },
    {
      id: 'pan',
      label: t('doc_pan'),
      description: t('doc_pan_desc'),
      required: false,
      status: isLive && profile?.panNumber ? 'verified' : profile?.panNumber ? 'uploaded' : 'optional',
      value: profile?.panNumber || undefined,
    },
  ];

  const requiredDocs = documents.filter(d => d.required);
  const optionalDocs = documents.filter(d => !d.required);
  const completedRequired = requiredDocs.filter(d => d.status === 'verified' || d.status === 'uploaded').length;

  const statusConfig: Record<DocStatus, { badge: string; badgeClass: string; borderClass: string; iconBg: string }> = {
    not_uploaded: {
      badge: t('not_uploaded'),
      badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25',
      borderClass: 'border-amber-500/20',
      iconBg: 'bg-amber-500/10',
    },
    uploaded: {
      badge: t('pending_review'),
      badgeClass: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25',
      borderClass: 'border-blue-500/20',
      iconBg: 'bg-blue-500/10',
    },
    verified: {
      badge: t('verified'),
      badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
      borderClass: 'border-emerald-500/20',
      iconBg: 'bg-emerald-500/10',
    },
    rejected: {
      badge: '❌ Rejected',
      badgeClass: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/25',
      borderClass: 'border-red-500/20',
      iconBg: 'bg-red-500/10',
    },
    optional: {
      badge: t('optional_label'),
      badgeClass: 'bg-[var(--bg3)] text-faint border-subtle',
      borderClass: 'border-subtle',
      iconBg: 'bg-[var(--bg3)]',
    },
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input for document uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,.pdf"
        className="hidden"
      />

      {/* Progress indicator */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-black text-body">{t('document_verification')}</h3>
          <span className="text-xs font-bold text-muted">{completedRequired}/{requiredDocs.length} {t('required_label')}</span>
        </div>
        <div className="w-full h-2 rounded-full bg-[var(--bg3)] overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500"
            style={{ width: `${(completedRequired / requiredDocs.length) * 100}%` }} />
        </div>
        <p className="text-[10px] text-faint mt-1.5">
          {completedRequired === requiredDocs.length
            ? isLive ? t('all_docs_verified') : t('docs_awaiting_review')
            : t('upload_docs_hint')}
        </p>
      </div>

      {/* Required Documents */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-black text-body flex items-center gap-2">
          <Shield size={14} className="text-accent" />
          {t('required_documents')}
        </h3>
        {requiredDocs.map(doc => {
          const config = statusConfig[doc.status];
          return (
            <div key={doc.id} className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${config.borderClass} hover:shadow-sm`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.iconBg}`}>
                <FileText size={16} className={doc.status === 'verified' ? 'text-emerald-600 dark:text-emerald-400' : doc.status === 'not_uploaded' ? 'text-amber-600' : 'text-blue-600'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-body">{doc.label}</p>
                <p className="text-[10px] text-faint">{doc.description}</p>
                {doc.value && doc.status !== 'not_uploaded' && (
                  <p className="text-[10px] text-muted font-mono mt-0.5">{doc.value}</p>
                )}
                {doc.status === 'rejected' && doc.rejectionReason && (
                  <p className="text-[10px] text-red-600 mt-0.5">Reason: {doc.rejectionReason}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${config.badgeClass}`}>
                  {config.badge}
                </span>
                {doc.status === 'not_uploaded' && (
                  <button
                    onClick={() => handleUploadClick(doc.id)}
                    disabled={uploading === doc.id}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-orange-500/10 text-accent border border-orange-500/20 hover:bg-orange-500/15 transition-all disabled:opacity-50">
                    {uploading === doc.id ? '⏳...' : t('upload_btn')}
                  </button>
                )}
                {doc.status === 'rejected' && (
                  <button
                    onClick={() => handleUploadClick(doc.id)}
                    disabled={uploading === doc.id}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-500/15 transition-all disabled:opacity-50">
                    {uploading === doc.id ? '⏳...' : t('reupload_btn')}
                  </button>
                )}
                {(doc.status === 'uploaded' || doc.status === 'verified') && (
                  <button
                    onClick={() => { if (profile?.[`${doc.id}Url`] || profile?.aadhaarUrl) window.open(profile.aadhaarUrl || profile[`${doc.id}Url`], '_blank'); }}
                    className="text-[10px] text-accent font-bold hover:opacity-80">{t('view_btn')}</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Optional Documents — Number + Photo */}
      <OptionalDocumentsSection profile={profile} setProfile={setProfile} />

      {/* Overall status message */}
      <div className={`glass-sm rounded-xl p-4 text-center ${
        isLive ? 'border border-emerald-500/20' : 'border border-amber-500/15'
      }`}>
        {isLive ? (
          <>
            <Shield size={20} className="text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
            <p className="text-xs text-body font-bold">{t('all_docs_verified')}</p>
            <p className="text-[10px] text-faint mt-0.5">{t('shop_compliant')}</p>
          </>
        ) : (
          <>
            <Shield size={20} className="text-amber-600 dark:text-amber-400 mx-auto mb-2" />
            <p className="text-xs text-body font-bold">
              {completedRequired === requiredDocs.length
                ? t('docs_submitted_waiting')
                : t('upload_docs_hint')}
            </p>
            <p className="text-[10px] text-faint mt-0.5">{t('admin_review_time')}</p>
          </>
        )}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// OPTIONAL DOCUMENTS — Number Input + Optional Photo Upload
// FSSAI (14-digit number + certificate photo)
// GST (15-char GSTIN number)
// PAN (10-char number + photo)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface OptionalDocProps {
  profile: any;
  setProfile: (p: any) => void;
}

function OptionalDocumentsSection({ profile, setProfile }: OptionalDocProps) {
  const { t } = useLanguage();
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [fileDocId, setFileDocId] = useState<string | null>(null);

  // Local state for number inputs
  const [fssaiNumber, setFssaiNumber] = useState(profile?.fssaiNumber || '');
  const [gstNumber, setGstNumber] = useState(profile?.gstNumber || '');
  const [panNumber, setPanNumber] = useState(profile?.panNumber || '');

  // Sync from profile when it changes
  useEffect(() => {
    if (profile) {
      setFssaiNumber(profile.fssaiNumber || '');
      setGstNumber(profile.gstNumber || '');
      setPanNumber(profile.panNumber || '');
    }
  }, [profile]);

  const optionalDocs = [
    {
      id: 'fssai',
      label: 'FSSAI License',
      description: 'Required for food vendors (optional for others)',
      placeholder: 'Enter 14-digit FSSAI number',
      maxLength: 14,
      pattern: /^\d{14}$/,
      patternHint: '14-digit number',
      numberValue: fssaiNumber,
      setNumber: setFssaiNumber,
      fieldName: 'fssaiNumber',
      urlField: 'fssaiUrl',
      hasPhoto: true,
      photoLabel: 'Upload FSSAI certificate (optional)',
    },
    {
      id: 'gst',
      label: 'GST Number',
      description: 'For vendors with GST registration',
      placeholder: 'Enter 15-character GSTIN',
      maxLength: 15,
      pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      patternHint: '15-char GSTIN (e.g. 22AAAAA0000A1Z5)',
      numberValue: gstNumber,
      setNumber: setGstNumber,
      fieldName: 'gstNumber',
      urlField: 'gstUrl',
      hasPhoto: false,
      photoLabel: '',
    },
    {
      id: 'pan',
      label: 'PAN Card',
      description: 'For tax reporting',
      placeholder: 'Enter 10-character PAN',
      maxLength: 10,
      pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
      patternHint: '10-char PAN (e.g. ABCDE1234F)',
      numberValue: panNumber,
      setNumber: setPanNumber,
      fieldName: 'panNumber',
      urlField: 'panUrl',
      hasPhoto: true,
      photoLabel: 'Upload PAN card photo (optional)',
    },
  ];

  // Save number to Firestore
  const handleSaveNumber = async (doc: typeof optionalDocs[0]) => {
    if (!profile?.id) return;
    if (!doc.numberValue.trim()) {
      toast.error(`Please enter ${doc.label}`);
      return;
    }

    setSaving(doc.id);
    try {
      const res = await fetch('/api/vendor/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: profile.id,
          [doc.fieldName]: doc.numberValue.trim().toUpperCase(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        const updated = { ...profile, [doc.fieldName]: doc.numberValue.trim().toUpperCase() };
        setProfile(updated);
        localStorage.setItem('noe-vendor-profile', JSON.stringify(updated));
        toast.success(`${doc.label} saved! ✅`);
        setExpandedDoc(null);
      } else {
        toast.error(data.error || 'Save failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(null);
    }
  };

  // Handle photo upload for optional docs
  const handlePhotoUpload = (docId: string) => {
    setFileDocId(docId);
    if (fileRef.current) {
      fileRef.current.value = '';
      fileRef.current.click();
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fileDocId || !profile?.id) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Max 5MB.');
      return;
    }

    setUploading(fileDocId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('vendorId', profile.id);
      formData.append('fileType', fileDocId);

      const res = await fetch('/api/vendor/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success && data.url) {
        const doc = optionalDocs.find(d => d.id === fileDocId);
        const urlField = doc?.urlField || `${fileDocId}Url`;

        const saveRes = await fetch('/api/vendor/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vendorId: profile.id, [urlField]: data.url }),
        });

        if (saveRes.ok) {
          const updated = { ...profile, [urlField]: data.url };
          setProfile(updated);
          localStorage.setItem('noe-vendor-profile', JSON.stringify(updated));
          toast.success('Document photo uploaded! ✅');
        }
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(null);
      setFileDocId(null);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 space-y-3">
      <input type="file" ref={fileRef} onChange={handleFileSelected} accept="image/*,.pdf" className="hidden" />

      <h3 className="text-sm font-black text-body flex items-center gap-2">
        <FileText size={14} className="text-muted" />
        Optional Documents
      </h3>
      <p className="text-[10px] text-faint">These help build trust with customers and may be required for food businesses.</p>

      {optionalDocs.map(doc => {
        const hasSavedNumber = !!profile?.[doc.fieldName];
        const hasSavedPhoto = !!profile?.[doc.urlField];
        const isExpanded = expandedDoc === doc.id;

        return (
          <div key={doc.id} className={`rounded-xl border transition-all overflow-hidden ${
            hasSavedNumber ? 'border-emerald-500/25 bg-emerald-500/[0.02]' : 'border-subtle'
          }`}>
            {/* Header row */}
            <div className="flex items-center gap-3 p-3.5 cursor-pointer" onClick={() => setExpandedDoc(isExpanded ? null : doc.id)}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                hasSavedNumber ? 'bg-emerald-500/10' : 'bg-[var(--bg3)]'
              }`}>
                {hasSavedNumber ? (
                  <Shield size={14} className="text-emerald-600" />
                ) : (
                  <FileText size={14} className="text-faint" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-body">{doc.label}</p>
                {hasSavedNumber ? (
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">{profile[doc.fieldName]}</p>
                ) : (
                  <p className="text-[10px] text-faint">{doc.description}</p>
                )}
              </div>
              <div className="shrink-0 flex items-center gap-2">
                {hasSavedNumber && hasSavedPhoto && (
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">📄 Photo</span>
                )}
                {hasSavedNumber ? (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">✓ Saved</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[var(--bg3)] text-faint border border-subtle">— Optional</span>
                )}
              </div>
            </div>

            {/* Expanded form */}
            {isExpanded && (
              <div className="px-4 pb-4 pt-1 border-t border-subtle space-y-3">
                {/* Number input */}
                <div>
                  <label className="block text-[10px] font-bold text-faint uppercase mb-1.5">
                    {doc.label} Number
                  </label>
                  <input
                    type="text"
                    value={doc.numberValue}
                    onChange={e => doc.setNumber(e.target.value.toUpperCase())}
                    placeholder={doc.placeholder}
                    maxLength={doc.maxLength}
                    className="input-glass text-xs font-mono uppercase tracking-wider"
                  />
                  <p className="text-[9px] text-faint mt-1">Format: {doc.patternHint}</p>
                </div>

                {/* Photo upload (optional) */}
                {doc.hasPhoto && (
                  <div>
                    <label className="block text-[10px] font-bold text-faint uppercase mb-1.5">
                      {doc.photoLabel}
                    </label>
                    {hasSavedPhoto ? (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                        <Shield size={12} className="text-emerald-600" />
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">Photo uploaded ✓</span>
                        <button
                          onClick={() => window.open(profile[doc.urlField], '_blank')}
                          className="ml-auto text-[10px] text-accent font-bold">View</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handlePhotoUpload(doc.id)}
                        disabled={uploading === doc.id}
                        className="w-full py-2.5 rounded-lg border-2 border-dashed border-blue-500/25 bg-blue-500/[0.03] text-[10px] font-bold text-blue-600 hover:bg-blue-500/[0.06] transition-all disabled:opacity-50">
                        {uploading === doc.id ? '⏳ Uploading...' : '📷 Tap to upload photo'}
                      </button>
                    )}
                  </div>
                )}

                {/* Save button */}
                <button
                  onClick={() => handleSaveNumber(doc)}
                  disabled={saving === doc.id || !doc.numberValue.trim()}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-orange-500 text-white active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving === doc.id ? (
                    <><span className="animate-spin">⏳</span> Saving...</>
                  ) : (
                    <><Save size={13} /> Save {doc.label}</>
                  )}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
