#!/usr/bin/env node
/**
 * fix-city-state-from-address.js
 * 
 * Fixes the misaligned city/state columns in reseller-intel.db.
 * 
 * Root cause: the CSV `input_city` and `State` columns represent the SEARCH
 * location (where the user searched from), not the company's actual location.
 * The `Zip Code` column is actually a FindTruckService page ID, not a postal code.
 * 
 * This script extracts the real city and state from `full_address`, which
 * consistently ends with "City, ST" format.
 * 
 * It also nullifies zip_code and zip5_clean since they were never real ZIPs.
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'reseller-intel.db');

// US state abbreviations for validation
const US_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC','PR','VI','GU','AS','MP'
]);

function extractCityState(fullAddress) {
  if (!fullAddress) return null;
  
  // full_address format: "Company Name, Street, City, ST"
  // Split by comma, take last two parts
  const parts = fullAddress.split(',').map(p => p.trim());
  if (parts.length < 2) return null;
  
  const lastPart = parts[parts.length - 1]; // should be state abbreviation
  const secondLast = parts[parts.length - 2]; // should be city
  
  // Validate state is a known 2-letter abbreviation
  if (!US_STATES.has(lastPart.toUpperCase())) return null;
  
  // City should be non-empty and not look like a street number
  if (!secondLast || secondLast.length === 0) return null;
  
  return {
    city: secondLast,
    state: lastPart.toUpperCase()
  };
}

function main() {
  const db = new Database(DB_PATH);
  
  // Get current stats
  const total = db.prepare('SELECT COUNT(*) as n FROM companies').get().n;
  console.log(`Total companies: ${total}`);
  
  // Sample before fix
  console.log('\n--- BEFORE (5 samples) ---');
  const samples = db.prepare('SELECT id, company_name, city, state, zip_code, full_address FROM companies LIMIT 5').all();
  for (const r of samples) {
    console.log(`  ${r.company_name} | city=${r.city} state=${r.state} zip=${r.zip_code}`);
    console.log(`    address: ${r.full_address}`);
    const parsed = extractCityState(r.full_address);
    console.log(`    parsed: ${parsed ? `${parsed.city}, ${parsed.state}` : 'FAIL'}`);
  }
  
  // Run the fix in a transaction
  const update = db.prepare(`
    UPDATE companies 
    SET city = ?, state = ?, zip_code = NULL, zip5_clean = NULL
    WHERE id = ?
  `);
  
  // Check for constraint conflicts before updating
  const checkDupe = db.prepare(`
    SELECT id FROM companies 
    WHERE normalized_name = ? AND city = ? AND state = ? AND id != ?
  `);
  
  const all = db.prepare('SELECT id, full_address, normalized_name FROM companies').all();
  
  let fixed = 0;
  let failed = 0;
  let dupeSkipped = 0;
  
  const tx = db.transaction(() => {
    for (const row of all) {
      const parsed = extractCityState(row.full_address);
      if (parsed) {
        // Check if this would create a duplicate
        const existing = checkDupe.get(row.normalized_name, parsed.city, parsed.state, row.id);
        if (existing) {
          dupeSkipped++;
          // Still null out the fake zip
          db.prepare('UPDATE companies SET zip_code = NULL, zip5_clean = NULL WHERE id = ?').run(row.id);
          continue;
        }
        update.run(parsed.city, parsed.state, row.id);
        fixed++;
      } else {
        failed++;
      }
    }
  });
  
  tx();
  
  console.log(`\n--- RESULTS ---`);
  console.log(`Fixed: ${fixed}`);
  console.log(`Dupe skipped (zip still nulled): ${dupeSkipped}`);
  console.log(`Failed to parse: ${failed}`);
  
  // Sample after fix
  console.log('\n--- AFTER (5 samples) ---');
  const after = db.prepare('SELECT company_name, city, state, zip_code, full_address FROM companies LIMIT 5').all();
  for (const r of after) {
    console.log(`  ${r.company_name} | city=${r.city} state=${r.state} zip=${r.zip_code}`);
  }
  
  // State distribution after fix
  console.log('\n--- State distribution (top 10) ---');
  const states = db.prepare('SELECT state, COUNT(*) as cnt FROM companies GROUP BY state ORDER BY cnt DESC LIMIT 10').all();
  for (const s of states) {
    console.log(`  ${s.state}: ${s.cnt}`);
  }
  
  db.close();
}

main();
