import { NextRequest, NextResponse } from 'next/server';
import { serverDb, doc, updateDoc, getDoc, getDocs, collection, serverTimestamp } from '@/lib/firebaseAdmin';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/vendor/onboarding/submit
// STRICT VALIDATION — Vendor CANNOT submit unless ALL mandatory fields are filled
// Like Swiggy/Zomato: prevents fake/incomplete shops from getting approved
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface ValidationError {
  field: string;
  message: string;
}

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

    const v = vendorDoc.data();

    // Prevent duplicate submissions
    if (v.onboardingStatus === 'pending_approval') {
      return NextResponse.json(
        { success: false, error: 'Already submitted for review' },
        { status: 400 }
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STRICT VALIDATION — All mandatory fields must be filled
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const errors: ValidationError[] = [];

    // 1. Shop Photo
    if (!v.shopPhotoUrl) {
      errors.push({ field: 'shopPhoto', message: 'Shop photo is required' });
    }

    // 2. Shop Name & Type
    if (!v.shopName || v.shopName.trim().length < 2) {
      errors.push({ field: 'shopName', message: 'Shop name is required (min 2 chars)' });
    }
    if (!v.shopType) {
      errors.push({ field: 'shopType', message: 'Shop type/category is required' });
    }

    // 3. Address
    if (!v.address || v.address.trim().length < 5) {
      errors.push({ field: 'address', message: 'Full address is required' });
    }
    if (!v.city) {
      errors.push({ field: 'city', message: 'City is required' });
    }
    if (!v.pincode || v.pincode.length < 6) {
      errors.push({ field: 'pincode', message: 'Valid pincode is required' });
    }

    // 4. Bank Details — MUST have either UPI OR full bank account
    const hasUPI = v.upiId && v.upiId.trim().length > 3;
    const hasBankAccount = v.accountNumber && v.ifscCode && (v.accountHolderName || v.accountHolder);
    if (!hasUPI && !hasBankAccount) {
      errors.push({ field: 'bank', message: 'Bank account (Account Number + IFSC + Holder Name) OR UPI ID is required' });
    }

    // 5. KYC — Aadhaar is MANDATORY
    if (!v.aadhaarUrl) {
      errors.push({ field: 'aadhaar', message: 'Aadhaar card upload is mandatory' });
    }

    // 6. Bank Proof — Cancelled cheque or passbook photo is MANDATORY
    if (!v.bankDocUrl) {
      errors.push({ field: 'bankProof', message: 'Bank proof (cancelled cheque/passbook photo) is mandatory' });
    }

    // 7. Menu Items — Minimum 5 items required
    const menuRef = collection(serverDb, 'vendors', vendorId, 'menu');
    const menuSnapshot = await getDocs(menuRef);
    const menuCount = menuSnapshot.docs.length;
    if (menuCount < 5) {
      errors.push({ field: 'menu', message: `Minimum 5 menu items required (you have ${menuCount})` });
    }

    // 8. Operating Hours
    if (!v.operatingHours || !Array.isArray(v.operatingHours) || v.operatingHours.length === 0) {
      errors.push({ field: 'hours', message: 'Operating hours must be set' });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // If ANY validation fails, reject submission with detailed errors
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (errors.length > 0) {
      console.log(`❌ Vendor ${vendorId} submission BLOCKED — ${errors.length} missing fields:`, errors.map(e => e.field));
      return NextResponse.json({
        success: false,
        error: `Cannot submit: ${errors.length} required field(s) missing`,
        missingFields: errors,
      }, { status: 400 });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ALL CHECKS PASSED — Update status to pending_approval
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    await updateDoc(vendorRef, {
      onboardingStatus: 'pending_approval',
      status: 'pending',
      onboardingStep: 3,
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Store verification metadata
      menuItemCount: menuCount,
      verificationData: {
        hasShopPhoto: !!v.shopPhotoUrl,
        hasAddress: !!v.address,
        hasBankDetails: hasUPI || hasBankAccount,
        hasAadhaar: !!v.aadhaarUrl,
        hasBankProof: !!v.bankDocUrl,
        hasOperatingHours: true,
        menuCount,
        submittedAt: new Date().toISOString(),
      },
    });

    console.log(`✅ Vendor ${vendorId} submitted for review — ALL ${8} checks passed`);

    return NextResponse.json({
      success: true,
      message: 'Submitted for review successfully! All mandatory documents verified.',
    });

  } catch (error: any) {
    console.error('Submit for review error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit' },
      { status: 500 }
    );
  }
}
