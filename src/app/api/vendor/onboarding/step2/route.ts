import { NextRequest, NextResponse } from 'next/server';
import { serverDb, doc, updateDoc, serverTimestamp } from '@/lib/firebaseAdmin';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/vendor/onboarding/step2
// Updates vendor with address + bank/UPI details in Firestore
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      vendorId,
      address, landmark, city, pincode, lat, lng,
      paymentMode, upiId, bankName, accountNumber, ifscCode, accountHolder,
    } = body;

    // Validation
    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'Vendor ID required' },
        { status: 400 }
      );
    }

    if (!address || address.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'Valid address required' },
        { status: 400 }
      );
    }

    if (!pincode || pincode.length !== 6) {
      return NextResponse.json(
        { success: false, error: 'Valid 6-digit pincode required' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: Record<string, any> = {
      address: address.trim(),
      landmark: landmark?.trim() || null,
      city: city || 'Thanjavur',
      pincode,
      lat: lat || null,
      lng: lng || null,
      paymentMode,
      onboardingStep: 2,
      updatedAt: serverTimestamp(),
    };

    // Add payment details based on mode
    if (paymentMode === 'upi') {
      if (!upiId || !upiId.trim()) {
        return NextResponse.json(
          { success: false, error: 'UPI ID required' },
          { status: 400 }
        );
      }
      updateData.upiId = upiId.trim();
      updateData.bankName = null;
      updateData.accountNumber = null;
      updateData.ifscCode = null;
      updateData.accountHolder = null;
    } else if (paymentMode === 'bank') {
      if (!accountNumber || !ifscCode || !accountHolder) {
        return NextResponse.json(
          { success: false, error: 'All bank details required' },
          { status: 400 }
        );
      }
      updateData.upiId = null;
      updateData.bankName = bankName?.trim() || null;
      updateData.accountNumber = accountNumber.trim();
      updateData.ifscCode = ifscCode.trim().toUpperCase();
      updateData.accountHolder = accountHolder.trim();
    }

    // ━━━━ Update Firestore ━━━━
    await updateDoc(doc(serverDb, 'vendors', vendorId), updateData);

    console.log('✅ Step 2 saved to Firestore:', vendorId, '| Address:', address.slice(0, 30), '| Payment:', paymentMode);

    return NextResponse.json({
      success: true,
      message: 'Address & payment details saved',
    });

  } catch (error: any) {
    console.error('Step 2 Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
