import { NextRequest, NextResponse } from 'next/server';
import { serverDb, doc, updateDoc, getDoc, serverTimestamp } from '@/lib/firebaseAdmin';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VENDOR STATUS API — Online/Offline Toggle
// Persists to Firestore so customer app knows if shop is open
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// GET — Fetch current shop status
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
    return NextResponse.json({
      success: true,
      isOnline: data.isOnline ?? true,
      lastStatusChange: data.lastStatusChange || null,
    });
  } catch (error: any) {
    console.error('Status GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT — Toggle online/offline status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, isOnline } = body;

    if (!vendorId) {
      return NextResponse.json({ success: false, error: 'vendorId required' }, { status: 400 });
    }

    if (typeof isOnline !== 'boolean') {
      return NextResponse.json({ success: false, error: 'isOnline must be boolean' }, { status: 400 });
    }

    const vendorRef = doc(serverDb, 'vendors', vendorId);
    await updateDoc(vendorRef, {
      isOnline,
      lastStatusChange: serverTimestamp(),
    });

    const statusText = isOnline ? '🟢 Online' : '🔴 Offline';
    console.log(`📍 Vendor ${vendorId} is now ${statusText}`);

    return NextResponse.json({
      success: true,
      isOnline,
      message: `Shop is now ${isOnline ? 'Online' : 'Offline'}`,
    });
  } catch (error: any) {
    console.error('Status PUT error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
