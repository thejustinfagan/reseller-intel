import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'reseller-intel.db');

export const runtime = 'nodejs';

interface QueryFilters {
  search?: string;
  state?: string;
  serviceType?: string;
  subServiceType?: string;
  page?: number;
  limit?: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters: QueryFilters = {
      search: searchParams.get('search') || '',
      state: searchParams.get('state') || '',
      serviceType: searchParams.get('serviceType') || '',
      subServiceType: searchParams.get('subServiceType') || '',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50')
    };

    const db = new Database(DB_PATH, { readonly: true });
    
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
    const totalCount = (countResult as any).total;
    
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
        features
      FROM companies 
      ${whereClause}
      ORDER BY company_name
      LIMIT ? OFFSET ?
    `;
    
    const companies = db.prepare(companiesQuery).all([...params, filters.limit, offset]);
    
    db.close();
    
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
  }
}