import { NextRequest, NextResponse } from 'next/server';
import { serverDb, doc, updateDoc, serverTimestamp } from '@/lib/firebaseAdmin';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/vendor/onboarding/step1
// Updates vendor with shop photo URL in Firestore
// Called when vendor uploads/captures shop front photo
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, shopPhotoUrl } = body;

    // Validation
    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'Vendor ID required' },
        { status: 400 }
      );
    }

    if (!shopPhotoUrl || !shopPhotoUrl.trim()) {
      return NextResponse.json(
        { success: false, error: 'Shop photo URL required' },
        { status: 400 }
      );
    }

    // Update Firestore vendor document
    const vendorRef = doc(serverDb, 'vendors', vendorId);
    await updateDoc(vendorRef, {
      shopPhotoUrl: shopPhotoUrl.trim(),
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ Step 1 complete: Shop photo saved for vendor ${vendorId}`);

    return NextResponse.json({
      success: true,
      message: 'Shop photo saved successfully',
    });

  } catch (error: any) {
    console.error('Step 1 API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save shop photo' },
      { status: 500 }
    );
  }
}
