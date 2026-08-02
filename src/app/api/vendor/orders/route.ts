import { NextRequest, NextResponse } from 'next/server';
import { serverDb, collection, doc, addDoc, getDocs, updateDoc, query, where, serverTimestamp } from '@/lib/firebaseAdmin';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ORDERS API — Vendor order management
// Stored in Firestore: orders/{orderId}
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// GET — Fetch orders for a vendor
export async function GET(request: NextRequest) {
  try {
    const vendorId = request.nextUrl.searchParams.get('vendorId');
    const status = request.nextUrl.searchParams.get('status');

    if (!vendorId) {
      return NextResponse.json({ success: false, error: 'vendorId required' }, { status: 400 });
    }

    let ordersQuery;
    if (status && status !== 'all') {
      ordersQuery = query(
        collection(serverDb, 'orders'),
        where('vendorId', '==', vendorId),
        where('status', '==', status)
      );
    } else {
      ordersQuery = query(
        collection(serverDb, 'orders'),
        where('vendorId', '==', vendorId)
      );
    }

    const snapshot = await getDocs(ordersQuery);
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort by createdAt desc (newest first)
    orders.sort((a: any, b: any) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    console.error('Orders GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST — Create a new order (simulates customer placing order)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, customerName, customerPhone, items, totalAmount, deliveryAddress } = body;

    if (!vendorId || !items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'vendorId and items required' }, { status: 400 });
    }

    const orderData = {
      vendorId,
      customerName: customerName || 'Customer',
      customerPhone: customerPhone || '+91XXXXXXXXXX',
      items,
      totalAmount: totalAmount || items.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0),
      deliveryAddress: deliveryAddress || 'Thanjavur',
      status: 'new', // new → accepted → preparing → ready → picked_up → delivered
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      orderId: 'NOE-' + Date.now().toString(36).toUpperCase(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(serverDb, 'orders'), orderData);

    console.log('🛒 New order created:', docRef.id, '| Vendor:', vendorId, '| Amount: ₹' + orderData.totalAmount);

    return NextResponse.json({
      success: true,
      message: 'Order placed',
      order: { id: docRef.id, ...orderData },
    });
  } catch (error: any) {
    console.error('Orders POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT — Update order status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, status, prepTime } = body;

    if (!orderId || !status) {
      return NextResponse.json({ success: false, error: 'orderId and status required' }, { status: 400 });
    }

    const validStatuses = ['new', 'accepted', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    const updateData: Record<string, any> = {
      status,
      updatedAt: serverTimestamp(),
    };

    if (status === 'accepted' && prepTime) {
      updateData.estimatedPrepTime = prepTime;
      updateData.acceptedAt = serverTimestamp();
    }
    // Extend prep time for preparing status
    if (status === 'preparing' && prepTime) {
      updateData.estimatedPrepTime = prepTime;
    }
    if (status === 'ready') {
      updateData.readyAt = serverTimestamp();
    }
    if (status === 'delivered') {
      updateData.deliveredAt = serverTimestamp();
      updateData.paymentStatus = 'completed';
    }
    if (status === 'cancelled') {
      updateData.cancelledAt = serverTimestamp();
    }

    await updateDoc(doc(serverDb, 'orders', orderId), updateData);

    console.log(`📦 Order ${orderId} → ${status}`);

    return NextResponse.json({ success: true, message: `Order ${status}` });
  } catch (error: any) {
    console.error('Orders PUT Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
