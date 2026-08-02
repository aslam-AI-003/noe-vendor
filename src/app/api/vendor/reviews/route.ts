import { NextRequest, NextResponse } from 'next/server';
import { serverDb, collection, doc, addDoc, getDocs, updateDoc, query, where, serverTimestamp } from '@/lib/firebaseAdmin';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REVIEWS API — Customer reviews for vendors
// Stored in Firestore: reviews/{reviewId}
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// GET — Fetch reviews for a vendor
export async function GET(request: NextRequest) {
  try {
    const vendorId = request.nextUrl.searchParams.get('vendorId');
    if (!vendorId) {
      return NextResponse.json({ success: false, error: 'vendorId required' }, { status: 400 });
    }

    const reviewsQuery = query(
      collection(serverDb, 'reviews'),
      where('vendorId', '==', vendorId)
    );
    const snapshot = await getDocs(reviewsQuery);

    const reviews = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort by date (newest first)
    reviews.sort((a: any, b: any) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });

    return NextResponse.json({ success: true, reviews });
  } catch (error: any) {
    console.error('Reviews GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST — Add a review (from customer side / test) or reply to a review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Vendor replies to a review
    if (action === 'reply') {
      const { reviewId, reply } = body;
      if (!reviewId || !reply) {
        return NextResponse.json({ success: false, error: 'reviewId and reply required' }, { status: 400 });
      }
      await updateDoc(doc(serverDb, 'reviews', reviewId), {
        reply,
        repliedAt: serverTimestamp(),
      });
      console.log('💬 Vendor replied to review:', reviewId);
      return NextResponse.json({ success: true, message: 'Reply added' });
    }

    // Create a new review (for testing / customer app)
    const { vendorId, customerName, rating, text, orderId } = body;
    if (!vendorId || !rating) {
      return NextResponse.json({ success: false, error: 'vendorId and rating required' }, { status: 400 });
    }

    const reviewData = {
      vendorId,
      customerName: customerName || 'Customer',
      rating: Number(rating),
      text: text || '',
      orderId: orderId || '',
      reply: null,
      repliedAt: null,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(serverDb, 'reviews'), reviewData);
    console.log('⭐ New review added:', docRef.id, '| Vendor:', vendorId, '| Rating:', rating);

    return NextResponse.json({ success: true, review: { id: docRef.id, ...reviewData } });
  } catch (error: any) {
    console.error('Reviews POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
