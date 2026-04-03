import { NextResponse } from 'next/server';

// Skip just returns success - no DB change needed
// The client will call /api/qa/next to get the next record
export async function POST() {
  return NextResponse.json({ success: true }, { status: 200 });
}
