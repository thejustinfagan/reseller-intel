import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

export async function GET() {
  try {
    const DB_PATH = path.join(process.cwd(), 'data', 'reseller-intel.db');
    const db = new Database(DB_PATH, { readonly: true });
    
    const totalEnriched = db.prepare(`
      SELECT COUNT(*) as count
      FROM companies
      WHERE ai_analyzed_at IS NOT NULL
    `).get() as any;
    
    const totalReviewed = db.prepare(`
      SELECT COUNT(*) as count
      FROM companies
      WHERE qa_reviewed_at IS NOT NULL
    `).get() as any;
    
    const totalApproved = db.prepare(`
      SELECT COUNT(*) as count
      FROM companies
      WHERE qa_approved = TRUE
    `).get() as any;
    
    const totalFlagged = db.prepare(`
      SELECT COUNT(*) as count
      FROM companies
      WHERE qa_flagged = TRUE
    `).get() as any;
    
    db.close();
    
    return NextResponse.json({
      total_enriched: totalEnriched.count,
      total_reviewed: totalReviewed.count,
      total_approved: totalApproved.count,
      total_flagged: totalFlagged.count,
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
