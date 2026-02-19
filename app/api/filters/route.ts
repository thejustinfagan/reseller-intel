import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'reseller-intel.db');

export const runtime = 'nodejs';

export async function GET() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      console.error('Database file not found at:', DB_PATH);
      console.error('Current working directory:', process.cwd());
      console.error(
        'Files in data directory:',
        fs.existsSync(path.join(process.cwd(), 'data'))
          ? fs.readdirSync(path.join(process.cwd(), 'data'))
          : 'data directory does not exist'
      );
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const db = new Database(DB_PATH, { readonly: true });

    const states = db
      .prepare('SELECT DISTINCT state FROM companies ORDER BY state')
      .all()
      .map((row: any) => row.state)
      .filter((state: string) => state);

    const subServiceTypes = db
      .prepare(
        "SELECT DISTINCT input_sub_service_type FROM companies WHERE input_sub_service_type != '' ORDER BY input_sub_service_type"
      )
      .all()
      .map((row: any) => row.input_sub_service_type)
      .filter((subType: string) => subType);

    db.close();

    return NextResponse.json({ states, subServiceTypes });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch filters' }, { status: 500 });
  }
}
