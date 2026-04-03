import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    
    const DB_PATH = path.join(process.cwd(), 'data', 'reseller-intel.db');
    const db = new Database(DB_PATH);
    
    const now = new Date().toISOString();
    
    db.prepare(`
      UPDATE companies
      SET qa_approved = TRUE,
          qa_reviewed_at = ?
      WHERE id = ?
    `).run(now, id);
    
    db.close();
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
