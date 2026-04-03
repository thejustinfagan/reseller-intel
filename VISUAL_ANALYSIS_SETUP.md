# Visual Facility Analysis - Setup Guide

## What This Does

Downloads satellite imagery and analyzes facilities within 50 miles of Louisville, KY 40217 using:
- **Google Maps Static API** - Satellite imagery
- **Gemini 2.0 Flash Vision** - AI visual analysis

## Estimated Costs

For ~680 facilities:
- Google Maps Static API: $1.37 (680 × $0.002)
- Gemini 2.0 Flash Vision: $0.01 (680 × $0.000019)
- **Total: ~$1.40**

## Prerequisites

### 1. Google Maps API Key

**Get API Key:**
1. Go to https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Enable "Maps Static API"
4. Create credentials → API key
5. (Optional) Restrict key to Maps Static API only

**Set environment variable:**
```bash
export GOOGLE_MAPS_API_KEY='your-key-here'
```

**Pricing:**
- Maps Static API: $0.002 per request
- First $200/month FREE credit
- Our usage: ~$1.37 (well within free tier)

### 2. Gemini API Key

**Get API Key:**
1. Go to https://makersuite.google.com/app/apikey
2. Create API key
3. Copy key

**Set environment variable:**
```bash
export GEMINI_API_KEY='your-key-here'
```

**Pricing:**
- Gemini 2.0 Flash: Free tier available
- Images: ~$0.000019 per image
- Our usage: ~$0.01 (essentially free)

## Running the Pipeline

### Quick Start (Mock Mode)

Run without API keys to test the pipeline:
```bash
cd ~/dev/reseller-intel
python3 visual_facility_analysis.py
```

This will:
- Find facilities in 50-mile radius
- Extend database schema
- Run in mock mode (no actual API calls)
- Generate mock analysis data

### Production Run (With API Keys)

```bash
# Set API keys
export GOOGLE_MAPS_API_KEY='your-google-key'
export GEMINI_API_KEY='your-gemini-key'

# Run pipeline
cd ~/dev/reseller-intel
python3 visual_facility_analysis.py
```

### What Gets Created

**Directories:**
- `~/dev/reseller-intel/facility-images/` - Satellite images (640×640 JPEG)
- `~/dev/reseller-intel/visual-analysis-results/` - JSON/CSV exports

**Database Updates:**
- Extends `companies` table with 14 new columns
- Updates all facilities with visual analysis data

**Outputs:**
- `visual_analysis_YYYYMMDD_HHMMSS.json` - Full results
- `visual_analysis_YYYYMMDD_HHMMSS.csv` - Spreadsheet format

## Database Schema

New columns added to `companies` table:

```sql
visual_analyzed_at TIMESTAMP       -- When analysis was performed
facility_size_acres REAL           -- Estimated size in acres
building_count INTEGER             -- Number of distinct buildings
bay_count INTEGER                  -- Service bays/loading docks visible
trucks_visible INTEGER             -- Large trucks/semis in lot
trailers_visible INTEGER           -- Trailers in lot
cleanliness_score INTEGER          -- 1-10 score
building_condition INTEGER         -- 1-10 score
has_signage BOOLEAN                -- Professional signage visible
has_fencing BOOLEAN                -- Security fencing present
lot_organized BOOLEAN              -- Well-organized vs chaotic
facility_type TEXT                 -- dealer, repair_shop, etc.
satellite_image_url TEXT           -- Path to saved image
visual_analysis_notes TEXT         -- AI observations
```

## Sample Queries

After pipeline completes:

```sql
-- Top 10 largest facilities
SELECT company_name, city, facility_size_acres, bay_count
FROM companies 
WHERE visual_analyzed_at IS NOT NULL
ORDER BY facility_size_acres DESC 
LIMIT 10;

-- Cleanest facilities with most bays
SELECT company_name, city, bay_count, cleanliness_score, building_condition
FROM companies 
WHERE visual_analyzed_at IS NOT NULL 
AND bay_count >= 5
ORDER BY cleanliness_score DESC, building_condition DESC
LIMIT 10;

-- Facilities with trucks visible (high activity)
SELECT company_name, city, trucks_visible, trailers_visible, facility_type
FROM companies 
WHERE trucks_visible > 5
ORDER BY trucks_visible DESC;

-- Professional operations (signage + fencing + organized)
SELECT company_name, city, facility_size_acres, bay_count
FROM companies 
WHERE has_signage = 1 
AND has_fencing = 1 
AND lot_organized = 1
AND cleanliness_score >= 7
ORDER BY bay_count DESC;
```

## Runtime

**Expected duration:** ~2-3 hours
- ~680 facilities
- 1-2 seconds per facility (download + analyze + update)
- Rate limiting to avoid API throttling

**Progress tracking:**
- Live progress printed to console
- Checkpoints every 10 facilities
- Errors logged but don't stop pipeline

## Cost Breakdown

| Item | Count | Unit Cost | Total |
|------|-------|-----------|-------|
| Satellite images | 680 | $0.002 | $1.36 |
| Gemini Vision analysis | 680 | $0.000019 | $0.01 |
| **TOTAL** | | | **$1.37** |

**Note:** Both APIs have generous free tiers. You likely won't pay anything.

## Troubleshooting

### "No facilities found"
- Check that archived database exists
- Verify lat/lng columns have data
- Try larger radius

### "API key not set"
- Make sure environment variables are exported
- Check key validity in respective consoles
- Pipeline will run in mock mode without keys

### "Rate limit exceeded"
- Pipeline includes rate limiting (0.5-1s delays)
- If still hitting limits, increase sleep times in code
- Google Maps Static API: 50 QPS limit

### "Image download failed"
- Check API key permissions
- Verify Maps Static API is enabled
- Check network connectivity

## Next Steps After Completion

1. **Query the data:**
   ```sql
   SELECT COUNT(*) FROM companies WHERE visual_analyzed_at IS NOT NULL;
   ```

2. **Export top targets:**
   ```sql
   SELECT company_name, city, facility_size_acres, bay_count, 
          cleanliness_score, confidence_score
   FROM companies 
   WHERE visual_analyzed_at IS NOT NULL
   ORDER BY bay_count DESC, cleanliness_score DESC
   LIMIT 50;
   ```

3. **Review images:**
   - Open `~/dev/reseller-intel/facility-images/`
   - Images named by `place_id.jpg`
   - Cross-reference with database

4. **Sales intelligence:**
   - Filter by facility size for territory planning
   - Target high bay count for volume deals
   - Prioritize clean/professional facilities

## Maintenance

**Re-run analysis:**
```bash
# Update existing records
python3 visual_facility_analysis.py
```

**Add new facilities:**
1. Run discovery pipeline to find new locations
2. Run visual analysis on new place_ids
3. Database will update only new records

**Archive old images:**
```bash
# After verifying data, compress images
cd ~/dev/reseller-intel
tar -czf facility-images-archive-$(date +%Y%m%d).tar.gz facility-images/
# Then optionally delete originals to save space
```

## Support

**Created:** 2026-03-30  
**Location:** `~/dev/reseller-intel/visual_facility_analysis.py`  
**Documentation:** This file

For issues, check:
1. API keys are set and valid
2. Database paths are correct
3. Python 3 is installed
4. Internet connectivity

---

**Ready to run? Set your API keys and execute:**
```bash
export GOOGLE_MAPS_API_KEY='your-key'
export GEMINI_API_KEY='your-key'
python3 visual_facility_analysis.py
```
