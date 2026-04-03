import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

export async function GET() {
  try {
    const DB_PATH = path.join(process.cwd(), 'data', 'reseller-intel.db');
    const db = new Database(DB_PATH, { readonly: true });
    
    // Get next unreviewed enriched record, ordered by confidence_score ASC (lowest first)
    const company = db.prepare(`
      SELECT *
      FROM companies
      WHERE ai_analyzed_at IS NOT NULL
        AND qa_reviewed_at IS NULL
      ORDER BY confidence_score ASC
      LIMIT 1
    `).get() as any;
    
    db.close();
    
    if (!company) {
      return NextResponse.json({ company: null }, { status: 200 });
    }
    
    // Parse JSON fields
    if (company.brands_served && typeof company.brands_served === 'string') {
      try {
        company.brands_served = JSON.parse(company.brands_served);
      } catch {
        company.brands_served = [];
      }
    }
    
    if (company.parts_capabilities && typeof company.parts_capabilities === 'string') {
      try {
        company.parts_capabilities = JSON.parse(company.parts_capabilities);
      } catch {
        company.parts_capabilities = [];
      }
    }
    
    if (company.service_capabilities && typeof company.service_capabilities === 'string') {
      try {
        company.service_capabilities = JSON.parse(company.service_capabilities);
      } catch {
        company.service_capabilities = [];
      }
    }
    
    if (company.evidence_snippets && typeof company.evidence_snippets === 'string') {
      try {
        company.evidence_snippets = JSON.parse(company.evidence_snippets);
      } catch {
        company.evidence_snippets = [];
      }
    }
    
    if (company.deep_analysis && typeof company.deep_analysis === 'string') {
      try {
        company.deep_analysis = JSON.parse(company.deep_analysis);
      } catch {
        company.deep_analysis = null;
      }
    }
    
    return NextResponse.json({ company }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
