import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'reseller-intel.db');

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  let db: Database.Database | null = null;

  try {
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get('brand') || '';
    const state = searchParams.get('state') || '';
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50));

    if (!fs.existsSync(DB_PATH)) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    db = new Database(DB_PATH, { readonly: true });

    // Check if oem_dealers table exists
    const tableCheck = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='oem_dealers'"
    ).get();
    if (!tableCheck) {
      return NextResponse.json({ error: 'OEM dealers table not yet populated' }, { status: 503 });
    }

    const conditions: string[] = [];
    const params: any[] = [];

    if (brand) {
      conditions.push('LOWER(brand) = ?');
      params.push(brand.toLowerCase());
    }
    if (state) {
      conditions.push('state = ?');
      params.push(state.toUpperCase());
    }
    if (search) {
      conditions.push('(company_name LIKE ? OR city LIKE ? OR address LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = db.prepare(`SELECT COUNT(*) as total FROM oem_dealers ${where}`).get(params) as any;
    const total = countResult?.total || 0;
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    const dealers = db.prepare(`
      SELECT id, company_name, address, city, state, zip, phone, website,
             dealer_type, brand, latitude, longitude, scraped_at
      FROM oem_dealers ${where}
      ORDER BY brand, state, city, company_name
      LIMIT ? OFFSET ?
    `).all([...params, limit, offset]);

    // Brand summary
    const brandSummary = db.prepare(`
      SELECT brand, COUNT(*) as count FROM oem_dealers GROUP BY brand ORDER BY brand
    `).all();

    return NextResponse.json({
      dealers,
      brands: brandSummary,
      pagination: { currentPage: page, totalPages, totalCount: total, limit, hasMore: page < totalPages }
    });
  } catch (error) {
    console.error('OEM dealers query error:', error);
    return NextResponse.json({ error: 'Failed to fetch OEM dealers' }, { status: 500 });
  } finally {
    if (db) db.close();
  }
}
