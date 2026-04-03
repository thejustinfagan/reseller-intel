#!/usr/bin/env python3
"""
Reseller Intel Data Consolidation Script
Merges AI-analyzed data from reseller-intel-deep into active reseller-intel database
"""

import sqlite3
import json
import re
import shutil
from datetime import datetime
from pathlib import Path

# Paths
ACTIVE_DB = Path.home() / "dev/reseller-intel/data/reseller-intel.db"
ARCHIVED_DB = Path.home() / "iCloud Drive (Archive)/projects/reseller-intel-deep/data/resellers.db"
BACKUP_DB = ACTIVE_DB.parent / f"reseller-intel.backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}.db"

# Stats tracking
stats = {
    'total_archived': 0,
    'with_ai_analysis': 0,
    'matched_existing': 0,
    'inserted_new': 0,
    'updated_with_ai': 0,
    'errors': 0
}

def normalize_name(name):
    """Normalize company name for matching"""
    if not name:
        return ""
    
    # Lowercase
    name = name.lower()
    
    # Remove punctuation and extra spaces
    name = re.sub(r'[^\w\s]', ' ', name)
    name = re.sub(r'\s+', ' ', name).strip()
    
    # Remove common suffixes
    suffixes = ['llc', 'inc', 'corp', 'corporation', 'company', 'co', 'ltd', 'limited']
    words = name.split()
    words = [w for w in words if w not in suffixes]
    
    return ' '.join(words)

def extract_city_state(address):
    """Extract city and state from address"""
    if not address:
        return None, None
    
    # Try to parse "City, ST ZIP" pattern
    match = re.search(r',\s*([^,]+),\s*([A-Z]{2})\s*\d{5}', address)
    if match:
        return match.group(1).strip(), match.group(2).strip()
    
    # Fallback: look for ", KY" or similar
    match = re.search(r',\s*([^,]+),\s*([A-Z]{2})', address)
    if match:
        return match.group(1).strip(), match.group(2).strip()
    
    return None, None

def backup_database():
    """Create backup of active database"""
    print(f"\n📦 Creating backup: {BACKUP_DB.name}")
    shutil.copy2(ACTIVE_DB, BACKUP_DB)
    print(f"✅ Backup created: {BACKUP_DB}")

def extend_schema(conn):
    """Add AI analysis columns to companies table"""
    print("\n🔧 Extending schema with AI analysis fields...")
    
    cursor = conn.cursor()
    
    # Check if columns already exist
    cursor.execute("PRAGMA table_info(companies)")
    existing_columns = {row[1] for row in cursor.fetchall()}
    
    new_columns = [
        ("place_id", "TEXT"),
        ("rating", "REAL"),
        ("review_count", "INTEGER"),
        ("google_business_status", "TEXT"),
        ("ai_analyzed_at", "TIMESTAMP"),
        ("confidence_score", "INTEGER"),
        ("confidence_label", "TEXT"),
        ("is_target_account", "BOOLEAN"),
        ("primary_entity_type", "TEXT"),
        ("brands_served", "TEXT"),
        ("vehicle_types", "TEXT"),
        ("parts_capabilities", "TEXT"),
        ("service_capabilities", "TEXT"),
        ("deep_analysis", "TEXT"),
        ("evidence_snippets", "TEXT"),
    ]
    
    added = 0
    for col_name, col_type in new_columns:
        if col_name not in existing_columns:
            cursor.execute(f"ALTER TABLE companies ADD COLUMN {col_name} {col_type}")
            added += 1
            print(f"  ✅ Added column: {col_name}")
    
    if added == 0:
        print("  ℹ️  All columns already exist")
    else:
        conn.commit()
        print(f"  ✅ Added {added} new columns")

def find_matching_company(cursor, name, city, state):
    """Find existing company by normalized name, city, state"""
    normalized = normalize_name(name)
    
    if not normalized or not city or not state:
        return None
    
    cursor.execute("""
        SELECT id FROM companies 
        WHERE normalized_name = ? 
        AND city = ? 
        AND state = ?
        LIMIT 1
    """, (normalized, city, state))
    
    result = cursor.fetchone()
    return result[0] if result else None

def insert_new_company(cursor, record):
    """Insert new company from archived record"""
    city, state = extract_city_state(record['address'])
    
    cursor.execute("""
        INSERT INTO companies (
            company_name,
            normalized_name,
            full_address,
            city,
            state,
            primary_phone,
            company_detail_url,
            place_id,
            rating,
            review_count,
            google_business_status,
            ai_analyzed_at,
            confidence_score,
            confidence_label,
            is_target_account,
            primary_entity_type,
            deep_analysis,
            created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    """, (
        record['name'],
        normalize_name(record['name']),
        record['address'],
        city,
        state,
        record['phone'],
        record['website'],
        record['place_id'],
        record['rating'],
        record['review_count'],
        record['business_status'],
        datetime.now(),
        record['confidence_score'],
        record['confidence_label'],
        record['is_target_account'],
        record['primary_entity_type'],
        record['deep_analysis']
    ))
    
    return cursor.lastrowid

def update_with_ai_data(cursor, company_id, record):
    """Update existing company with AI analysis data"""
    cursor.execute("""
        UPDATE companies SET
            place_id = ?,
            rating = ?,
            review_count = ?,
            google_business_status = ?,
            ai_analyzed_at = ?,
            confidence_score = ?,
            confidence_label = ?,
            is_target_account = ?,
            primary_entity_type = ?,
            deep_analysis = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (
        record['place_id'],
        record['rating'],
        record['review_count'],
        record['business_status'],
        datetime.now(),
        record['confidence_score'],
        record['confidence_label'],
        record['is_target_account'],
        record['primary_entity_type'],
        record['deep_analysis'],
        company_id
    ))

def migrate_data():
    """Main migration logic"""
    print("\n🚀 Starting Reseller Intel Data Consolidation")
    print("=" * 60)
    
    # Check files exist
    if not ACTIVE_DB.exists():
        print(f"❌ Active database not found: {ACTIVE_DB}")
        return False
    
    if not ARCHIVED_DB.exists():
        print(f"❌ Archived database not found: {ARCHIVED_DB}")
        return False
    
    # Create backup
    backup_database()
    
    # Connect to both databases
    print("\n🔌 Connecting to databases...")
    active_conn = sqlite3.connect(ACTIVE_DB)
    active_conn.row_factory = sqlite3.Row
    archived_conn = sqlite3.connect(ARCHIVED_DB)
    archived_conn.row_factory = sqlite3.Row
    
    # Extend schema
    extend_schema(active_conn)
    
    # Load archived records
    print("\n📊 Loading archived records...")
    archived_cursor = archived_conn.cursor()
    archived_cursor.execute("""
        SELECT * FROM resellers 
        WHERE deep_analysis IS NOT NULL
        ORDER BY confidence_score DESC
    """)
    archived_records = archived_cursor.fetchall()
    stats['total_archived'] = len(archived_records)
    stats['with_ai_analysis'] = len(archived_records)
    
    print(f"  Found {stats['total_archived']} AI-analyzed records")
    
    # Process each archived record
    print("\n🔄 Processing records...")
    active_cursor = active_conn.cursor()
    
    for i, record in enumerate(archived_records, 1):
        try:
            # Extract city/state for matching
            city, state = extract_city_state(record['address'])
            
            if not city or not state:
                print(f"  ⚠️  [{i}/{stats['total_archived']}] Skipping (no city/state): {record['name']}")
                continue
            
            # Try to find matching existing company
            existing_id = find_matching_company(active_cursor, record['name'], city, state)
            
            if existing_id:
                # Update existing with AI data
                update_with_ai_data(active_cursor, existing_id, record)
                stats['matched_existing'] += 1
                stats['updated_with_ai'] += 1
                print(f"  ✅ [{i}/{stats['total_archived']}] MATCHED & UPDATED: {record['name']} (ID: {existing_id})")
            else:
                # Insert as new company
                new_id = insert_new_company(active_cursor, record)
                stats['inserted_new'] += 1
                print(f"  ➕ [{i}/{stats['total_archived']}] INSERTED NEW: {record['name']} (ID: {new_id})")
            
            # Commit every 50 records
            if i % 50 == 0:
                active_conn.commit()
                print(f"  💾 Checkpoint saved ({i} processed)")
        
        except Exception as e:
            stats['errors'] += 1
            print(f"  ❌ [{i}/{stats['total_archived']}] ERROR: {record['name']} - {e}")
    
    # Final commit
    active_conn.commit()
    
    # Close connections
    active_conn.close()
    archived_conn.close()
    
    return True

def verify_results():
    """Verify migration results"""
    print("\n✅ Verification")
    print("=" * 60)
    
    conn = sqlite3.connect(ACTIVE_DB)
    cursor = conn.cursor()
    
    # Count total records
    cursor.execute("SELECT COUNT(*) FROM companies")
    total = cursor.fetchone()[0]
    
    # Count AI-analyzed records
    cursor.execute("SELECT COUNT(*) FROM companies WHERE ai_analyzed_at IS NOT NULL")
    ai_analyzed = cursor.fetchone()[0]
    
    # Count records with deep analysis
    cursor.execute("SELECT COUNT(*) FROM companies WHERE deep_analysis IS NOT NULL")
    deep_analysis = cursor.fetchone()[0]
    
    # Sample some matched records
    cursor.execute("""
        SELECT company_name, city, state, confidence_score, primary_entity_type
        FROM companies 
        WHERE ai_analyzed_at IS NOT NULL
        ORDER BY confidence_score DESC
        LIMIT 5
    """)
    samples = cursor.fetchall()
    
    conn.close()
    
    print(f"\n📊 Database Stats:")
    print(f"  Total companies: {total:,}")
    print(f"  AI-analyzed: {ai_analyzed}")
    print(f"  With deep analysis: {deep_analysis}")
    
    print(f"\n🔢 Migration Stats:")
    print(f"  Archived records processed: {stats['total_archived']}")
    print(f"  With AI analysis: {stats['with_ai_analysis']}")
    print(f"  Matched existing: {stats['matched_existing']}")
    print(f"  Updated with AI: {stats['updated_with_ai']}")
    print(f"  Inserted new: {stats['inserted_new']}")
    print(f"  Errors: {stats['errors']}")
    
    print(f"\n🏆 Top AI-Analyzed Companies:")
    for name, city, state, score, entity_type in samples:
        print(f"  • {name} ({city}, {state})")
        print(f"    Score: {score}, Type: {entity_type}")
    
    print(f"\n✅ Migration complete!")
    print(f"📦 Backup saved: {BACKUP_DB}")

if __name__ == "__main__":
    try:
        success = migrate_data()
        if success:
            verify_results()
            print("\n" + "=" * 60)
            print("✅ CONSOLIDATION SUCCESSFUL")
            print("=" * 60)
            print(f"\nNext steps:")
            print(f"1. Review the results above")
            print(f"2. Test queries on the database")
            print(f"3. If all looks good, delete the archive venv:")
            print(f"   rm -rf ~/iCloud\\ Drive\\ \\(Archive\\)/projects/reseller-intel-deep/venv/")
        else:
            print("\n❌ Migration failed - check errors above")
    except Exception as e:
        print(f"\n💥 CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        print(f"\n🔄 Restore from backup if needed:")
        print(f"   cp {BACKUP_DB} {ACTIVE_DB}")
