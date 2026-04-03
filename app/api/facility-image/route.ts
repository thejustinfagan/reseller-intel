import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('path');

  if (!filePath) {
    return NextResponse.json({ error: 'Missing path' }, { status: 400 });
  }

  // Security: only allow reading from facility-images directory
  const resolvedPath = path.resolve(filePath);
  const allowedDir = path.join(process.cwd(), 'facility-images');
  const homeFacilityDir = path.join(process.env.HOME || '', 'dev/reseller-intel/facility-images');

  if (!resolvedPath.startsWith(allowedDir) && !resolvedPath.startsWith(homeFacilityDir)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const imageBuffer = fs.readFileSync(resolvedPath);
    return new Response(imageBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
