#!/usr/bin/env node
/**
 * Seed OEM dealers into the SQLite database from bundled JSON.
 * Runs as part of the build step on Railway to populate the oem_dealers table.
 * Safe to re-run: uses INSERT OR IGNORE (unique constraint on company_name+zip).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'reseller-intel.db');
const SEED_PATH = path.join(__dirname, '..', 'data', 'oem-dealers-seed.json');

if (!fs.existsSync(DB_PATH)) {
  console.log('[seed-oem] No database file found, skipping OEM seed.');
  process.exit(0);
}

if (!fs.existsSync(SEED_PATH)) {
  console.log('[seed-oem] No seed file found, skipping OEM seed.');
  process.exit(0);
}

const db = new Database(DB_PATH);

// Create table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS "oem_dealers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "company_name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "dealer_type" TEXT,
    "brand" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "scraped_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE UNIQUE INDEX IF NOT EXISTS "idx_oem_dealers_company_zip"
    ON "oem_dealers"("company_name", "zip");
  CREATE INDEX IF NOT EXISTS "idx_oem_dealers_brand"
    ON "oem_dealers"("brand");
  CREATE INDEX IF NOT EXISTS "idx_oem_dealers_state_city"
    ON "oem_dealers"("state", "city");
`);

const dealers = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));

const insert = db.prepare(`
  INSERT OR IGNORE INTO oem_dealers
    (id, company_name, address, city, state, zip, phone, website,
     dealer_type, brand, latitude, longitude, scraped_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const tx = db.transaction((rows) => {
  let inserted = 0;
  for (const d of rows) {
    const r = insert.run(
      d.id, d.company_name, d.address, d.city, d.state, d.zip,
      d.phone, d.website, d.dealer_type, d.brand,
      d.latitude, d.longitude, d.scraped_at
    );
    if (r.changes > 0) inserted++;
  }
  return inserted;
});

const inserted = tx(dealers);
db.close();

console.log(`[seed-oem] Seeded ${inserted} new OEM dealers (${dealers.length} total in seed file).`);
