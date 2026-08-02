import { NextRequest, NextResponse } from 'next/server';
import { serverDb, doc, updateDoc, getDoc, serverTimestamp } from '@/lib/firebaseAdmin';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SETTINGS API — Save/Load vendor shop settings
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// GET — Fetch vendor settings
export async function GET(request: NextRequest) {
  try {
    const vendorId = request.nextUrl.searchParams.get('vendorId');
    if (!vendorId) {
      return NextResponse.json({ success: false, error: 'vendorId required' }, { status: 400 });
    }

    const vendorRef = doc(serverDb, 'vendors', vendorId);
    const vendorDoc = await getDoc(vendorRef);

    if (!vendorDoc.exists()) {
      return NextResponse.json({ success: false, error: 'Vendor not found' }, { status: 404 });
    }

    const data = vendorDoc.data();
    return NextResponse.json({ success: true, settings: data });
  } catch (error: any) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT — Update vendor settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, ...settingsData } = body;

    if (!vendorId) {
      return NextResponse.json({ success: false, error: 'vendorId required' }, { status: 400 });
    }

    const vendorRef = doc(serverDb, 'vendors', vendorId);

    // Only allow specific fields to be updated
    const allowedFields: Record<string, any> = {};
    const editableKeys = [
      'shopName', 'shopNameTamil', 'phone', 'email', 'address', 'city', 'pincode',
      'gst', 'fssai', 'description', 'minOrder', 'deliveryRadius', 'prepTime',
      'operatingHours', 'holidayMode', 'upiId', 'accountNumber', 'ifsc', 'bankName',
      // Document numbers
      'fssaiNumber', 'gstNumber', 'panNumber',
      // Document URLs
      'fssaiUrl', 'gstUrl', 'panUrl', 'aadhaarUrl', 'bankDocUrl',
    ];

    editableKeys.forEach(key => {
      if (settingsData[key] !== undefined) {
        allowedFields[key] = settingsData[key];
      }
    });

    allowedFields.updatedAt = serverTimestamp();

    await updateDoc(vendorRef, allowedFields);

    console.log('⚙️ Settings saved for vendor:', vendorId, '| Fields:', Object.keys(allowedFields).join(', '));

    return NextResponse.json({ success: true, message: 'Settings saved' });
  } catch (error: any) {
    console.error('Settings PUT error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
