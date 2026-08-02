import { NextRequest, NextResponse } from 'next/server';
import { serverDb, doc, updateDoc, getDoc, serverTimestamp } from '@/lib/firebaseAdmin';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/vendor/onboarding/submit
// Changes vendor status to 'pending_approval'
// Called when vendor completes all setup steps and submits for review
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId } = body;

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'Vendor ID required' },
        { status: 400 }
      );
    }

    // Verify vendor exists
    const vendorRef = doc(serverDb, 'vendors', vendorId);
    const vendorDoc = await getDoc(vendorRef);

    if (!vendorDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      );
    }

    const vendorData = vendorDoc.data();

    // Prevent duplicate submissions
    if (vendorData.onboardingStatus === 'pending_approval') {
      return NextResponse.json(
        { success: false, error: 'Already submitted for review' },
        { status: 400 }
      );
    }

    // Update status to pending_approval
    // NOTE: Write BOTH fields for compatibility:
    // - 'onboardingStatus' → used by this vendor app
    // - 'status' → used by the admin panel (noe-admin) which queries where('status','==','pending')
    await updateDoc(vendorRef, {
      onboardingStatus: 'pending_approval',
      status: 'pending',
      onboardingStep: 3,
      updatedAt: serverTimestamp(),
    });

    console.log(`📤 Vendor ${vendorId} submitted for review`);

    return NextResponse.json({
      success: true,
      message: 'Submitted for review successfully',
    });

  } catch (error: any) {
    console.error('Submit for review error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit' },
      { status: 500 }
    );
  }
}
