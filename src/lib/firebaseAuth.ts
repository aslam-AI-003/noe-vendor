import { auth } from './firebase';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Firebase Phone Auth — Real OTP via Firebase
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let recaptchaVerifier: RecaptchaVerifier | null = null;
let confirmationResult: ConfirmationResult | null = null;

/**
 * Initialize invisible reCAPTCHA on a button element
 * Must be called before sendOTP
 */
export function setupRecaptcha(buttonId: string) {
  if (!auth) {
    console.error('Firebase Auth not initialized');
    return;
  }

  // If already set up, don't re-create
  if (recaptchaVerifier) {
    return;
  }

  // Wait for DOM element to exist
  const el = document.getElementById(buttonId);
  if (!el) {
    // Retry after a short delay if element not yet in DOM
    setTimeout(() => setupRecaptcha(buttonId), 200);
    return;
  }

  try {
    recaptchaVerifier = new RecaptchaVerifier(auth, buttonId, {
      size: 'invisible',
      callback: () => {
        console.log('✅ reCAPTCHA solved');
      },
      'expired-callback': () => {
        console.log('⚠️ reCAPTCHA expired');
        recaptchaVerifier = null;
      },
    });
  } catch (err: any) {
    // Handle "already rendered" error gracefully
    if (err.message?.includes('already been rendered')) {
      console.log('reCAPTCHA already rendered, reusing');
    } else {
      console.error('reCAPTCHA setup error:', err);
    }
  }
}

/**
 * Send OTP to phone number via Firebase Phone Auth
 * @param phoneNumber - Full phone number with country code (e.g., +919876543210)
 * @returns true if OTP sent successfully
 */
export async function sendFirebaseOTP(phoneNumber: string): Promise<boolean> {
  if (!auth) {
    throw new Error('Firebase Auth not initialized');
  }

  if (!recaptchaVerifier) {
    throw new Error('reCAPTCHA not initialized. Call setupRecaptcha() first.');
  }

  try {
    confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    console.log('📱 Firebase OTP sent to:', phoneNumber);
    return true;
  } catch (error: any) {
    console.error('Firebase OTP send error:', error);
    
    // Reset recaptcha on error
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
      recaptchaVerifier = null;
    }
    
    // User-friendly error messages
    if (error.code === 'auth/invalid-phone-number') {
      throw new Error('Invalid phone number format');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many OTP requests. Try again later.');
    } else if (error.code === 'auth/quota-exceeded') {
      throw new Error('SMS quota exceeded. Try again tomorrow.');
    } else {
      throw new Error(error.message || 'Failed to send OTP');
    }
  }
}

/**
 * Verify OTP code entered by user
 * @param otpCode - 6-digit OTP code
 * @returns Firebase User UID if verified
 */
export async function verifyFirebaseOTP(otpCode: string): Promise<{ uid: string; phone: string }> {
  if (!confirmationResult) {
    throw new Error('No OTP sent yet. Send OTP first.');
  }

  try {
    const result = await confirmationResult.confirm(otpCode);
    const user = result.user;
    console.log('✅ OTP verified! UID:', user.uid, 'Phone:', user.phoneNumber);
    
    return {
      uid: user.uid,
      phone: user.phoneNumber || '',
    };
  } catch (error: any) {
    console.error('Firebase OTP verify error:', error);
    
    if (error.code === 'auth/invalid-verification-code') {
      throw new Error('Invalid OTP. Please try again.');
    } else if (error.code === 'auth/code-expired') {
      throw new Error('OTP expired. Request a new one.');
    } else {
      throw new Error(error.message || 'Verification failed');
    }
  }
}

/**
 * Clean up reCAPTCHA verifier
 */
export function cleanupRecaptcha() {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
  confirmationResult = null;
}
