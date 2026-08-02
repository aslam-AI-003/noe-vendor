import { NextRequest, NextResponse } from 'next/server';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/vendor/otp/send
// Sends OTP to vendor's phone number
// Currently: Simulated (always succeeds)
// Production: Integrate Twilio / MSG91 / Firebase Auth
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// In-memory OTP store (for development)
// Production: Use Redis or Firebase Auth phone verification
const otpStore = new Map<string, { otp: string; expiresAt: number; attempts: number }>();

function generateOTP(): string {
  // In development, always return 1234
  if (process.env.NODE_ENV === 'development' || !process.env.OTP_PROVIDER) {
    return '1234';
  }
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, purpose } = body;

    // Validation
    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Valid phone number required' },
        { status: 400 }
      );
    }

    if (!purpose || !['vendor_register', 'vendor_login'].includes(purpose)) {
      return NextResponse.json(
        { success: false, error: 'Invalid purpose' },
        { status: 400 }
      );
    }

    // Rate limiting: max 3 OTPs per phone per 10 minutes
    const existing = otpStore.get(phone);
    if (existing && existing.attempts >= 3 && existing.expiresAt > Date.now()) {
      return NextResponse.json(
        { success: false, error: 'Too many OTP requests. Try again in 10 minutes.' },
        { status: 429 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store OTP
    otpStore.set(phone, {
      otp,
      expiresAt,
      attempts: (existing?.attempts || 0) + 1,
    });

    // TODO: Send OTP via SMS provider
    // await sendSMS(phone, `Your NammaOoru Express OTP is: ${otp}`);

    console.log(`📱 OTP for ${phone}: ${otp} (purpose: ${purpose})`);

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      // Only include OTP in response during development
      ...(process.env.NODE_ENV === 'development' && { debug_otp: otp }),
    });

  } catch (error: any) {
    console.error('OTP Send Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
