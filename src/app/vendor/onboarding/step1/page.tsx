'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Camera, Upload, ArrowLeft, Loader2, CheckCircle2,
  RotateCcw, Image, X, Sparkles,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/index';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ONBOARDING STEP 1 — Shop Photo Upload
// Capture/upload a clear photo of the shop front
// Saves to Firebase Storage → Firestore shopPhotoUrl
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function OnboardingStep1Page() {
  const router = useRouter();
  const { t } = useLanguage();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [shopName, setShopName] = useState('');
  const [existingPhoto, setExistingPhoto] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  // Camera refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('noe-vendor-profile');
    if (saved) {
      const profile = JSON.parse(saved);
      setVendorId(profile.id);
      setShopName(profile.shopName || '');
      if (profile.shopPhotoUrl) {
        setExistingPhoto(profile.shopPhotoUrl);
        setPhotoPreview(profile.shopPhotoUrl);
      }
    } else {
      toast.error('Please register first');
      router.push('/vendor/register');
    }
    // Cleanup camera on unmount
    return () => stopCamera();
  }, [router]);

  // ── Camera Functions ──
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
      toast.error('Camera access denied. Please allow camera permission.');
      // Fallback to file picker
      document.getElementById('shop-photo-file')?.click();
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
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setPhotoPreview(dataUrl);
      canvas.toBlob((blob) => {
        if (blob) {
          setPhotoFile(new File([blob], 'shop_photo.jpg', { type: 'image/jpeg' }));
        }
      }, 'image/jpeg', 0.85);
    }
    stopCamera();
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setShowCamera(false);
  };

  // ── File Upload Handler ──
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo too large. Maximum 5MB allowed.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG, WEBP images are allowed.');
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── Reset Photo ──
  const resetPhoto = () => {
    setPhotoPreview(existingPhoto);
    setPhotoFile(null);
  };

  // ── Save & Upload ──
  const handleSave = async () => {
    if (!vendorId) {
      toast.error('Session expired. Please login again.');
      return;
    }

    if (!photoFile && !existingPhoto) {
      toast.error('Please capture or upload a shop photo');
      return;
    }

    // If no new file was selected but existing photo exists, just go back
    if (!photoFile && existingPhoto) {
      toast.success('Photo already uploaded! ✓');
      router.push('/dashboard/shop');
      return;
    }

    setUploading(true);
    try {
      // Step 1: Upload to Firebase Storage
      const formData = new FormData();
      formData.append('file', photoFile!);
      formData.append('vendorId', vendorId);
      formData.append('fileType', 'shop_photo');

      const uploadRes = await fetch('/api/vendor/upload', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();

      if (!uploadData.success || !uploadData.url) {
        toast.error(uploadData.error || 'Upload failed. Try again.');
        setUploading(false);
        return;
      }

      // Step 2: Save URL to Firestore
      const saveRes = await fetch('/api/vendor/onboarding/step1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, shopPhotoUrl: uploadData.url }),
      });
      const saveData = await saveRes.json();

      if (saveData.success) {
        // Update localStorage
        const saved = localStorage.getItem('noe-vendor-profile');
        if (saved) {
          const profile = JSON.parse(saved);
          profile.shopPhotoUrl = uploadData.url;
          localStorage.setItem('noe-vendor-profile', JSON.stringify(profile));
        }
        toast.success('Shop photo saved! 📸');
        router.push('/dashboard/shop');
      } else {
        toast.error(saveData.error || 'Failed to save. Try again.');
      }
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg1)] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[var(--bg1)]/80 backdrop-blur-xl border-b border-subtle">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/shop')}
            className="w-9 h-9 rounded-xl bg-[var(--bg3)] flex items-center justify-center hover:bg-[var(--bg2)] transition-all"
          >
            <ArrowLeft size={16} className="text-body" />
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-black text-body">{t('shop_photo')}</h1>
            <p className="text-[10px] text-faint">{t('upload_shop_photo')}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">1</span>
            <span className="text-[10px] text-faint">/ 3</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">

        {/* Shop Name Card */}
        <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <Sparkles size={18} className="text-accent" />
          </div>
          <div>
            <p className="text-xs font-bold text-body">{shopName || 'Your Shop'}</p>
            <p className="text-[10px] text-faint">{t('upload_shop_photo')}</p>
          </div>
        </div>

        {/* Photo Preview / Upload Area */}
        {showCamera ? (
          // Camera View
          <div className="relative rounded-2xl overflow-hidden border-2 border-orange-500/30 bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full aspect-[4/3] object-cover"
            />
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-4">
              <button
                onClick={stopCamera}
                className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30 transition-all"
              >
                <X size={20} />
              </button>
              <button
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full bg-white border-4 border-orange-500 flex items-center justify-center hover:scale-105 transition-all active:scale-95"
              >
                <Camera size={24} className="text-orange-500" />
              </button>
              <div className="w-12 h-12" /> {/* Spacer for centering */}
            </div>
          </div>
        ) : photoPreview ? (
          // Photo Preview
          <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/30">
            <img
              src={photoPreview}
              alt="Shop Photo"
              className="w-full aspect-[4/3] object-cover"
            />
            <div className="absolute top-3 right-3 flex gap-2">
              <button
                onClick={resetPhoto}
                className="w-9 h-9 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white hover:bg-black/80 transition-all"
              >
                <RotateCcw size={14} />
              </button>
            </div>
            <div className="absolute bottom-3 left-3">
              <span className="px-3 py-1.5 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold flex items-center gap-1.5">
                <CheckCircle2 size={12} /> {t('photo_ready')}
              </span>
            </div>
          </div>
        ) : (
          // Upload Area (Empty State)
          <div className="rounded-2xl border-2 border-dashed border-orange-500/30 bg-orange-500/[0.03] p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
              <Camera size={32} className="text-accent" />
            </div>
            <h3 className="text-sm font-bold text-body mb-1">{t('upload_shop_photo')}</h3>
            <p className="text-[10px] text-faint mb-5">
              {t('max_5mb')}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <button
                onClick={startCamera}
                className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-all active:scale-95"
              >
                <Camera size={16} /> {t('take_photo')}
              </button>
              <label className="flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-orange-500/30 text-accent text-sm font-bold cursor-pointer hover:bg-orange-500/5 transition-all active:scale-95">
                <Image size={16} /> {t('choose_gallery')}
                <input
                  id="shop-photo-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </label>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-muted">{t('photo_tips_title')}</p>
          <ul className="space-y-1.5 text-[10px] text-faint">
            <li className="flex items-start gap-2">
              <CheckCircle2 size={10} className="text-emerald-500 mt-0.5 shrink-0" />
              <span>{t('photo_tip_1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={10} className="text-emerald-500 mt-0.5 shrink-0" />
              <span>{t('photo_tip_2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={10} className="text-emerald-500 mt-0.5 shrink-0" />
              <span>{t('photo_tip_3')}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={10} className="text-emerald-500 mt-0.5 shrink-0" />
              <span>{t('photo_tip_4')}</span>
            </li>
          </ul>
        </div>

        {/* If photo taken — show change options */}
        {photoPreview && !showCamera && (
          <div className="flex gap-3">
            <button
              onClick={startCamera}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl glass-sm text-xs font-bold text-muted hover:text-body transition-all"
            >
              <Camera size={14} /> {t('retake')}
            </button>
            <label className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl glass-sm text-xs font-bold text-muted hover:text-body cursor-pointer transition-all">
              <Image size={14} /> {t('choose_different')}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileInput}
              />
            </label>
          </div>
        )}
      </div>

      {/* Bottom Save Button */}
      <div className="sticky bottom-0 bg-[var(--bg1)]/80 backdrop-blur-xl border-t border-subtle p-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSave}
            disabled={uploading || (!photoFile && !existingPhoto)}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {t('uploading_progress')}
              </>
            ) : (
              <>
                <Upload size={16} />
                {photoFile ? t('save_continue') : existingPhoto ? t('done_check') : t('upload')}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hidden canvas for camera capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
