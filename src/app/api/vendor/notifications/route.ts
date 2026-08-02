import { NextRequest, NextResponse } from 'next/server';
import { serverDb, doc, updateDoc, collection, addDoc, getDocs, query, where, serverTimestamp } from '@/lib/firebaseAdmin';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NOTIFICATIONS API
// Stores FCM token + manages notification history
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// POST — Save FCM token for a vendor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, fcmToken, action } = body;

    if (!vendorId) {
      return NextResponse.json({ success: false, error: 'vendorId required' }, { status: 400 });
    }

    // Save FCM token
    if (action === 'save_token' && fcmToken) {
      await updateDoc(doc(serverDb, 'vendors', vendorId), {
        fcmToken,
        notificationsEnabled: true,
        updatedAt: serverTimestamp(),
      });
      console.log('🔔 FCM token saved for vendor:', vendorId);
      return NextResponse.json({ success: true, message: 'FCM token saved' });
    }

    // Send a notification (store in Firestore for now — real FCM needs server key)
    if (action === 'send') {
      const { title, body: notifBody, type } = body;
      await addDoc(collection(serverDb, 'vendors', vendorId, 'notifications'), {
        title: title || 'New Notification',
        body: notifBody || '',
        type: type || 'general',
        read: false,
        createdAt: serverTimestamp(),
      });
      console.log('📨 Notification stored for:', vendorId, '|', title);
      return NextResponse.json({ success: true, message: 'Notification sent' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Notification error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// GET — Fetch notifications for a vendor
export async function GET(request: NextRequest) {
  try {
    const vendorId = request.nextUrl.searchParams.get('vendorId');
    if (!vendorId) {
      return NextResponse.json({ success: false, error: 'vendorId required' }, { status: 400 });
    }

    const notifsRef = collection(serverDb, 'vendors', vendorId, 'notifications');
    const snapshot = await getDocs(notifsRef);

    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort newest first
    notifications.sort((a: any, b: any) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });

    return NextResponse.json({ success: true, notifications });
  } catch (error: any) {
    console.error('Get notifications error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
