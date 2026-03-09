import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs';
import Database from 'better-sqlite3';

const DB_PATH = process.env.SQLITE_DB_PATH || path.join(process.cwd(), 'data', 'reseller-intel.db');
const MAX_EXPORT_LIMIT = 5000;
const DEFAULT_EXPORT_LIMIT = 1000;

const EXPORT_COLUMNS = [
  'company_name', 'brand', 'address', 'city', 'state', 'zip', 'phone',
  'latitude', 'longitude',
] as const;

type ExportColumn = (typeof EXPORT_COLUMNS)[number];

export const runtime = 'nodejs';

function escapeCsvValue(value: string | null): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const brand = searchParams.get('brand');
  const state = searchParams.get('state');
  const search = searchParams.get('search');
  const limitRaw = searchParams.get('limit');

  const limit = Math.min(
    Math.max(Number.parseInt(limitRaw || '', 10) || DEFAULT_EXPORT_LIMIT, 1),
    MAX_EXPORT_LIMIT,
  );

  if (!fs.existsSync(DB_PATH)) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  try {
    const db = new Database(DB_PATH, { readonly: true });
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (brand) {
      conditions.push("LOWER(brand) LIKE ?");
      params.push(`%${brand.toLowerCase()}%`);
    }
    if (state) {
      conditions.push("UPPER(state) = ?");
      params.push(state.toUpperCase());
    }
    if (search) {
      conditions.push("(company_name LIKE ? OR city LIKE ? OR address LIKE ?)");
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `SELECT ${EXPORT_COLUMNS.join(', ')} FROM oem_dealers ${where} ORDER BY state, city, company_name LIMIT ?`;
    params.push(limit);

    const rows = db.prepare(query).all(...params) as Record<ExportColumn, string | null>[];
    db.close();

    const csvRows = [EXPORT_COLUMNS.join(',')];
    for (const row of rows) {
      csvRows.push(EXPORT_COLUMNS.map((col) => escapeCsvValue(row[col])).join(','));
    }

    const today = new Date().toISOString().slice(0, 10);
    return new NextResponse(csvRows.join('\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="oem-dealers-export-${today}.csv"`,
      },
    });
  } catch (err) {
    console.error('OEM export error:', err);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
