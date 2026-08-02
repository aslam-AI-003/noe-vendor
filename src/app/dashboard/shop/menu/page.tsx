'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Search, Plus, Edit3, Trash2, Eye, EyeOff, Package,
  Filter, Grid3X3, List, IndianRupee, Tag, Leaf, X, Save, Camera, Loader2, ImageIcon,
} from 'lucide-react';
import { VendorProduct } from '@/store/useStore';
import { useLanguage } from '@/lib/i18n/index';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MENU MANAGER — Vendor adds/edits their OWN products
// Connected to Firestore: vendors/{vendorId}/menu/{itemId}
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CATEGORIES = [
  'Meals', 'Tiffin', 'Snacks', 'Beverages', 'Sweets',
  'Vegetables', 'Fruits', 'Groceries', 'Dairy', 'Bakery',
  'Meat', 'Seafood', 'Stationery', 'Electronics', 'Other',
];

const DEFAULT_FORM: Omit<VendorProduct, 'id' | 'shopId'> = {
  name: '',
  nameTamil: '',
  price: 0,
  discountPrice: undefined,
  unit: '1 plate',
  category: 'Meals',
  isVeg: true,
  isAvailable: true,
  image: '',
  description: '',
};

export default function MenuManagerPage() {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [myProducts, setMyProducts] = useState<VendorProduct[]>([]);
  const [vendorId, setVendorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);

  // Load vendorId and fetch menu from Firestore
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('noe-vendor-profile');
    if (saved) {
      const profile = JSON.parse(saved);
      setVendorId(profile.id);
      fetchMenu(profile.id);
    }
  }, []);

  const fetchMenu = async (id: string) => {
    try {
      const res = await fetch(`/api/vendor/menu?vendorId=${id}`);
      const data = await res.json();
      if (data.success) {
        setMyProducts(data.items.map((item: any) => ({ ...item, shopId: id })));
      }
    } catch (err) {
      console.error('Failed to fetch menu:', err);
    }
  };

  if (!mounted) return <div className="space-y-4 animate-pulse"><div className="h-16 rounded-2xl skeleton" /><div className="h-64 rounded-2xl skeleton" /></div>;

  // Filter items
  let filtered = myProducts;
  if (selectedCategory !== 'all') {
    filtered = filtered.filter(item => item.category === selectedCategory);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(item =>
      item.name.toLowerCase().includes(q) || item.nameTamil.includes(q)
    );
  }

  const categories = ['all', ...Array.from(new Set(myProducts.map(item => item.category)))];
  const inStockCount = myProducts.filter(i => i.isAvailable).length;
  const outOfStockCount = myProducts.filter(i => !i.isAvailable).length;

  const toggleStock = async (id: string) => {
    const item = myProducts.find(i => i.id === id);
    if (item) {
      const newVal = !item.isAvailable;
      // Optimistic update
      setMyProducts(prev => prev.map(p => p.id === id ? { ...p, isAvailable: newVal } : p));
      toast.success(`${item.name} ${item.isAvailable ? 'marked out of stock' : 'back in stock'}`);
      // Save to Firestore
      await fetch('/api/vendor/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, itemId: id, isAvailable: newVal }),
      });
    }
  };

  const handleDelete = async (id: string) => {
    const item = myProducts.find(i => i.id === id);
    setMyProducts(prev => prev.filter(p => p.id !== id));
    toast.success(`${item?.name} removed`);
    await fetch(`/api/vendor/menu?vendorId=${vendorId}&itemId=${id}`, { method: 'DELETE' });
  };

  const openAdd = () => {
    setForm(DEFAULT_FORM);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (product: VendorProduct) => {
    setForm({
      name: product.name,
      nameTamil: product.nameTamil,
      price: product.price,
      discountPrice: product.discountPrice,
      unit: product.unit,
      category: product.category,
      isVeg: product.isVeg,
      isAvailable: product.isAvailable,
      image: product.image,
      description: product.description,
    });
    setEditingId(product.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast.error('Product name and price are required');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        // Update existing item in Firestore
        await fetch('/api/vendor/menu', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vendorId, itemId: editingId, ...form, price: Number(form.price), discountPrice: form.discountPrice ? Number(form.discountPrice) : null }),
        });
        setMyProducts(prev => prev.map(p => p.id === editingId ? { ...p, ...form, price: Number(form.price) } : p));
        toast.success(`${form.name} updated! ✅`);
      } else {
        // Add new item to Firestore
        const res = await fetch('/api/vendor/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vendorId, ...form, price: Number(form.price), discountPrice: form.discountPrice ? Number(form.discountPrice) : null }),
        });
        const data = await res.json();
        if (data.success && data.item) {
          setMyProducts(prev => [...prev, { ...data.item, shopId: vendorId }]);
        }
        toast.success(`${form.name} added to menu! 🎉`);
      }
      setShowModal(false);
      setEditingId(null);
    } catch (err) {
      toast.error('Failed to save. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-body">{t('menu_title')}</h1>
          <p className="text-sm text-faint">
            {myProducts.length} items • <span className="text-emerald-600 dark:text-emerald-400">{inStockCount} {t('available')}</span> • <span className="text-red-500">{outOfStockCount} {t('unavailable')}</span>
          </p>
        </div>
        <button
          onClick={openAdd}
          className="btn-primary flex items-center gap-2 text-sm px-5 py-2.5"
        >
          <Plus size={16} /> {t('add_item')}
        </button>
      </div>

      {/* ── Search & Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('search_products')}
            className="input-glass pl-9 text-xs py-2.5 w-full"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 surface rounded-xl p-1">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-orange-500 text-white' : 'text-muted'}`}>
              <Grid3X3 size={14} />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-orange-500 text-white' : 'text-muted'}`}>
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Category chips ── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'glass-sm text-muted hover:text-secondary'
            }`}
          >
            {cat === 'all' ? t('all_categories') : t((`cat_${cat.toLowerCase()}`) as any)}
          </button>
        ))}
      </div>

      {/* ── Empty State ── */}
      {filtered.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-orange-500/6 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package size={28} className="text-faint" />
          </div>
          <h3 className="text-base font-bold text-muted">
            {myProducts.length === 0 ? t('no_products_yet') : t('no_matching')}
          </h3>
          <p className="text-xs text-faint mt-1">
            {myProducts.length === 0 ? t('add_first_product') : t('try_different')}
          </p>
          {myProducts.length === 0 && (
            <button onClick={openAdd} className="btn-primary mt-4 inline-flex items-center gap-2 text-sm">
              <Plus size={16} /> {t('add_first_product')}
            </button>
          )}
        </div>
      )}

      {/* ── Products Grid ── */}
      {filtered.length > 0 && (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3' : 'space-y-3'}>
          {filtered.map(item => (
            <div key={item.id} className={`glass-card rounded-2xl overflow-hidden ${!item.isAvailable ? 'opacity-60' : ''}`}>
              <div className={`p-4 ${viewMode === 'list' ? 'flex items-center gap-4' : ''}`}>
                {/* Veg indicator + Name */}
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <span className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5 ${item.isVeg ? 'border-emerald-500' : 'border-red-500'}`}>
                    <span className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-body truncate">{item.name}</h4>
                    <p className="text-[11px] text-faint">{item.nameTamil || item.category} • {item.unit}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center gap-3 mt-3">
                  <div>
                    <span className="text-base font-black text-accent">₹{item.discountPrice || item.price}</span>
                    {item.discountPrice && item.discountPrice < item.price && (
                      <span className="text-xs text-faint line-through ml-2">₹{item.price}</span>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${item.isAvailable ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'}`}>
                    {item.isAvailable ? t('in_stock') : t('out_of_stock')}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-subtle">
                  <button
                    onClick={() => toggleStock(item.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold transition-all ${
                      item.isAvailable ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                    }`}
                  >
                    {item.isAvailable ? <><EyeOff size={12} /> {t('mark_out')}</> : <><Eye size={12} /> {t('restock')}</>}
                  </button>
                  <button
                    onClick={() => openEdit(item)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-all"
                  >
                    <Edit3 size={12} /> {t('edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ━━━━━ ADD/EDIT MODAL ━━━━━ */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative glass-card rounded-3xl w-full max-w-md max-h-[85vh] overflow-y-auto p-6 space-y-4 animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-body">
                {editingId ? t('edit_product') : t('add_new_product')}
              </h2>
              <button onClick={() => setShowModal(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted mb-1 block">{t('product_name')}</label>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Chicken Biryani"
                  className="input-glass text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted mb-1 block">{t('tamil_name')}</label>
                <input
                  value={form.nameTamil}
                  onChange={e => setForm({ ...form, nameTamil: e.target.value })}
                  placeholder="e.g., சிக்கன் பிரியாணி"
                  className="input-glass text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted mb-1 block">{t('price_label')}</label>
                  <input
                    type="number"
                    value={form.price || ''}
                    onChange={e => setForm({ ...form, price: Number(e.target.value) })}
                    placeholder="120"
                    className="input-glass text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted mb-1 block">{t('offer_price')}</label>
                  <input
                    type="number"
                    value={form.discountPrice || ''}
                    onChange={e => setForm({ ...form, discountPrice: Number(e.target.value) || undefined })}
                    placeholder="99"
                    className="input-glass text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted mb-1 block">{t('category')}</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="input-glass text-sm"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{t((`cat_${c.toLowerCase()}`) as any)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted mb-1 block">{t('unit')}</label>
                  <input
                    value={form.unit}
                    onChange={e => setForm({ ...form, unit: e.target.value })}
                    placeholder="1 plate, 1 kg, 500ml"
                    className="input-glass text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted mb-1 block">{t('description')}</label>
                <textarea
                  value={form.description || ''}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Spicy aromatic rice with tender chicken..."
                  className="input-glass text-sm min-h-[60px] resize-none"
                  rows={2}
                />
              </div>

              {/* Product Photo Upload */}
              <div>
                <label className="text-xs font-bold text-muted mb-1 block">{t('product_photo')}</label>
                <div className="flex items-center gap-3">
                  {form.image ? (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-subtle">
                      <img src={form.image} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setForm({ ...form, image: '' })}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                      >
                        <X size={10} className="text-white" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-20 h-20 rounded-xl border-2 border-dashed border-orange-500/30 bg-orange-500/5 flex flex-col items-center justify-center cursor-pointer hover:bg-orange-500/10 transition-all">
                      <Camera size={16} className="text-accent mb-1" />
                      <span className="text-[9px] text-accent font-bold">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error('Image must be under 5MB');
                            return;
                          }
                          toast.loading('Uploading photo...', { id: 'menu-upload' });
                          try {
                            const formData = new FormData();
                            formData.append('file', file);
                            formData.append('vendorId', vendorId);
                            formData.append('type', 'menu');
                            const res = await fetch('/api/vendor/upload', { method: 'POST', body: formData });
                            const data = await res.json();
                            if (data.success && data.url) {
                              setForm({ ...form, image: data.url });
                              toast.success('Photo uploaded! 📸', { id: 'menu-upload' });
                            } else {
                              toast.error(data.error || 'Upload failed', { id: 'menu-upload' });
                            }
                          } catch (err) {
                            toast.error('Upload failed', { id: 'menu-upload' });
                          }
                        }}
                      />
                    </label>
                  )}
                  <div className="flex-1">
                    <p className="text-[10px] text-faint">{t('upload_photo_hint')}</p>
                    <p className="text-[10px] text-faint">{t('max_5mb')}</p>
                  </div>
                </div>
              </div>

              {/* Veg toggle */}
              <div className="flex items-center justify-between p-3 surface rounded-xl">
                <div className="flex items-center gap-2">
                  <Leaf size={14} className="text-emerald-500" />
                  <span className="text-sm font-bold text-body">{t('vegetarian')}</span>
                </div>
                <button
                  onClick={() => setForm({ ...form, isVeg: !form.isVeg })}
                  className={`w-12 h-6 rounded-full transition-all flex items-center ${
                    form.isVeg ? 'bg-emerald-500 justify-end' : 'bg-red-500 justify-start'
                  }`}
                >
                  <span className="w-5 h-5 bg-white rounded-full mx-0.5 shadow" />
                </button>
              </div>

              {/* Available toggle */}
              <div className="flex items-center justify-between p-3 surface rounded-xl">
                <div className="flex items-center gap-2">
                  <Eye size={14} className="text-blue-500" />
                  <span className="text-sm font-bold text-body">{t('available_in_stock')}</span>
                </div>
                <button
                  onClick={() => setForm({ ...form, isAvailable: !form.isAvailable })}
                  className={`w-12 h-6 rounded-full transition-all flex items-center ${
                    form.isAvailable ? 'bg-emerald-500 justify-end' : 'bg-gray-400 justify-start'
                  }`}
                >
                  <span className="w-5 h-5 bg-white rounded-full mx-0.5 shadow" />
                </button>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-sm"
            >
              <Save size={16} />
              {editingId ? t('update_product') : t('add_to_menu')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
