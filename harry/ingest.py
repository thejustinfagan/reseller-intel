#!/usr/bin/env python3
"""
Harry Ingest — Process raw finds into reseller-intel.db
Deduplicates, inserts new companies, moves processed files.
"""
import json
import sqlite3
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

HARRY_DIR = Path(__file__).parent
FINDS_DIR = HARRY_DIR / "finds-raw"
PROCESSED_DIR = FINDS_DIR / "processed"
DB_PATH = HARRY_DIR.parent / "data" / "reseller-intel.db"
SUMMARY_FILE = HARRY_DIR / "nightly-summary.md"


def get_domain(url):
    """Extract domain from URL."""
    if not url:
        return None
    try:
        parsed = urlparse(url)
        return parsed.netloc.lower()
    except:
        return None


def is_duplicate(conn, company):
    """Check if company already exists in DB."""
    cursor = conn.cursor()
    
    # Check phone
    if company.get('phone'):
        cursor.execute("SELECT id FROM companies WHERE primary_phone = ?", (company['phone'],))
        if cursor.fetchone():
            return True
    
    # Check name + city + state
    if company.get('company_name') and company.get('city') and company.get('state'):
        cursor.execute(
            "SELECT id FROM companies WHERE company_name = ? AND city = ? AND state = ?",
            (company['company_name'], company['city'], company['state'])
        )
        if cursor.fetchone():
            return True
    
    # Check website domain
    if company.get('website'):
        domain = get_domain(company['website'])
        if domain:
            cursor.execute("SELECT id FROM companies WHERE company_detail_url LIKE ?", (f"%{domain}%",))
            if cursor.fetchone():
                return True
    
    return False


def insert_company(conn, company):
    """Insert new company into database."""
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO companies (
            company_name,
            city,
            state,
            full_address,
            zip_code,
            primary_phone,
            company_detail_url,
            input_sub_service_type,
            created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        company.get('company_name', ''),
        company.get('city', ''),
        company.get('state', ''),
        company.get('address', ''),
        company.get('zip', ''),
        company.get('phone', ''),
        company.get('website', ''),
        company.get('service_type', 'harry-scan'),
        datetime.now().isoformat()
    ))
    
    conn.commit()
    return cursor.lastrowid


def process_finds():
    """Process all raw find files."""
    conn = sqlite3.connect(DB_PATH)
    
    find_files = list(FINDS_DIR.glob("*.json"))
    
    if not find_files:
        print("No find files to process")
        return
    
    total_records = 0
    new_records = 0
    duplicate_records = 0
    
    for file_path in find_files:
        print(f"Processing {file_path.name}...")
        
        with open(file_path) as f:
            companies = json.load(f)
        
        for company in companies:
            total_records += 1
            
            if is_duplicate(conn, company):
                duplicate_records += 1
                continue
            
            insert_company(conn, company)
            new_records += 1
        
        # Move to processed
        PROCESSED_DIR.mkdir(exist_ok=True)
        processed_path = PROCESSED_DIR / file_path.name
        file_path.rename(processed_path)
        print(f"  Moved to {processed_path.name}")
    
    conn.close()
    
    # Write summary
    summary = f"""# Harry Nightly Summary
**Date:** {datetime.now().strftime("%Y-%m-%d %H:%M")}

## Ingest Results
- **Files processed:** {len(find_files)}
- **Total records:** {total_records}
- **New records inserted:** {new_records}
- **Duplicates skipped:** {duplicate_records}

## Status
✅ Ingest complete
"""
    
    with open(SUMMARY_FILE, 'w') as f:
        f.write(summary)
    
    print(f"\n📊 Summary:")
    print(f"  Files: {len(find_files)}")
    print(f"  Total: {total_records}")
    print(f"  New: {new_records}")
    print(f"  Dupes: {duplicate_records}")
    print(f"  Summary written to {SUMMARY_FILE.name}")


if __name__ == "__main__":
    process_finds()
