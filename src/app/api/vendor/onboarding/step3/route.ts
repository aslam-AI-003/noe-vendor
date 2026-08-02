import { NextRequest, NextResponse } from 'next/server';
import { serverDb, doc, updateDoc, serverTimestamp } from '@/lib/firebaseAdmin';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/vendor/onboarding/step3
// Saves Aadhaar URL + Bank Proof URL to Firestore
// Does NOT auto-submit anymore — vendor must click "Submit for Review" separately
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, aadhaarUrl, bankDocUrl } = body;

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

    // Build update data
    const updateData: Record<string, any> = {
      aadhaarUrl,
      onboardingStep: 3,
      updatedAt: serverTimestamp(),
    };

    // Also save bank proof if provided
    if (bankDocUrl) {
      updateData.bankDocUrl = bankDocUrl;
    }

    // Update Firestore
    await updateDoc(doc(serverDb, 'vendors', vendorId), updateData);

    console.log('✅ Step 3 saved — KYC docs:', vendorId, '| Aadhaar: ✓', bankDocUrl ? '| BankProof: ✓' : '');

    return NextResponse.json({
      success: true,
      message: 'KYC documents saved successfully',
    });

  } catch (error: any) {
    console.error('Step 3 Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
