import { NextRequest, NextResponse } from 'next/server';
import { serverDb, doc, updateDoc, serverTimestamp } from '@/lib/firebaseAdmin';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/admin/vendors/action
// Approve or Reject a vendor
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, action, reason } = body;

    if (!vendorId || !action) {
      return NextResponse.json(
        { success: false, error: 'vendorId and action required' },
        { status: 400 }
      );
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "approve" or "reject"' },
        { status: 400 }
      );
    }

    const vendorRef = doc(serverDb, 'vendors', vendorId);

    if (action === 'approve') {
      await updateDoc(vendorRef, {
        onboardingStatus: 'approved',
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        rejectionReason: null,
      });
      console.log('✅ Admin APPROVED vendor:', vendorId);
    } else {
      if (!reason) {
        return NextResponse.json(
          { success: false, error: 'Rejection reason required' },
          { status: 400 }
        );
      }
      await updateDoc(vendorRef, {
        onboardingStatus: 'rejected',
        rejectionReason: reason,
        rejectedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('❌ Admin REJECTED vendor:', vendorId, '| Reason:', reason);
    }

    return NextResponse.json({
      success: true,
      message: `Vendor ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
    });

  } catch (error: any) {
    console.error('Admin action error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
