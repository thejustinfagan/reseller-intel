#!/usr/bin/env python3
"""
Recursive Reseller Discovery Pipeline
Exhaustive search within 100-mile radius of Louisville, KY 40217
"""

import os
import sqlite3
import json
import time
import requests
from datetime import datetime
from pathlib import Path
from math import radians, cos, sin, asin, sqrt

# Configuration
BASE_LAT = 38.2085  # Louisville 40217
BASE_LNG = -85.7594
RADIUS_MILES = 100

# API Key
GOOGLE_PLACES_API_KEY = os.getenv('GOOGLE_PLACES_API_KEY') or os.getenv('GOOGLE_MAPS_API_KEY')

# Paths
DB_PATH = Path.home() / "dev/reseller-intel/data/reseller-intel.db"
SEARCH_TERMS_FILE = Path.home() / "dev/reseller-intel/search_terms.json"

# Stats
stats = {
    'total_searches': 0,
    'new_businesses_found': 0,
    'duplicate_businesses': 0,
    'api_calls': 0,
    'api_cost': 0.0
}

# Seed search terms - Tier 1
TIER_1_TERMS = [
    # Primary
    "truck parts",
    "semi truck repair",
    "commercial truck dealer",
    "heavy duty parts",
    "diesel repair",
    "trailer repair",
    "truck service",
    "fleet maintenance",
    
    # Expanded primary
    "Class 6 truck parts",
    "Class 7 truck parts",
    "Class 8 truck parts",
    "vocational truck parts",
    "municipal truck parts",
    "commercial vehicle parts",
    "heavy equipment parts",
    "diesel engine parts",
    "truck component distributor",
    
    # Supply chain
    "truck parts distributor",
    "truck parts wholesaler",
    "truck parts warehouse",
    "fleet parts supplier",
    "commercial parts broker",
    
    # Rebuilding
    "diesel engine rebuilder",
    "transmission rebuilder",
    "turbocharger rebuilder",
    "truck parts remanufacturer",
    
    # Brands - Major OEMs
    "Freightliner parts",
    "Peterbilt parts",
    "Kenworth parts",
    "International truck parts",
    "Volvo truck parts",
    "Mack truck parts",
    "Western Star parts",
    
    # Engine brands
    "Cummins parts distributor",
    "Detroit Diesel parts",
    "Caterpillar diesel parts",
    
    # Component brands
    "Eaton transmission parts",
    "Meritor parts",
    "Bendix brake parts",
    "Allison transmission parts",
    
    # Services
    "mobile truck repair",
    "fleet repair service",
    "DOT inspection station",
    "diesel truck service",
    
    # Specialty
    "refuse truck parts",
    "dump truck parts",
    "tanker truck parts",
    "tow truck parts",
    "municipal fleet parts",
]

def haversine(lon1, lat1, lon2, lat2):
    """Calculate distance in miles between two points"""
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    return c * 3959  # Earth radius in miles

def google_places_text_search(query, location=None, radius=None):
    """
    Search Google Places API
    https://developers.google.com/maps/documentation/places/web-service/search-text
    """
    if not GOOGLE_PLACES_API_KEY:
        raise ValueError("GOOGLE_PLACES_API_KEY not set")
    
    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    
    params = {
        'query': query,
        'key': GOOGLE_PLACES_API_KEY
    }
    
    if location:
        params['location'] = f"{location[0]},{location[1]}"
    if radius:
        params['radius'] = radius * 1609.34  # miles to meters
    
    results = []
    
    while True:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        stats['api_calls'] += 1
        stats['api_cost'] += 0.032  # $0.032 per text search request
        
        if data.get('results'):
            results.extend(data['results'])
        
        # Check for next page
        if 'next_page_token' in data:
            time.sleep(2)  # Required delay for next_page_token
            params = {
                'pagetoken': data['next_page_token'],
                'key': GOOGLE_PLACES_API_KEY
            }
        else:
            break
    
    return results

def search_term(term, tier=1):
    """Execute a single search term"""
    print(f"\n🔍 Searching (Tier {tier}): {term}")
    
    try:
        results = google_places_text_search(
            query=f"{term} near Louisville KY",
            location=(BASE_LAT, BASE_LNG),
            radius=RADIUS_MILES
        )
        
        print(f"  ✅ Found {len(results)} results")
        
        # Store in database
        new_count = store_search_results(term, results, tier)
        print(f"  ➕ {new_count} new businesses (after dedup)")
        
        stats['total_searches'] += 1
        stats['new_businesses_found'] += new_count
        stats['duplicate_businesses'] += (len(results) - new_count)
        
        return new_count
    
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return 0

def store_search_results(search_term, results, tier):
    """Store search results in database, return count of new businesses"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    new_count = 0
    
    for result in results:
        place_id = result.get('place_id')
        name = result.get('name')
        address = result.get('formatted_address', '')
        lat = result.get('geometry', {}).get('location', {}).get('lat')
        lng = result.get('geometry', {}).get('location', {}).get('lng')
        rating = result.get('rating')
        review_count = result.get('user_ratings_total')
        types = ','.join(result.get('types', []))
        
        # Check if already exists
        cursor.execute("SELECT place_id FROM companies WHERE place_id = ?", (place_id,))
        if cursor.fetchone():
            continue  # Already have this one
        
        # Calculate distance
        if lat and lng:
            distance = haversine(BASE_LNG, BASE_LAT, lng, lat)
            if distance > RADIUS_MILES:
                continue  # Outside radius
        
        # Insert new business
        cursor.execute("""
            INSERT INTO companies (
                company_name, full_address, place_id, rating, review_count,
                google_business_status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (name, address, place_id, rating, review_count, 'OPERATIONAL'))
        
        new_count += 1
    
    conn.commit()
    conn.close()
    
    return new_count

def run_tier_1_searches():
    """Execute all Tier 1 seed searches"""
    print("=" * 60)
    print("🌱 TIER 1: SEED SEARCHES")
    print("=" * 60)
    
    for term in TIER_1_TERMS:
        search_term(term, tier=1)
        time.sleep(1)  # Rate limiting
    
    print(f"\n✅ Tier 1 complete: {stats['total_searches']} searches, {stats['new_businesses_found']} new businesses")

def extract_terms_from_business_names():
    """
    Extract potential search terms from business names in database
    Example: "ABC Freightliner Parts" → try "ABC Freightliner", "Freightliner"
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT DISTINCT company_name FROM companies")
    names = [row[0] for row in cursor.fetchall()]
    
    conn.close()
    
    extracted_terms = set()
    
    # Extract brand names, keywords
    keywords = [
        'Peterbilt', 'Kenworth', 'Freightliner', 'International', 'Mack',
        'Volvo', 'Western Star', 'Cummins', 'Detroit', 'Caterpillar',
        'Fleet', 'Truck', 'Diesel', 'Parts', 'Service', 'Repair'
    ]
    
    for name in names:
        for keyword in keywords:
            if keyword.lower() in name.lower():
                # Create variations
                extracted_terms.add(f"{keyword} parts Louisville")
                extracted_terms.add(f"{keyword} service Louisville")
                extracted_terms.add(f"{keyword} repair Louisville")
    
    return list(extracted_terms)

def run_tier_2_searches():
    """Execute Tier 2: searches generated from Tier 1 results"""
    print("\n" + "=" * 60)
    print("🔄 TIER 2: SECOND-ORDER EXPANSION")
    print("=" * 60)
    
    terms = extract_terms_from_business_names()
    print(f"📊 Generated {len(terms)} second-order search terms")
    
    new_total = 0
    for term in terms[:100]:  # Limit to avoid explosion
        new_count = search_term(term, tier=2)
        new_total += new_count
        time.sleep(1)
        
        if new_total < 5:  # Stop if not finding new businesses
            print("⏹️  Diminishing returns, stopping Tier 2")
            break
    
    print(f"\n✅ Tier 2 complete: {new_total} new businesses added")

def print_summary():
    """Print final summary"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM companies")
    total = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM companies WHERE place_id IS NOT NULL")
    with_place_id = cursor.fetchone()[0]
    
    conn.close()
    
    print("\n" + "=" * 60)
    print("✅ RECURSIVE DISCOVERY COMPLETE")
    print("=" * 60)
    
    print(f"\n📊 Discovery Statistics:")
    print(f"  Total searches: {stats['total_searches']}")
    print(f"  New businesses found: {stats['new_businesses_found']}")
    print(f"  Duplicates filtered: {stats['duplicate_businesses']}")
    print(f"  API calls: {stats['api_calls']}")
    print(f"  API cost: ${stats['api_cost']:.2f}")
    
    print(f"\n📚 Database Statistics:")
    print(f"  Total companies: {total:,}")
    print(f"  With Google Place ID: {with_place_id:,}")
    
    print(f"\n📍 Coverage:")
    print(f"  Radius: {RADIUS_MILES} miles from Louisville 40217")
    print(f"  Geographic area: ~{int(3.14159 * RADIUS_MILES**2):,} square miles")

def main():
    """Main execution"""
    print("=" * 60)
    print("🔍 RECURSIVE RESELLER DISCOVERY")
    print("=" * 60)
    print(f"📍 Base: Louisville, KY 40217")
    print(f"📏 Radius: {RADIUS_MILES} miles")
    print(f"🔑 API Key: {'✅ Set' if GOOGLE_PLACES_API_KEY else '❌ Not set'}")
    
    if not GOOGLE_PLACES_API_KEY:
        print("\n❌ Error: GOOGLE_PLACES_API_KEY not set")
        print("   Run: export GOOGLE_PLACES_API_KEY='your-key'")
        return
    
    # Phase 1: Seed searches
    run_tier_1_searches()
    
    # Phase 2: Second-order expansion
    run_tier_2_searches()
    
    # Summary
    print_summary()

if __name__ == "__main__":
    main()
