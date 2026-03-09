import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'reseller-intel.db');

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get('brand') || '';
    const state = searchParams.get('state') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') ?? searchParams.get('pageSize') ?? '50');

    if (!fs.existsSync(DB_PATH)) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const db = new Database(DB_PATH, { readonly: true });

    // Check if oem_dealers table exists
    const tableCheck = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='oem_dealers'"
    ).get();
    if (!tableCheck) {
      db.close();
      return NextResponse.json({ error: 'OEM dealers table not populated yet' }, { status: 503 });
    }

    const whereConditions: string[] = [];
    const params: any[] = [];

    if (brand) {
      // Use LIKE for partial brand matching so "Mack" matches "Mack Trucks"
      whereConditions.push('LOWER(brand) LIKE ?');
      params.push(`%${brand.toLowerCase()}%`);
    }

    if (state) {
      whereConditions.push('UPPER(state) = ?');
      params.push(state.toUpperCase());
    }

    if (search) {
      whereConditions.push('(LOWER(company_name) LIKE ? OR LOWER(city) LIKE ? OR LOWER(address) LIKE ?)');
      const term = `%${search.toLowerCase()}%`;
      params.push(term, term, term);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const countResult = db.prepare(`SELECT COUNT(*) as total FROM oem_dealers ${whereClause}`).get(params) as any;
    const totalCount = countResult.total;
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(totalCount / limit);

    const dealers = db.prepare(`
      SELECT id, company_name, address, city, state, zip, phone, website, dealer_type, brand, latitude, longitude, scraped_at
      FROM oem_dealers ${whereClause}
      ORDER BY brand, company_name
      LIMIT ? OFFSET ?
    `).all([...params, limit, offset]);

    // Brand summary
    const brands = db.prepare('SELECT brand, COUNT(*) as count FROM oem_dealers GROUP BY brand ORDER BY brand').all();

    db.close();

    return NextResponse.json({
      dealers,
      brands,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasMore: page < totalPages
      }
    });
  } catch (error) {
    console.error('OEM dealers error:', error);
    return NextResponse.json({ error: 'Failed to fetch OEM dealers' }, { status: 500 });
  }
}
