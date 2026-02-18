import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'reseller-intel.db');

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      search: searchParams.get('search') || '',
      state: searchParams.get('state') || '',
      serviceType: searchParams.get('serviceType') || '',
      subServiceType: searchParams.get('subServiceType') || ''
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
    db.close();
    
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
  }
}