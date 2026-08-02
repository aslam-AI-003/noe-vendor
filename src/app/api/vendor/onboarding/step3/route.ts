import { NextRequest, NextResponse } from 'next/server';
import { serverDb, doc, updateDoc, serverTimestamp } from '@/lib/firebaseAdmin';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/vendor/onboarding/step3
// Saves Aadhaar URL + sets status to pending_approval
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, aadhaarUrl } = body;

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'Vendor ID required' },
        { status: 400 }
      );
    }

    if (!aadhaarUrl) {
      return NextResponse.json(
        { success: false, error: 'Aadhaar document URL required' },
        { status: 400 }
      );
    }

    // Update Firestore — save aadhaarUrl + change status to pending_approval
    await updateDoc(doc(serverDb, 'vendors', vendorId), {
      aadhaarUrl,
      onboardingStep: 3,
      onboardingStatus: 'pending_approval',
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Step 3 complete — KYC submitted:', vendorId, '| Status: pending_approval');

    return NextResponse.json({
      success: true,
      message: 'KYC documents submitted for review',
    });

  } catch (error: any) {
    console.error('Step 3 Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
