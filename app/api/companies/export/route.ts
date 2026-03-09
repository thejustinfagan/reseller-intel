import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { buildChunkedInClause, getZipCodesWithinRadius, normalizeZip } from '@/lib/zip-radius';

const DB_PATH = path.join(process.cwd(), 'data', 'reseller-intel.db');
const DEFAULT_RADIUS_MILES = 50;
const ZIP5_CLEAN_COLUMN_SQL = 'zip5_clean';
const DEFAULT_EXPORT_LIMIT = 1000;
const MAX_EXPORT_LIMIT = 5000;

const EXPORT_COLUMNS = [
  'company_name',
  'normalized_name',
  'full_address',
  'city',
  'state',
  'zip_code',
  'primary_phone',
  'secondary_phone',
  'company_detail_url',
  'input_service_type',
  'input_sub_service_type',
  'features',
] as const;

type ExportColumn = (typeof EXPORT_COLUMNS)[number];

interface QueryFilters {
  search: string;
  state: string;
  serviceType: string;
  subServiceType: string;
  nearZip: string;
  radiusMiles?: number;
  limit: number;
}

type CompanyExportRow = Record<ExportColumn, string | null>;

export const runtime = 'nodejs';

function parseRadiusMiles(value: string | null): number | null {
  if (!value || value.trim() === '') {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.round(parsed);
}

function parseLimit(value: string | null): number {
  if (!value || value.trim() === '') {
    return DEFAULT_EXPORT_LIMIT;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_EXPORT_LIMIT;
  }

  return Math.min(parsed, MAX_EXPORT_LIMIT);
}

function escapeCsvValue(value: string | null): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function buildExportFilename(): string {
  const dateStamp = new Date().toISOString().slice(0, 10);
  return `reseller-intel-export-${dateStamp}.csv`;
}

export async function GET(request: NextRequest) {
  let db: Database.Database | null = null;

  try {
    const { searchParams } = new URL(request.url);

    const nearZipParam = searchParams.get('nearZip');
    const nearZip = normalizeZip(nearZipParam);
    if (nearZipParam && !nearZip) {
      return NextResponse.json(
        { error: 'Invalid nearZip parameter. Expected a 5-digit ZIP code.' },
        { status: 400 }
      );
    }

    const radiusMilesParam = searchParams.get('radiusMiles');
    const parsedRadiusMiles = parseRadiusMiles(radiusMilesParam);
    if (nearZip && radiusMilesParam && parsedRadiusMiles === null) {
      return NextResponse.json(
        { error: 'Invalid radiusMiles parameter. Expected a positive number of miles.' },
        { status: 400 }
      );
    }

    const filters: QueryFilters = {
      search: searchParams.get('search') || '',
      state: searchParams.get('state') || '',
      serviceType: searchParams.get('serviceType') || '',
      subServiceType: searchParams.get('subServiceType') || '',
      nearZip: nearZip || '',
      radiusMiles: nearZip ? parsedRadiusMiles ?? DEFAULT_RADIUS_MILES : undefined,
      limit: parseLimit(searchParams.get('limit')),
    };

    if (!fs.existsSync(DB_PATH)) {
      console.error('Database file not found at:', DB_PATH);
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    db = new Database(DB_PATH, { readonly: true });

    const whereConditions: string[] = [];
    const params: string[] = [];

    if (filters.search) {
      whereConditions.push(`(
        normalized_name LIKE ? OR 
        city LIKE ? OR 
        full_address LIKE ? OR
        company_name LIKE ?
      )`);
      const searchTerm = `%${filters.search.toLowerCase()}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (filters.nearZip) {
      try {
        const nearbyZips = getZipCodesWithinRadius(
          filters.nearZip,
          filters.radiusMiles || DEFAULT_RADIUS_MILES
        );
        whereConditions.push("zip5_clean IS NOT NULL AND TRIM(zip5_clean) != ''");
        const { clause, params: zipParams } = buildChunkedInClause(ZIP5_CLEAN_COLUMN_SQL, nearbyZips);
        whereConditions.push(clause);
        params.push(...zipParams);
      } catch (zipError) {
        const zipErrorMessage = zipError instanceof Error ? zipError.message : '';

        if (zipErrorMessage.startsWith('ZIP_NOT_FOUND:')) {
          return NextResponse.json(
            { error: `ZIP code ${filters.nearZip} was not found in ZIP coordinate data.` },
            { status: 400 }
          );
        }

        console.error('ZIP radius export error:', zipError);
        return NextResponse.json(
          { error: 'ZIP radius search is temporarily unavailable.' },
          { status: 500 }
        );
      }
    }

    if (filters.state) {
      whereConditions.push('state = ?');
      params.push(filters.state);
    }

    if (filters.serviceType) {
      whereConditions.push('input_service_type = ?');
      params.push(filters.serviceType);
    }

    if (filters.subServiceType) {
      whereConditions.push('input_sub_service_type = ?');
      params.push(filters.subServiceType);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const companiesQuery = `
      SELECT 
        company_name,
        normalized_name,
        full_address,
        city,
        state,
        zip_code,
        primary_phone,
        secondary_phone,
        company_detail_url,
        input_service_type,
        input_sub_service_type,
        features
      FROM companies 
      ${whereClause}
      ORDER BY company_name
      LIMIT ?
    `;

    const companies = db.prepare(companiesQuery).all(...params, filters.limit) as CompanyExportRow[];

    const csvRows = [EXPORT_COLUMNS.join(',')];
    for (const company of companies) {
      const row = EXPORT_COLUMNS.map((column) => escapeCsvValue(company[column]));
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${buildExportFilename()}"`
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export companies' }, { status: 500 });
  } finally {
    if (db) {
      db.close();
    }
  }
}
