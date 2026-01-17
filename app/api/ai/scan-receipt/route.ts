import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { scanReceipt } from '@/lib/claude';

// POST /api/ai/scan-receipt - Scan a receipt image
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('receipt') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No receipt image provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // Scan the receipt with Claude Haiku
    const receiptData = await scanReceipt(base64, file.type);

    return NextResponse.json(receiptData);
  } catch (error) {
    console.error('Error scanning receipt:', error);
    return NextResponse.json(
      { error: 'Failed to scan receipt. Please try again.' },
      { status: 500 }
    );
  }
}
