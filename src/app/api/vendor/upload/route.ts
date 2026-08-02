import { NextRequest, NextResponse } from 'next/server';
import { serverStorage, ref, uploadBytes, getDownloadURL } from '@/lib/firebaseAdmin';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/vendor/upload
// Handles file uploads to Firebase Storage
// Files stored at: vendors/{vendorId}/{fileType}_{timestamp}.{ext}
// Returns permanent Firebase Storage download URL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const vendorId = formData.get('vendorId') as string | null;
    const fileType = formData.get('fileType') as string | null; // shop_photo, aadhaar, pan, fssai

    // Validation
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'Vendor ID required' },
        { status: 400 }
      );
    }

    if (!fileType || !['shop_photo', 'aadhaar', 'pan', 'fssai', 'gst', 'bank_proof'].includes(fileType)) {
      return NextResponse.json(
        { success: false, error: 'Valid file type required (shop_photo, aadhaar, pan, fssai, gst, bank_proof)' },
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum 5MB allowed.' },
        { status: 400 }
      );
    }

    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Allowed: JPEG, PNG, WebP, PDF' },
        { status: 400 }
      );
    }

    // Generate storage path
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${fileType}_${Date.now()}.${ext}`;
    const storagePath = `vendors/${vendorId}/${filename}`;

    // Upload to Firebase Storage
    const storageRef = ref(serverStorage, storagePath);
    const bytes = await file.arrayBuffer();
    const buffer = new Uint8Array(bytes);
    
    await uploadBytes(storageRef, buffer, {
      contentType: file.type,
      customMetadata: {
        vendorId,
        fileType,
        originalName: file.name,
      },
    });

    // Get permanent download URL
    const downloadUrl = await getDownloadURL(storageRef);

    console.log(`📁 File uploaded to Firebase Storage: ${storagePath} (${fileType} for ${vendorId})`);
    console.log(`   URL: ${downloadUrl}`);

    return NextResponse.json({
      success: true,
      message: 'File uploaded to Firebase Storage',
      url: downloadUrl,
      storagePath,
      fileType,
      size: file.size,
    });

  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json(
      { success: false, error: 'Upload failed: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
