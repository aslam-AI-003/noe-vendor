import { NextRequest, NextResponse } from 'next/server';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/vendor/otp/verify
// Verifies OTP for vendor registration/login
// Dev mode: accepts "1234" always
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, otp, purpose } = body;

    // Validation
    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Valid phone number required' },
        { status: 400 }
      );
    }

    if (!otp || otp.length !== 4) {
      return NextResponse.json(
        { success: false, error: 'Valid 4-digit OTP required' },
        { status: 400 }
      );
    }

    // In development: accept "1234" as universal OTP
    const isDev = process.env.NODE_ENV === 'development' || !process.env.OTP_PROVIDER;
    
    if (isDev) {
      if (otp === '1234') {
        return NextResponse.json({
          success: true,
          message: 'OTP verified successfully',
          verified: true,
          token: `dev_token_${phone}_${Date.now()}`, // Dev token
        });
      } else {
        return NextResponse.json(
          { success: false, error: 'Invalid OTP. Use 1234 for development.', verified: false },
          { status: 400 }
        );
      }
    }

    // Production: Verify against stored OTP or Firebase Auth
    // TODO: Implement real OTP verification
    // const storedOTP = await redis.get(`otp:${phone}`);
    // if (storedOTP !== otp) { ... }

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      verified: true,
      token: `token_${phone}_${Date.now()}`,
    });

  } catch (error: any) {
    console.error('OTP Verify Error:', error);
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}
