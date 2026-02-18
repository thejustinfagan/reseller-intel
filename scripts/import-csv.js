const Database = require('better-sqlite3');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, '..', 'data', 'CustomerScrape - WDs, ServiceCenters, Dealers.csv');
const DB_PATH = path.join(__dirname, '..', 'data', 'reseller-intel.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function normalizeCompanyName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatPhone(phone) {
  if (!phone) return '';
  // Remove non-digits
  const digits = phone.replace(/\D/g, '');
  // Format as (XXX) XXX-XXXX if 10 digits
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone; // Return as-is if not standard format
}

function validateZipCode(zip) {
  if (!zip) return '';
  // Extract digits and ensure 5-digit format
  const digits = zip.toString().replace(/\D/g, '');
  return digits.length >= 5 ? digits.slice(0, 5) : zip.toString();
}

async function run() {
  console.log('Starting CSV import...');
  console.log(`CSV file: ${CSV_PATH}`);
  console.log(`Database: ${DB_PATH}`);

  if (!fs.existsSync(CSV_PATH)) {
    console.error(`CSV file not found: ${CSV_PATH}`);
    process.exit(1);
  }

  // Initialize database
  const db = new Database(DB_PATH);
  
  // Create companies table
  db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      normalized_name TEXT NOT NULL,
      full_address TEXT,
      city TEXT,
      state TEXT,
      zip_code TEXT,
      primary_phone TEXT,
      secondary_phone TEXT,
      fax TEXT,
      company_detail_url TEXT,
      input_service_type TEXT,
      input_sub_service_type TEXT,
      features TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_companies_normalized_name ON companies(normalized_name);
    CREATE INDEX IF NOT EXISTS idx_companies_city_state ON companies(city, state);
    CREATE INDEX IF NOT EXISTS idx_companies_state ON companies(state);
    CREATE INDEX IF NOT EXISTS idx_companies_service_type ON companies(input_service_type);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_unique 
      ON companies(normalized_name, city, state);
  `);

  const insertCompany = db.prepare(`
    INSERT OR REPLACE INTO companies (
      company_name,
      normalized_name,
      full_address,
      city,
      state,
      zip_code,
      primary_phone,
      secondary_phone,
      fax,
      company_detail_url,
      input_service_type,
      input_sub_service_type,
      features
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((companies) => {
    for (const company of companies) {
      insertCompany.run(company);
    }
  });

  let processed = 0;
  let inserted = 0;
  let skipped = 0;
  let batch = [];
  const BATCH_SIZE = 1000;

  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(CSV_PATH)
      .pipe(csv({
        skipEmptyLines: true,
        skipLinesWithError: true
      }))
      .on('data', (row) => {
        processed++;
        
        if (processed % 5000 === 0) {
          console.log(`Processed ${processed} rows...`);
        }

        // Extract and validate data
        const companyName = (row.company_name || '').trim();
        const city = (row.input_city || '').trim();
        const state = (row.State || '').trim().toUpperCase();
        
        // Skip if missing essential data
        if (!companyName || !city || !state) {
          skipped++;
          return;
        }

        const normalizedName = normalizeCompanyName(companyName);
        if (!normalizedName) {
          skipped++;
          return;
        }

        const company = [
          companyName,
          normalizedName,
          (row.full_address || '').trim(),
          city,
          state,
          validateZipCode(row['Zip Code']),
          formatPhone(row['Primary Phone']),
          formatPhone(row['Secondary Phone']),
          (row.fax || '').trim(),
          (row.company_detail_url || '').trim(),
          (row.input_service_type || '').trim(),
          (row.input_sub_service_type || '').trim(),
          (row.features || '').trim()
        ];

        batch.push(company);
        
        if (batch.length >= BATCH_SIZE) {
          insertMany(batch);
          inserted += batch.length;
          batch = [];
        }
      })
      .on('end', () => {
        // Insert remaining batch
        if (batch.length) {
          insertMany(batch);
          inserted += batch.length;
        }

        console.log('\n=== Import Complete ===');
        console.log(`Processed: ${processed}`);
        console.log(`Inserted: ${inserted}`);
        console.log(`Skipped: ${skipped}`);
        console.log(`Database: ${DB_PATH}`);
        
        db.close();
        resolve();
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        db.close();
        reject(error);
      });
  });
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});