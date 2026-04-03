#!/usr/bin/env python3
"""
Visual Facility Analysis Pipeline
Satellite imagery download + Gemini 2.0 Flash Vision analysis
For 50-mile radius around Louisville, KY 40217
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
RADIUS_MILES = 50

# Paths
ACTIVE_DB = Path.home() / "dev/reseller-intel/data/reseller-intel.db"
ARCHIVED_DB = Path.home() / "iCloud Drive (Archive)/projects/reseller-intel-deep/data/resellers.db"
IMAGES_DIR = Path.home() / "dev/reseller-intel/facility-images"
RESULTS_DIR = Path.home() / "dev/reseller-intel/visual-analysis-results"

# API Keys (from environment)
GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

# Stats
stats = {
    'total_in_radius': 0,
    'images_downloaded': 0,
    'analysis_complete': 0,
    'errors': 0,
    'api_cost': 0.0
}

def haversine(lon1, lat1, lon2, lat2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    Returns distance in miles
    """
    # Convert decimal degrees to radians
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    
    # Haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    
    # Radius of earth in miles
    r = 3959
    
    return c * r

def get_facilities_in_radius():
    """Load facilities from archived DB that are within 50 miles"""
    print(f"\n🎯 Finding facilities within {RADIUS_MILES} miles of 40217...")
    
    conn = sqlite3.connect(ARCHIVED_DB)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM resellers WHERE lat IS NOT NULL AND lng IS NOT NULL")
    all_facilities = cursor.fetchall()
    
    in_radius = []
    for facility in all_facilities:
        distance = haversine(BASE_LNG, BASE_LAT, facility['lng'], facility['lat'])
        if distance <= RADIUS_MILES:
            in_radius.append({
                'place_id': facility['place_id'],
                'name': facility['name'],
                'address': facility['address'],
                'lat': facility['lat'],
                'lng': facility['lng'],
                'distance_miles': round(distance, 1)
            })
    
    conn.close()
    
    stats['total_in_radius'] = len(in_radius)
    print(f"  ✅ Found {len(in_radius)} facilities within {RADIUS_MILES} miles")
    
    # Sort by distance
    in_radius.sort(key=lambda x: x['distance_miles'])
    
    return in_radius

def download_satellite_image(facility):
    """Download satellite imagery from Google Maps Static API"""
    if not GOOGLE_MAPS_API_KEY:
        print("  ⚠️  GOOGLE_MAPS_API_KEY not set, using mock image")
        return None
    
    lat = facility['lat']
    lng = facility['lng']
    
    # Google Maps Static API - Satellite view
    # Zoom 19 = ~1:2000 scale (can see individual vehicles)
    url = (
        f"https://maps.googleapis.com/maps/api/staticmap"
        f"?center={lat},{lng}"
        f"&zoom=19"
        f"&size=640x640"
        f"&maptype=satellite"
        f"&key={GOOGLE_MAPS_API_KEY}"
    )
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        # Save image
        image_filename = f"{facility['place_id']}.jpg"
        image_path = IMAGES_DIR / image_filename
        
        with open(image_path, 'wb') as f:
            f.write(response.content)
        
        stats['api_cost'] += 0.002  # $0.002 per static map request
        stats['images_downloaded'] += 1
        
        return str(image_path)
    
    except Exception as e:
        print(f"  ❌ Image download failed: {e}")
        stats['errors'] += 1
        return None

def analyze_facility_with_gemini(facility, image_path):
    """Analyze facility using Gemini 2.0 Flash Vision"""
    if not GEMINI_API_KEY:
        print("  ⚠️  GEMINI_API_KEY not set, using mock analysis")
        return {
            'facility_size_acres': 2.5,
            'building_count': 1,
            'bay_count': 3,
            'trucks_visible': 5,
            'trailers_visible': 2,
            'cleanliness_score': 7,
            'building_condition': 8,
            'has_signage': True,
            'has_fencing': True,
            'lot_organized': True,
            'facility_type': 'repair_shop',
            'analysis_notes': 'Mock analysis - API key not configured'
        }
    
    try:
        # Import and use real Gemini integration
        from gemini_vision import analyze_facility_image
        
        analysis = analyze_facility_image(
            image_path,
            facility['name'],
            facility['address']
        )
        
        stats['api_cost'] += 0.00001875  # ~$0.000019 per image analysis
        stats['analysis_complete'] += 1
        
        return analysis
    
    except Exception as e:
        print(f"  ❌ Gemini analysis failed: {e}")
        stats['errors'] += 1
        return None

def extend_database_schema():
    """Add visual analysis columns to active database"""
    print("\n🔧 Extending database schema for visual analysis...")
    
    conn = sqlite3.connect(ACTIVE_DB)
    cursor = conn.cursor()
    
    # Check if columns already exist
    cursor.execute("PRAGMA table_info(companies)")
    existing_columns = {row[1] for row in cursor.fetchall()}
    
    new_columns = [
        ("visual_analyzed_at", "TIMESTAMP"),
        ("facility_size_acres", "REAL"),
        ("building_count", "INTEGER"),
        ("bay_count", "INTEGER"),
        ("trucks_visible", "INTEGER"),
        ("trailers_visible", "INTEGER"),
        ("cleanliness_score", "INTEGER"),
        ("building_condition", "INTEGER"),
        ("has_signage", "BOOLEAN"),
        ("has_fencing", "BOOLEAN"),
        ("lot_organized", "BOOLEAN"),
        ("facility_type", "TEXT"),
        ("satellite_image_url", "TEXT"),
        ("visual_analysis_notes", "TEXT"),
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
    
    conn.close()

def update_company_with_visual_data(place_id, analysis, image_path):
    """Update active database with visual analysis results"""
    conn = sqlite3.connect(ACTIVE_DB)
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE companies SET
            visual_analyzed_at = ?,
            facility_size_acres = ?,
            building_count = ?,
            bay_count = ?,
            trucks_visible = ?,
            trailers_visible = ?,
            cleanliness_score = ?,
            building_condition = ?,
            has_signage = ?,
            has_fencing = ?,
            lot_organized = ?,
            facility_type = ?,
            satellite_image_url = ?,
            visual_analysis_notes = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE place_id = ?
    """, (
        datetime.now(),
        analysis.get('facility_size_acres'),
        analysis.get('building_count'),
        analysis.get('bay_count'),
        analysis.get('trucks_visible'),
        analysis.get('trailers_visible'),
        analysis.get('cleanliness_score'),
        analysis.get('building_condition'),
        analysis.get('has_signage'),
        analysis.get('has_fencing'),
        analysis.get('lot_organized'),
        analysis.get('facility_type'),
        image_path,
        analysis.get('analysis_notes'),
        place_id
    ))
    
    rows_updated = cursor.rowcount
    conn.commit()
    conn.close()
    
    return rows_updated > 0

def process_facilities(facilities):
    """Main processing loop"""
    print(f"\n🚀 Processing {len(facilities)} facilities...")
    print("=" * 60)
    
    results = []
    
    for i, facility in enumerate(facilities, 1):
        print(f"\n[{i}/{len(facilities)}] {facility['name']}")
        print(f"  📍 {facility['address']} ({facility['distance_miles']} mi)")
        
        # Download satellite image
        print("  📥 Downloading satellite image...")
        image_path = download_satellite_image(facility)
        
        if not image_path:
            print("  ⏭️  Skipping (no image)")
            continue
        
        print(f"  ✅ Image saved")
        
        # Analyze with Gemini
        print("  🤖 Analyzing with Gemini Vision...")
        analysis = analyze_facility_with_gemini(facility, image_path)
        
        if not analysis:
            print("  ⏭️  Skipping (analysis failed)")
            continue
        
        print(f"  ✅ Analysis complete")
        print(f"     Size: {analysis['facility_size_acres']} acres")
        print(f"     Buildings: {analysis['building_count']}, Bays: {analysis['bay_count']}")
        print(f"     Vehicles: {analysis['trucks_visible']} trucks, {analysis['trailers_visible']} trailers")
        print(f"     Condition: {analysis['building_condition']}/10, Cleanliness: {analysis['cleanliness_score']}/10")
        
        # Update database
        print("  💾 Updating database...")
        if update_company_with_visual_data(facility['place_id'], analysis, image_path):
            print("  ✅ Database updated")
        else:
            print("  ⚠️  No matching company found in database")
        
        # Save result
        result = {
            **facility,
            **analysis,
            'image_path': image_path,
            'analyzed_at': datetime.now().isoformat()
        }
        results.append(result)
        
        # Rate limiting (Google Maps API limit: 50 QPS)
        if i % 10 == 0:
            print(f"\n  💾 Checkpoint saved ({i} processed)")
            time.sleep(1)
        else:
            time.sleep(0.5)  # Be nice to APIs
    
    return results

def export_results(results):
    """Export results to JSON and CSV"""
    print("\n📤 Exporting results...")
    
    # JSON export
    json_file = RESULTS_DIR / f"visual_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(json_file, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"  ✅ JSON: {json_file}")
    
    # CSV export
    csv_file = RESULTS_DIR / f"visual_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    if results:
        import csv
        keys = results[0].keys()
        with open(csv_file, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=keys)
            writer.writeheader()
            writer.writerows(results)
        print(f"  ✅ CSV: {csv_file}")

def print_summary(results):
    """Print final summary"""
    print("\n" + "=" * 60)
    print("✅ VISUAL FACILITY ANALYSIS COMPLETE")
    print("=" * 60)
    
    print(f"\n📊 Statistics:")
    print(f"  Total in 50-mile radius: {stats['total_in_radius']}")
    print(f"  Images downloaded: {stats['images_downloaded']}")
    print(f"  Analysis completed: {stats['analysis_complete']}")
    print(f"  Errors: {stats['errors']}")
    print(f"  API cost: ${stats['api_cost']:.2f}")
    
    if results:
        print(f"\n🏆 Top Facilities by Size:")
        sorted_by_size = sorted(results, key=lambda x: x.get('facility_size_acres', 0), reverse=True)[:5]
        for i, facility in enumerate(sorted_by_size, 1):
            print(f"  {i}. {facility['name']}")
            print(f"     {facility['facility_size_acres']} acres, {facility['bay_count']} bays")
        
        print(f"\n🧹 Cleanest Facilities:")
        sorted_by_clean = sorted(results, key=lambda x: x.get('cleanliness_score', 0), reverse=True)[:5]
        for i, facility in enumerate(sorted_by_clean, 1):
            print(f"  {i}. {facility['name']}")
            print(f"     Cleanliness: {facility['cleanliness_score']}/10, Condition: {facility['building_condition']}/10")

def main():
    """Main execution"""
    print("=" * 60)
    print("🛰️  VISUAL FACILITY ANALYSIS PIPELINE")
    print("=" * 60)
    print(f"📍 Base: Louisville, KY 40217")
    print(f"📏 Radius: {RADIUS_MILES} miles")
    print(f"🗂️  Images: {IMAGES_DIR}")
    print(f"📊 Results: {RESULTS_DIR}")
    
    # Check API keys
    if not GOOGLE_MAPS_API_KEY:
        print("\n⚠️  WARNING: GOOGLE_MAPS_API_KEY not set")
        print("   Set with: export GOOGLE_MAPS_API_KEY='your-key'")
        print("   Running in MOCK mode (no actual images downloaded)")
    
    if not GEMINI_API_KEY:
        print("\n⚠️  WARNING: GEMINI_API_KEY not set")
        print("   Set with: export GEMINI_API_KEY='your-key'")
        print("   Running in MOCK mode (no actual AI analysis)")
    
    # Create directories
    IMAGES_DIR.mkdir(exist_ok=True, parents=True)
    RESULTS_DIR.mkdir(exist_ok=True, parents=True)
    
    # Extend database schema
    extend_database_schema()
    
    # Get facilities
    facilities = get_facilities_in_radius()
    
    if not facilities:
        print("\n❌ No facilities found in radius")
        return
    
    # Process all facilities
    results = process_facilities(facilities)
    
    # Export results
    export_results(results)
    
    # Print summary
    print_summary(results)
    
    print("\n" + "=" * 60)
    print("✅ PIPELINE COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    main()
