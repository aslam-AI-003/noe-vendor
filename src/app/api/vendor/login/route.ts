import { NextRequest, NextResponse } from 'next/server';
import { serverDb, collection, query, where, getDocs } from '@/lib/firebaseAdmin';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/vendor/login
// Finds vendor in Firestore by phone number
// Called after OTP is verified
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Valid phone number required' },
        { status: 400 }
      );
    }

    // Search Firestore for vendor with this phone (prefer approved vendors)
    const q = query(collection(serverDb, 'vendors'), where('phone', '==', phone));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json({
        success: false,
        error: 'No vendor account found with this number. Please register first.',
        notFound: true,
      }, { status: 404 });
    }

    // Prefer approved vendor (if multiple docs exist with same phone)
    const approvedDoc = snapshot.docs.find(d => d.data().status === 'approved');
    const vendorDoc = approvedDoc || snapshot.docs[0];
    const vendorData = vendorDoc.data();

    // Return vendor profile
    const vendorProfile = {
      id: vendorDoc.id,
      shopId: vendorData.shopId || vendorDoc.id, // For order queries
      status: vendorData.status || 'pending',
      phone: vendorData.phone,
      shopName: vendorData.shopName,
      shopType: vendorData.shopType,
      shopPhotoUrl: vendorData.shopPhotoUrl,
      onboardingStatus: vendorData.onboardingStatus || vendorData.status,
      onboardingStep: vendorData.onboardingStep,
      isLive: vendorData.isLive || false,
      vendorId: vendorData.vendorId,
      address: vendorData.address,
      lat: vendorData.lat,
      lng: vendorData.lng,
      upiId: vendorData.upiId,
      bankAccount: vendorData.bankAccount,
      aadhaarUrl: vendorData.aadhaarUrl,
      fssaiNumber: vendorData.fssaiNumber,
      gstNumber: vendorData.gstNumber,
      panNumber: vendorData.panNumber,
      rejectionReason: vendorData.rejectionReason,
      createdAt: vendorData.createdAt?.toDate?.()?.toISOString() || vendorData.createdAt,
      updatedAt: vendorData.updatedAt?.toDate?.()?.toISOString() || vendorData.updatedAt,
    };

    console.log('✅ Vendor login found:', vendorDoc.id, vendorData.shopName, phone);

    return NextResponse.json({
      success: true,
      message: 'Vendor found',
      vendor: vendorProfile,
    });

  } catch (error: any) {
    console.error('Vendor Login Error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
