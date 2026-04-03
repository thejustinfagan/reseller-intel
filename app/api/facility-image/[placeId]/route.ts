import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { placeId: string } }
) {
  try {
    const placeId = params.placeId;
    const imagePath = path.join(process.cwd(), 'facility-images', `${placeId}.jpg`);
    
    if (!fs.existsSync(imagePath)) {
      return new NextResponse('Image not found', { status: 404 });
    }
    
    const imageBuffer = fs.readFileSync(imagePath);
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving facility image:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
