import { NextRequest, NextResponse } from 'next/server';
import { serverDb, doc, collection, addDoc, updateDoc, deleteDoc, getDocs, query, where, serverTimestamp } from '@/lib/firebaseAdmin';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MENU API — CRUD operations for vendor menu items
// Stored in Firestore: vendors/{vendorId}/menu/{itemId}
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// GET — Fetch all menu items for a vendor
export async function GET(request: NextRequest) {
  try {
    const vendorId = request.nextUrl.searchParams.get('vendorId');
    if (!vendorId) {
      return NextResponse.json({ success: false, error: 'vendorId required' }, { status: 400 });
    }

    const menuRef = collection(serverDb, 'vendors', vendorId, 'menu');
    const snapshot = await getDocs(menuRef);
    
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    console.error('Menu GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST — Add a new menu item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, ...itemData } = body;

    if (!vendorId) {
      return NextResponse.json({ success: false, error: 'vendorId required' }, { status: 400 });
    }
    if (!itemData.name || !itemData.price) {
      return NextResponse.json({ success: false, error: 'name and price required' }, { status: 400 });
    }

    const menuRef = collection(serverDb, 'vendors', vendorId, 'menu');
    const docRef = await addDoc(menuRef, {
      ...itemData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Menu item added:', docRef.id, itemData.name, `₹${itemData.price}`);

    return NextResponse.json({
      success: true,
      message: 'Menu item added',
      item: { id: docRef.id, ...itemData },
    });
  } catch (error: any) {
    console.error('Menu POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT — Update a menu item
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, itemId, ...updates } = body;

    if (!vendorId || !itemId) {
      return NextResponse.json({ success: false, error: 'vendorId and itemId required' }, { status: 400 });
    }

    const itemRef = doc(serverDb, 'vendors', vendorId, 'menu', itemId);
    await updateDoc(itemRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Menu item updated:', itemId);

    return NextResponse.json({ success: true, message: 'Menu item updated' });
  } catch (error: any) {
    console.error('Menu PUT Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE — Remove a menu item
export async function DELETE(request: NextRequest) {
  try {
    const vendorId = request.nextUrl.searchParams.get('vendorId');
    const itemId = request.nextUrl.searchParams.get('itemId');

    if (!vendorId || !itemId) {
      return NextResponse.json({ success: false, error: 'vendorId and itemId required' }, { status: 400 });
    }

    const itemRef = doc(serverDb, 'vendors', vendorId, 'menu', itemId);
    await deleteDoc(itemRef);

    console.log('🗑️ Menu item deleted:', itemId);

    return NextResponse.json({ success: true, message: 'Menu item deleted' });
  } catch (error: any) {
    console.error('Menu DELETE Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
