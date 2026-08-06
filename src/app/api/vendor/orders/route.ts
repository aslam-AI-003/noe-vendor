import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

// GET: Fetch orders for a vendor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      return NextResponse.json({ success: false, error: 'vendorId required' }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ success: false, error: 'Firebase not initialized' }, { status: 500 });
    }

    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('vendorId', '==', vendorId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const orders = snapshot.docs.map(d => ({
      id: d.id,
      orderId: d.id,
      ...d.data(),
    }));

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    console.error('GET /api/vendor/orders error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Update order status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, status, prepTime } = body;

    if (!orderId || !status) {
      return NextResponse.json({ success: false, error: 'orderId and status required' }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ success: false, error: 'Firebase not initialized' }, { status: 500 });
    }

    const orderRef = doc(db, 'orders', orderId);
    const updateData: any = {
      status,
      updatedAt: serverTimestamp(),
    };

    // Add extra fields based on status
    if (status === 'accepted' && prepTime) {
      updateData.estimatedPrepTime = prepTime;
      updateData.acceptedAt = serverTimestamp();
    }
    if (status === 'ready') {
      updateData.readyAt = serverTimestamp();
    }

    await updateDoc(orderRef, updateData);

    return NextResponse.json({ success: true, message: `Order updated to ${status}` });
  } catch (error: any) {
    console.error('PUT /api/vendor/orders error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
