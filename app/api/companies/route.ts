import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { buildChunkedInClause, getZipCodesWithinRadius, normalizeZip } from '@/lib/zip-radius';
import { sanitizeDisplayedZip } from '@/lib/company-zip';

const DB_PATH = path.join(process.cwd(), 'data', 'reseller-intel.db');
const DEFAULT_RADIUS_MILES = 50;
const ZIP5_CLEAN_COLUMN_SQL = 'zip5_clean';

export const runtime = 'nodejs';

interface QueryFilters {
  search?: string;
  state?: string;
  serviceType?: string;
  subServiceType?: string;
  nearZip?: string;
  radiusMiles?: number;
  page?: number;
  limit?: number;
}

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

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

    const filters: QueryFilters = {
      search: searchParams.get('search') || '',
      state: searchParams.get('state') || '',
      serviceType: searchParams.get('serviceType') || '',
      subServiceType: searchParams.get('subServiceType') || '',
      nearZip: nearZip || '',
      radiusMiles: nearZip ? parsedRadiusMiles ?? DEFAULT_RADIUS_MILES : undefined,
      page: parsePositiveInt(searchParams.get('page'), 1),
      limit: parsePositiveInt(
        searchParams.get('limit') ?? searchParams.get('pageSize'),
        50
      )
    };

    // Check if database file exists
    if (!fs.existsSync(DB_PATH)) {
      console.error('Database file not found at:', DB_PATH);
      console.error('Current working directory:', process.cwd());
      console.error('Files in data directory:', fs.existsSync(path.join(process.cwd(), 'data')) ? fs.readdirSync(path.join(process.cwd(), 'data')) : 'data directory does not exist');
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

        console.error('ZIP radius search error:', zipError);
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

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM companies 
      ${whereClause}
    `;
    const countResult = db.prepare(countQuery).get(params);
    const totalCount = Number((countResult as any)?.total || 0);

    // Calculate pagination
    const offset = ((filters.page || 1) - 1) * (filters.limit || 50);
    const totalPages = Math.ceil(totalCount / (filters.limit || 50));

    // Get companies
    const companiesQuery = `
      SELECT 
        id,
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
        features,
        primary_entity_type,
        confidence_score,
        confidence_label,
        deep_analysis,
        ai_analyzed_at,
        qa_approved,
        qa_flagged,
        qa_flag_note
      FROM companies 
      ${whereClause}
      ORDER BY CASE WHEN ai_analyzed_at IS NOT NULL THEN 0 ELSE 1 END, confidence_score DESC, company_name
      LIMIT ? OFFSET ?
    `;

    const companies = db.prepare(companiesQuery).all([...params, filters.limit, offset]).map((company: any) => {
      let enrichment: any = {};
      
      // Parse deep_analysis JSON
      if (company.deep_analysis) {
        try {
          enrichment = JSON.parse(company.deep_analysis);
        } catch (e) {
          console.error('Failed to parse deep_analysis for company', company.id, e);
        }
      }
      
      return {
        ...company,
        zip_code: sanitizeDisplayedZip(company.full_address, company.zip_code),
        brands_served: enrichment.brands_served || [],
        vehicle_types: enrichment.vehicle_types_mentioned || [],
        parts_capabilities: enrichment.parts_capabilities || [],
        service_capabilities: enrichment.service_capabilities || [],
        mobile_service: enrichment.mobile_service || false,
        fleet_focus: enrichment.fleet_focus || false,
        dot_inspection: enrichment.dot_inspection || false,
      };
    });

    return NextResponse.json({
      companies,
      pagination: {
        currentPage: filters.page || 1,
        totalPages,
        totalCount,
        limit: filters.limit || 50,
        hasMore: (filters.page || 1) < totalPages
      }
    });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    );
  } finally {
    if (db) {
      db.close();
    }
  }
}
