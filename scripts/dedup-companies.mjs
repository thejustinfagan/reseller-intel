#!/usr/bin/env node
// Dedup companies table: remove duplicate rows by (normalized_name, primary_phone)
// Safe to run multiple times (idempotent - no-op if no dupes exist)
import Database from 'better-sqlite3';
import { resolve } from 'path';

const dbPath = process.env.DATABASE_URL?.replace('file:', '') || resolve('data/reseller-intel.db');
console.log(`[dedup] Opening ${dbPath}`);

try {
  const db = new Database(dbPath);
  
  const before = db.prepare('SELECT COUNT(*) as cnt FROM companies').get().cnt;
  console.log(`[dedup] Before: ${before} rows`);
  
  if (before === 0) {
    console.log('[dedup] No data, skipping');
    process.exit(0);
  }
  
  // Keep the lowest id per (normalized_name, primary_phone) group
  const result = db.prepare(`
    DELETE FROM companies WHERE id NOT IN (
      SELECT MIN(id) FROM companies GROUP BY normalized_name, COALESCE(primary_phone, '')
    )
  `).run();
  
  const after = db.prepare('SELECT COUNT(*) as cnt FROM companies').get().cnt;
  console.log(`[dedup] Removed ${result.changes} duplicates`);
  console.log(`[dedup] After: ${after} rows`);
  
  db.close();
} catch (err) {
  console.error(`[dedup] Error: ${err.message}`);
  // Non-fatal — don't block builds
  process.exit(0);
}
