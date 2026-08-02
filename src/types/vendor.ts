// ============================================================
// Vendor Onboarding Types — Progressive Registration
// ============================================================

// Vendor onboarding status flow:
// otp_verified → pending_profile → pending_approval → active → suspended
export type VendorOnboardingStatus =
  | 'otp_verified'        // Step 1 done (phone + photo + name)
  | 'pending_profile'     // Step 2 started but not complete
  | 'pending_approval'    // All steps done, waiting for admin
  | 'active'             // Admin approved, can receive orders
  | 'suspended'          // Admin suspended
  | 'rejected';          // Admin rejected

export type ShopType = 
  | 'restaurant'
  | 'grocery'
  | 'tea_shop'
  | 'vegetables'
  | 'bakery'
  | 'meat_fish'
  | 'medicines'
  | 'stationery'
  | 'electronics'
  | 'flower_shop'
  | 'other';

export const SHOP_TYPES: { id: ShopType; label: string; labelTamil: string; icon: string }[] = [
  { id: 'restaurant', label: 'Restaurant', labelTamil: 'உணவகம்', icon: '🍽️' },
  { id: 'grocery', label: 'Grocery', labelTamil: 'மளிகை', icon: '🛒' },
  { id: 'tea_shop', label: 'Tea Shop / Snacks', labelTamil: 'டீ கடை', icon: '☕' },
  { id: 'vegetables', label: 'Vegetables & Fruits', labelTamil: 'காய்கறி', icon: '🥬' },
  { id: 'bakery', label: 'Bakery', labelTamil: 'பேக்கரி', icon: '🧁' },
  { id: 'meat_fish', label: 'Meat / Fish', labelTamil: 'இறைச்சி/மீன்', icon: '🍖' },
  { id: 'medicines', label: 'Medicines', labelTamil: 'மருந்துகள்', icon: '💊' },
  { id: 'stationery', label: 'Stationery', labelTamil: 'ஸ்டேஷனரி', icon: '📝' },
  { id: 'electronics', label: 'Electronics', labelTamil: 'எலக்ட்ரானிக்ஸ்', icon: '📱' },
  { id: 'flower_shop', label: 'Flower Shop', labelTamil: 'பூ கடை', icon: '🌸' },
  { id: 'other', label: 'Other', labelTamil: 'மற்றவை', icon: '📦' },
];

// Vendor profile stored in Firestore `vendors` collection
export interface VendorProfile {
  id: string;
  
  // Step 1 — Core (required for account creation)
  phone: string;
  shopName: string;
  shopType: ShopType;
  shopPhotoUrl?: string; // cloud storage URL
  
  // Step 2 — Profile (non-blocking, prompted later)
  ownerName?: string;
  email?: string;
  address?: string;
  city?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
  bankAccount?: string;
  ifscCode?: string;
  upiId?: string;
  
  // Step 3 — Verification (required for "Go Live")
  aadhaarUrl?: string;      // ID proof upload URL
  panUrl?: string;          // PAN card upload URL
  fssaiUrl?: string;        // FSSAI license URL (optional for non-food)
  shopDescription?: string; // auto-filled from voice note
  
  // Status & Metadata
  onboardingStatus: VendorOnboardingStatus;
  onboardingStep: 1 | 2 | 3; // current step completed
  isLive: boolean;           // can receive real orders
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  
  // Generated on approval
  shopId?: string;  // NOE-SHOP-XXXXX
}

// Admin notification payload
export interface AdminNotification {
  id?: string;
  type: 'new_vendor_registration' | 'vendor_profile_complete' | 'vendor_go_live_request';
  vendorId: string;
  shopName: string;
  ownerName?: string;
  phone: string;
  shopType: ShopType;
  status: 'unread' | 'read';
  createdAt: string;
}

// OTP related
export interface OTPRequest {
  phone: string;
  purpose: 'vendor_register' | 'vendor_login';
}

export interface OTPVerifyRequest {
  phone: string;
  otp: string;
  purpose: 'vendor_register' | 'vendor_login';
}
