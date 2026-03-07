import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { buildChunkedInClause, getZipCodesWithinRadius, normalizeZip } from '@/lib/zip-radius';

const DB_PATH = path.join(process.cwd(), 'data', 'reseller-intel.db');
const DEFAULT_RADIUS_MILES = 50;
const ZIP5_CLEAN_COLUMN_SQL = 'zip5_clean';

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

    const filters = {
      search: searchParams.get('search') || '',
      state: searchParams.get('state') || '',
      serviceType: searchParams.get('serviceType') || '',
      subServiceType: searchParams.get('subServiceType') || '',
      nearZip: nearZip || '',
      radiusMiles: nearZip ? parsedRadiusMiles ?? DEFAULT_RADIUS_MILES : undefined
    };

    // Check if database file exists
    if (!fs.existsSync(DB_PATH)) {
      console.error('Database file not found at:', DB_PATH);
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    db = new Database(DB_PATH, { readonly: true });

    // Build WHERE clause
    const whereConditions: string[] = [];
    const params: any[] = [];

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

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get all matching companies
    const companiesQuery = `
      SELECT 
        company_name,
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
    `;

    const companies = db.prepare(companiesQuery).all(params);

    // Create CSV content
    const headers = [
      'Company Name',
      'Full Address',
      'City',
      'State',
      'Zip Code',
      'Primary Phone',
      'Secondary Phone',
      'Website',
      'Service Type',
      'Sub Service Type',
      'Features'
    ];
    
    const csvRows = [headers.join(',')];
    
    companies.forEach((company: any) => {
      const row = [
        `"${(company.company_name || '').replace(/"/g, '""')}"`,
        `"${(company.full_address || '').replace(/"/g, '""')}"`,
        `"${(company.city || '').replace(/"/g, '""')}"`,
        `"${(company.state || '').replace(/"/g, '""')}"`,
        `"${(company.zip_code || '').replace(/"/g, '""')}"`,
        `"${(company.primary_phone || '').replace(/"/g, '""')}"`,
        `"${(company.secondary_phone || '').replace(/"/g, '""')}"`,
        `"${(company.company_detail_url || '').replace(/"/g, '""')}"`,
        `"${(company.input_service_type || '').replace(/"/g, '""')}"`,
        `"${(company.input_sub_service_type || '').replace(/"/g, '""')}"`,
        `"${(company.features || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="reseller-intel-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export companies' },
      { status: 500 }
    );
  } finally {
    if (db) {
      db.close();
    }
  }
}
