const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'reseller-intel.db');
const ZIP_REGEX = /\b(\d{5})(?:-\d{4})?\b/;

function extractZip5(value) {
  if (!value) return null;
  const match = value.toString().match(ZIP_REGEX);
  return match ? match[1] : null;
}

function ensureCompaniesTable(db) {
  const table = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'companies'")
    .get();
  return Boolean(table);
}

function ensureZip5CleanColumn(db) {
  const columns = db.prepare('PRAGMA table_info(companies)').all();
  const hasZip5Clean = columns.some((column) => column.name === 'zip5_clean');

  if (!hasZip5Clean) {
    db.exec('ALTER TABLE companies ADD COLUMN zip5_clean TEXT');
    return true;
  }

  return false;
}

function run() {
  if (!fs.existsSync(DB_PATH)) {
    console.error(`Database file not found: ${DB_PATH}`);
    process.exit(1);
  }

  const db = new Database(DB_PATH);

  try {
    if (!ensureCompaniesTable(db)) {
      console.error('companies table not found in database.');
      process.exit(1);
    }

    const columnAdded = ensureZip5CleanColumn(db);
    db.exec('CREATE INDEX IF NOT EXISTS idx_companies_zip5_clean ON companies(zip5_clean)');

    const selectRows = db.prepare('SELECT id, full_address, zip_code, zip5_clean FROM companies');
    const updateRow = db.prepare('UPDATE companies SET zip5_clean = ? WHERE id = ?');
    const rows = selectRows.all();

    let totalRows = 0;
    let updatedRows = 0;
    let unchangedRows = 0;
    let derivedFromAddress = 0;
    let derivedFromZipCode = 0;
    let emptyZipRows = 0;

    const backfill = db.transaction(() => {
      for (const row of rows) {
        totalRows += 1;

        const zipFromAddress = extractZip5(row.full_address);
        const zipFromZipCode = zipFromAddress ? null : extractZip5(row.zip_code);
        const nextZip5Clean = zipFromAddress || zipFromZipCode || null;
        const currentZip5Clean = extractZip5(row.zip5_clean);

        if (zipFromAddress) {
          derivedFromAddress += 1;
        } else if (zipFromZipCode) {
          derivedFromZipCode += 1;
        } else {
          emptyZipRows += 1;
        }

        if (currentZip5Clean !== nextZip5Clean) {
          updateRow.run(nextZip5Clean, row.id);
          updatedRows += 1;
        } else {
          unchangedRows += 1;
        }
      }
    });

    backfill();

    const counts = db
      .prepare(`
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN zip5_clean IS NOT NULL AND TRIM(zip5_clean) != '' THEN 1 ELSE 0 END) AS zip5_populated,
          SUM(CASE WHEN zip5_clean IS NULL OR TRIM(zip5_clean) = '' THEN 1 ELSE 0 END) AS zip5_empty
        FROM companies
      `)
      .get();

    console.log('ZIP5 clean normalization complete.');
    console.log(`Database: ${DB_PATH}`);
    console.log(`Column added: ${columnAdded ? 'yes' : 'no'}`);
    console.log(`Rows scanned: ${totalRows}`);
    console.log(`Rows updated: ${updatedRows}`);
    console.log(`Rows unchanged: ${unchangedRows}`);
    console.log(`Derived from full_address: ${derivedFromAddress}`);
    console.log(`Derived from zip_code fallback: ${derivedFromZipCode}`);
    console.log(`No ZIP match found: ${emptyZipRows}`);
    console.log(`zip5_clean populated: ${Number(counts.zip5_populated || 0)}`);
    console.log(`zip5_clean empty/null: ${Number(counts.zip5_empty || 0)}`);
  } finally {
    db.close();
  }
}

run();
