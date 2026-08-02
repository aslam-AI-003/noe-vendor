import { NextRequest, NextResponse } from 'next/server';
import { serverDb, collection, getDocs } from '@/lib/firebaseAdmin';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/admin/vendors — Fetch all vendors from Firestore
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function GET(request: NextRequest) {
  try {
    const vendorsRef = collection(serverDb, 'vendors');
    const snapshot = await getDocs(vendorsRef);

    const vendors = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort: pending_approval first, then by createdAt desc
    vendors.sort((a: any, b: any) => {
      if (a.onboardingStatus === 'pending_approval' && b.onboardingStatus !== 'pending_approval') return -1;
      if (b.onboardingStatus === 'pending_approval' && a.onboardingStatus !== 'pending_approval') return 1;
      return 0;
    });

    console.log(`📋 Admin: Fetched ${vendors.length} vendors`);

    return NextResponse.json({ success: true, vendors });
  } catch (error: any) {
    console.error('Admin vendors fetch error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
