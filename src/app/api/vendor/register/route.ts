import { NextRequest, NextResponse } from 'next/server';
import { serverDb, collection, addDoc, serverTimestamp, getDocs, query, where } from '@/lib/firebaseAdmin';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/vendor/register
// Creates vendor record in Firestore after OTP verification
// Status: otp_verified (Step 1 complete)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, shopName, shopType, shopPhotoUrl } = body;

    // Validation
    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Valid phone number required' },
        { status: 400 }
      );
    }

    if (!shopName || shopName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Shop name required (min 2 characters)' },
        { status: 400 }
      );
    }

    if (!shopType) {
      return NextResponse.json(
        { success: false, error: 'Shop type required' },
        { status: 400 }
      );
    }

    // Check for duplicate registration (same phone number)
    const existingQuery = query(collection(serverDb, 'vendors'), where('phone', '==', phone));
    const existingDocs = await getDocs(existingQuery);
    if (!existingDocs.empty) {
      // Return the existing vendor instead of creating duplicate
      const existingDoc = existingDocs.docs[0];
      console.log('⚠️ Vendor already exists for phone:', phone, '→ returning existing:', existingDoc.id);
      return NextResponse.json({
        success: true,
        message: 'Vendor already registered',
        vendor: { id: existingDoc.id, ...existingDoc.data() },
      });
    }

    // Create vendor profile object for Firestore
    const vendorData = {
      phone,
      shopName: shopName.trim(),
      shopType,
      shopPhotoUrl: shopPhotoUrl || null,
      onboardingStatus: 'otp_verified',
      onboardingStep: 1,
      isLive: false,
      // Documents (to be filled later)
      aadhaarUrl: null,
      upiId: null,
      bankAccount: null,
      fssaiNumber: null,
      gstNumber: null,
      panNumber: null,
      // Address (to be filled later)
      address: null,
      lat: null,
      lng: null,
      // Admin fields (set on approval)
      vendorId: null, // AVT00042 format, set by admin
      tempPassword: null,
      rejectionReason: null,
      // Timestamps
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // ━━━━ Write to Firestore ━━━━
    const docRef = await addDoc(collection(serverDb, 'vendors'), vendorData);
    
    console.log('✅ Vendor registered & saved to Firestore:', docRef.id, shopName, phone);

    // Return the vendor profile with Firestore doc ID
    const vendorProfile = {
      id: docRef.id,
      phone,
      shopName: shopName.trim(),
      shopType,
      shopPhotoUrl: shopPhotoUrl || null,
      onboardingStatus: 'otp_verified',
      onboardingStep: 1,
      isLive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Vendor registered successfully',
      vendor: vendorProfile,
    });

  } catch (error: any) {
    console.error('Vendor Register Error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
