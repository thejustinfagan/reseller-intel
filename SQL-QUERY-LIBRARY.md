# SQL Query Library for Reseller Intel Database
**Quick-reference queries for analysis and target list extraction**

---

## DATABASE SCHEMA REFERENCE

```sql
CREATE TABLE companies (
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
  input_service_type TEXT,           -- EMPTY for all records
  input_sub_service_type TEXT,       -- ACTUAL service type data here
  features TEXT,                      -- Detailed service descriptions (25% populated)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Note:** `input_service_type` is blank for all records. Use `input_sub_service_type` instead.

---

## TARGET LIST QUERIES

### 1. Top Multi-Location Operators (5+ Locations)

**Use Case:** Find regional/corporate buyers for volume pricing discussions

```sql
SELECT 
  company_name,
  COUNT(*) as location_count,
  COUNT(DISTINCT state) as states_covered,
  primary_phone,
  GROUP_CONCAT(DISTINCT state) as states,
  GROUP_CONCAT(DISTINCT input_sub_service_type) as service_types
FROM companies
WHERE state IN ('KY', 'IN', 'OH', 'TN', 'IL', 'MO', 'WV')
GROUP BY company_name
HAVING location_count >= 5
ORDER BY location_count DESC
LIMIT 200;
```

**Expected Output:** ~150-200 regional/national chains  
**Target Persona:** Marcus (Regional Fleet Manager)

---

### 2. Independent Truck/Trailer Repair Shops

**Use Case:** Build target list for independent shop owner outreach

```sql
SELECT 
  company_name,
  city,
  state,
  primary_phone,
  input_sub_service_type as service_type,
  company_detail_url
FROM companies
WHERE state IN ('KY', 'IN', 'OH', 'TN', 'IL', 'MO', 'WV')
  AND input_sub_service_type IN ('Truck Shops', 'Truck Repair', 'Trailer Shops', 'Trailer Repair')
  AND company_name IN (
    SELECT company_name 
    FROM companies 
    GROUP BY company_name 
    HAVING COUNT(*) = 1  -- Single location only
  )
ORDER BY state, city;
```

**Expected Output:** ~800-1,000 single-location shops  
**Target Persona:** Skip (Independent Shop Owner)

---

### 3. OEM Dealers by Brand

**Use Case:** Target parts managers at authorized dealers

```sql
-- Cummins Dealers
SELECT 
  company_name,
  city,
  state,
  primary_phone,
  company_detail_url,
  COUNT(*) OVER (PARTITION BY company_name) as total_locations
FROM companies
WHERE state IN ('KY', 'IN', 'OH', 'TN', 'IL', 'MO', 'WV')
  AND (input_sub_service_type LIKE '%Cummins%' OR company_name LIKE '%Cummins%')
ORDER BY total_locations DESC, state, city;

-- Freightliner Dealers
SELECT 
  company_name,
  city,
  state,
  primary_phone,
  company_detail_url
FROM companies
WHERE state IN ('KY', 'IN', 'OH', 'TN', 'IL', 'MO', 'WV')
  AND (input_sub_service_type LIKE '%Freightliner%' OR company_name LIKE '%Freightliner%')
ORDER BY state, city;

-- International Dealers
SELECT 
  company_name,
  city,
  state,
  primary_phone,
  company_detail_url
FROM companies
WHERE state IN ('KY', 'IN', 'OH', 'TN', 'IL', 'MO', 'WV')
  AND (input_sub_service_type LIKE '%International%' OR company_name LIKE '%International%')
ORDER BY state, city;

-- All OEM Dealers Combined
SELECT 
  company_name,
  city,
  state,
  primary_phone,
  input_sub_service_type as brand,
  company_detail_url
FROM companies
WHERE state IN ('KY', 'IN', 'OH', 'TN', 'IL', 'MO', 'WV')
  AND input_sub_service_type IN ('Cummins', 'Cummins Sales and Service', 'Caterpillar', 
                                   'Mack', 'Detroit Diesel', 'Freightliner', 'International', 
                                   'Volvo', 'Kenworth', 'Peterbilt', 'Western Star')
ORDER BY input_sub_service_type, state, city;
```

**Expected Output:** ~350 OEM dealers  
**Target Persona:** Jennifer (OEM Dealer Parts Manager)

---

### 4. Tire Shop Chains (5+ Locations)

**Use Case:** Regional buyers at tire chains

```sql
SELECT 
  company_name,
  COUNT(*) as location_count,
  GROUP_CONCAT(DISTINCT state) as states_covered,
  primary_phone,
  GROUP_CONCAT(DISTINCT city || ', ' || state) as locations
FROM companies
WHERE state IN ('KY', 'IN', 'OH', 'TN', 'IL', 'MO', 'WV')
  AND input_sub_service_type IN ('Tire Shops', 'Tire Repair', 'Goodyear Service Centers')
GROUP BY company_name
HAVING location_count >= 5
ORDER BY location_count DESC;
```

**Expected Output:** ~30-50 tire shop chains  
**Target Persona:** Carlos (Tire Shop Chain Buyer)

---

### 5. Reefer/Refrigeration Specialists

**Use Case:** High-urgency buyers needing emergency parts delivery

```sql
SELECT 
  company_name,
  city,
  state,
  primary_phone,
  input_sub_service_type as service_type,
  features,
  company_detail_url
FROM companies
WHERE state IN ('KY', 'IN', 'OH', 'TN', 'IL', 'MO', 'WV')
  AND (input_sub_service_type IN ('Reefer Shops', 'Refrigeration', 'Thermo King', 'Carrier Transicold')
       OR company_name LIKE '%Thermo King%'
       OR company_name LIKE '%Carrier%'
       OR company_name LIKE '%Refrigerat%'
       OR company_name LIKE '%Reefer%')
ORDER BY state, city;
```

**Expected Output:** ~760 reefer/refrigeration shops  
**Target Persona:** Robert (Reefer Specialist Owner)

---

### 6. Trailer Dealers & Large Trailer Shops

**Use Case:** Parts managers at trailer OEM dealers

```sql
SELECT 
  company_name,
  city,
  state,
  primary_phone,
  input_sub_service_type as service_type,
  company_detail_url,
  COUNT(*) OVER (PARTITION BY company_name) as total_locations
FROM companies
WHERE state IN ('KY', 'IN', 'OH', 'TN', 'IL', 'MO', 'WV')
  AND (input_sub_service_type IN ('Trailer Shops', 'Trailer Repair', 'Trailer Parts', 
                                   'Great Dane', 'Wabash', 'Utility', 'Stoughton', 'Fontaine', 'Landoll')
       OR company_name LIKE '%Trailer%')
ORDER BY total_locations DESC, state, city;
```

**Expected Output:** ~617 trailer dealers/shops  
**Target Persona:** Amanda (Trailer Dealer/Shop Manager)

---

### 7. Towing Companies with Repair Capabilities

**Use Case:** Roadside service providers needing fast parts access

```sql
SELECT 
  company_name,
  city,
  state,
  primary_phone,
  features,
  company_detail_url
FROM companies
WHERE state IN ('KY', 'IN', 'OH', 'TN', 'IL', 'MO', 'WV')
  AND input_sub_service_type = 'Towing and Recovery'
  AND (features LIKE '%repair%' OR features LIKE '%service%' OR company_name LIKE '%Repair%')
ORDER BY state, city;
```

**Expected Output:** ~200-300 towing companies with repair shops  
**Target Persona:** Tony (Towing/Recovery Owner)

---

### 8. Louisville Metro Area Companies (All Types)

**Use Case:** Build local prospect list for Louisville territory

```sql
SELECT 
  company_name,
  city,
  zip_code,
  primary_phone,
  input_sub_service_type as service_type,
  company_detail_url,
  COUNT(*) OVER (PARTITION BY company_name) as total_locations
FROM companies
WHERE state = 'KY'
  AND (city LIKE '%Louisville%' 
       OR city LIKE '%Jeffersonville%' 
       OR city LIKE '%New Albany%'
       OR city LIKE '%Clarksville%'
       OR city LIKE '%Elizabethtown%'
       OR city LIKE '%Shepherdsville%'
       OR zip_code BETWEEN '40201' AND '40299'  -- Louisville zip codes
       OR zip_code IN ('47130', '47131', '47150', '47129'))  -- Southern IN
ORDER BY city, company_name;
```

**Note:** City data may be unreliable for KY records (see data quality issues)

---

## ANALYSIS QUERIES

### 9. Service Type Distribution by State

**Use Case:** Understand market composition by geography

```sql
SELECT 
  state,
  input_sub_service_type as service_type,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY state), 1) as pct_of_state
FROM companies
WHERE state IN ('KY', 'IN', 'OH', 'TN', 'IL', 'MO', 'WV')
  AND input_sub_service_type IS NOT NULL 
  AND input_sub_service_type != ''
GROUP BY state, input_sub_service_type
ORDER BY state, count DESC;
```

---

### 10. Multi-Location vs. Independent Breakdown

**Use Case:** Segment market by company size

```sql
SELECT 
  CASE 
    WHEN location_count >= 10 THEN 'Large Chain (10+ locations)'
    WHEN location_count >= 5 THEN 'Regional Chain (5-9 locations)'
    WHEN location_count >= 2 THEN 'Multi-location (2-4 locations)'
    ELSE 'Independent (single location)'
  END as business_type,
  COUNT(DISTINCT company_name) as companies,
  SUM(location_count) as total_locations,
  ROUND(AVG(location_count), 1) as avg_locations_per_company
FROM (
  SELECT 
    company_name,
    COUNT(*) as location_count
  FROM companies
  WHERE state IN ('KY', 'IN', 'OH', 'TN', 'IL', 'MO', 'WV')
  GROUP BY company_name
)
GROUP BY business_type
ORDER BY total_locations DESC;
```

---

### 11. Phone Number Patterns (Multi-Location Indicators)

**Use Case:** Identify corporate chains by shared phone numbers

```sql
SELECT 
  primary_phone,
  COUNT(DISTINCT company_name) as unique_companies,
  COUNT(*) as total_locations,
  GROUP_CONCAT(DISTINCT company_name) as company_names
FROM companies
WHERE state IN ('KY', 'IN', 'OH', 'TN', 'IL', 'MO', 'WV')
  AND primary_phone IS NOT NULL
GROUP BY primary_phone
HAVING total_locations >= 5
ORDER BY total_locations DESC;
```

**Insight:** Toll-free numbers (800, 866, 877, 833) = corporate chains

---

### 12. Companies with Detailed Service Descriptions

**Use Case:** Identify records with rich data for better targeting

```sql
SELECT 
  company_name,
  city,
  state,
  primary_phone,
  input_sub_service_type,
  LENGTH(features) as description_length,
  features
FROM companies
WHERE state IN ('KY', 'IN', 'OH', 'TN', 'IL', 'MO', 'WV')
  AND features IS NOT NULL 
  AND features != ''
  AND LENGTH(features) > 100
ORDER BY description_length DESC;
```

**Use Case 2:** Extract services offered from features column

```sql
-- Find companies offering specific services
SELECT 
  company_name,
  city,
  state,
  primary_phone,
  features
FROM companies
WHERE state IN ('KY', 'IN', 'OH', 'TN', 'IL', 'MO', 'WV')
  AND features LIKE '%24 Hour%'  -- 24-hour service
  AND features LIKE '%Roadside%'  -- Roadside assistance
ORDER BY state, city;
```

---

### 13. Data Quality Assessment

**Use Case:** Identify records needing cleanup/enrichment

```sql
-- Missing Data Summary
SELECT 
  'Total Records' as metric,
  COUNT(*) as count
FROM companies
WHERE state IN ('KY', 'IN', 'OH', 'TN', 'IL', 'MO', 'WV')

UNION ALL

SELECT 
  'Missing Phone' as metric,
  COUNT(*) as count
FROM companies
WHERE state IN ('KY', 'IN', 'OH', 'TN', 'IL', 'MO', 'WV')
  AND (primary_phone IS NULL OR primary_phone = '')

UNION ALL

SELECT 
  'Missing Website' as metric,
  COUNT(*) as count
FROM companies
WHERE state IN ('KY', 'IN', 'OH', 'TN', 'IL', 'MO', 'WV')
  AND (company_detail_url IS NULL OR company_detail_url = '')

UNION ALL

SELECT 
  'Missing Service Type' as metric,
  COUNT(*) as count
FROM companies
WHERE state IN ('KY', 'IN', 'OH', 'TN', 'IL', 'MO', 'WV')
  AND (input_sub_service_type IS NULL OR input_sub_service_type = '')

UNION ALL

SELECT 
  'Has Features/Description' as metric,
  COUNT(*) as count
FROM companies
WHERE state IN ('KY', 'IN', 'OH', 'TN', 'IL', 'MO', 'WV')
  AND features IS NOT NULL 
  AND features != '';
```

---

### 14. Competitive Intelligence: Top Chains by Service Type

**Use Case:** Identify major competitors in each category

```sql
SELECT 
  input_sub_service_type as service_type,
  company_name,
  COUNT(*) as locations,
  GROUP_CONCAT(DISTINCT state) as states_covered
FROM companies
WHERE state IN ('KY', 'IN', 'OH', 'TN', 'IL', 'MO', 'WV')
  AND input_sub_service_type IN ('Tire Shops', 'Truck Shops', 'Trailer Shops', 
                                  'Towing and Recovery', 'Reefer Shops', 'Truck Parts')
GROUP BY input_sub_service_type, company_name
HAVING locations >= 5
ORDER BY input_sub_service_type, locations DESC;
```

---

### 15. Gap Analysis: Expected vs. Actual Counts

**Use Case:** Identify underrepresented service types

```sql
-- Current counts by service type
SELECT 
  input_sub_service_type as service_type,
  COUNT(*) as current_count,
  CASE 
    WHEN input_sub_service_type = 'Trailer Parts' THEN 200  -- Expected count
    WHEN input_sub_service_type LIKE '%Freightliner%' THEN 100
    WHEN input_sub_service_type LIKE '%International%' THEN 60
    WHEN input_sub_service_type LIKE '%Volvo%' THEN 50
    WHEN input_sub_service_type LIKE '%Kenworth%' THEN 40
    WHEN input_sub_service_type LIKE '%Peterbilt%' THEN 35
    WHEN input_sub_service_type = 'Engine Parts' THEN 500
    WHEN input_sub_service_type = 'Truck Accessories' THEN 200
    ELSE NULL
  END as expected_count,
  CASE 
    WHEN input_sub_service_type IN ('Trailer Parts', 'Engine Parts', 'Truck Accessories') THEN 'CRITICAL GAP'
    WHEN input_sub_service_type LIKE '%Freightliner%' 
         OR input_sub_service_type LIKE '%International%'
         OR input_sub_service_type LIKE '%Volvo%'
         OR input_sub_service_type LIKE '%Kenworth%'
         OR input_sub_service_type LIKE '%Peterbilt%' THEN 'OEM DEALER GAP'
    ELSE 'OK'
  END as status
FROM companies
WHERE state IN ('KY', 'IN', 'OH', 'TN', 'IL', 'MO', 'WV')
  AND input_sub_service_type IS NOT NULL
GROUP BY input_sub_service_type
HAVING expected_count IS NOT NULL
ORDER BY (expected_count - current_count) DESC;
```

---

## EXPORT QUERIES FOR SALES TEAM

### 16. Top 200 Multi-Location Targets (Corporate Buyers)

**Export to CSV for sales team**

```sql
SELECT 
  company_name as "Company Name",
  COUNT(*) as "Total Locations",
  COUNT(DISTINCT state) as "States Covered",
  GROUP_CONCAT(DISTINCT state) as "States",
  primary_phone as "Phone",
  MAX(company_detail_url) as "Website",
  GROUP_CONCAT(DISTINCT input_sub_service_type) as "Service Types",
  'Regional Manager / Corporate Buyer' as "Target Title"
FROM companies
WHERE state IN ('KY', 'IN', 'OH', 'TN', 'IL', 'MO', 'WV')
GROUP BY company_name
HAVING COUNT(*) >= 5
ORDER BY COUNT(*) DESC
LIMIT 200;
```

---

### 17. Top 150 OEM Dealers (Parts Managers)

```sql
SELECT 
  company_name as "Company Name",
  city as "City",
  state as "State",
  primary_phone as "Phone",
  company_detail_url as "Website",
  input_sub_service_type as "Brand/Type",
  COUNT(*) OVER (PARTITION BY company_name) as "Total Locations",
  'Parts Manager / Service Manager' as "Target Title"
FROM companies
WHERE state IN ('KY', 'IN', 'OH', 'TN', 'IL', 'MO', 'WV')
  AND input_sub_service_type IN ('Cummins', 'Cummins Sales and Service', 'Caterpillar', 
                                   'Mack', 'Detroit Diesel', 'Freightliner', 'International', 
                                   'Volvo', 'Kenworth', 'Peterbilt', 'Western Star')
ORDER BY "Total Locations" DESC, state, city;
```

---

### 18. Top 100 Reefer Specialists (Emergency Service Focus)

```sql
SELECT 
  company_name as "Company Name",
  city as "City",
  state as "State",
  primary_phone as "Phone",
  company_detail_url as "Website",
  CASE 
    WHEN features LIKE '%24 Hour%' OR features LIKE '%Emergency%' THEN 'YES'
    ELSE 'Unknown'
  END as "24/7 Service",
  'Owner / Service Manager' as "Target Title"
FROM companies
WHERE state IN ('KY', 'IN', 'OH', 'TN', 'IL', 'MO', 'WV')
  AND input_sub_service_type IN ('Reefer Shops', 'Refrigeration', 'Thermo King', 'Carrier Transicold')
ORDER BY "24/7 Service" DESC, state, city
LIMIT 100;
```

---

## ADVANCED QUERIES

### 19. Find Companies Near Interstate Highways

**Use Case:** Target shops along major trucking corridors

```sql
-- Note: Requires geocoding or city-based approximation
-- Cities along I-65 (Louisville corridor)
SELECT 
  company_name,
  city,
  state,
  primary_phone,
  input_sub_service_type
FROM companies
WHERE state IN ('KY', 'IN', 'TN')
  AND city IN ('Louisville', 'Elizabethtown', 'Shepherdsville', 'Bowling Green', 
               'Franklin', 'Nashville', 'Jeffersonville', 'Seymour', 'Columbus', 'Indianapolis')
ORDER BY state, city;

-- Cities along I-71 (Cincinnati-Louisville corridor)
SELECT 
  company_name,
  city,
  state,
  primary_phone,
  input_sub_service_type
FROM companies
WHERE state IN ('KY', 'OH')
  AND city IN ('Cincinnati', 'Covington', 'Florence', 'Georgetown', 'Lexington', 'Louisville')
ORDER BY state, city;
```

---

### 20. Find Companies by Zip Code Radius

**Use Case:** Target 40217 (Louisville) + nearby zip codes

```sql
-- Louisville-area zip codes (approximate 25-mile radius)
SELECT 
  company_name,
  city,
  zip_code,
  primary_phone,
  input_sub_service_type,
  company_detail_url
FROM companies
WHERE state IN ('KY', 'IN')
  AND (zip_code BETWEEN '40201' AND '40299'  -- Louisville Metro
       OR zip_code IN ('47129', '47130', '47131', '47150',  -- Southern IN (Jeffersonville, New Albany)
                       '42701', '42702',  -- Elizabethtown
                       '40165', '40067'))  -- Shepherdsville, La Grange
ORDER BY zip_code, city;
```

---

## PERFORMANCE TIPS

1. **Add indexes for common filters:**
```sql
CREATE INDEX idx_state_service ON companies(state, input_sub_service_type);
CREATE INDEX idx_company_name ON companies(company_name);
CREATE INDEX idx_phone ON companies(primary_phone);
```

2. **Use EXPLAIN QUERY PLAN to optimize slow queries:**
```sql
EXPLAIN QUERY PLAN
SELECT * FROM companies WHERE state = 'KY' AND input_sub_service_type = 'Tire Shops';
```

3. **For large result sets, use LIMIT + OFFSET for pagination:**
```sql
SELECT * FROM companies 
WHERE state = 'KY' 
ORDER BY city, company_name
LIMIT 100 OFFSET 0;  -- First 100 records
```

---

## QUICK EXPORT COMMANDS (SQLite CLI)

```bash
# Export to CSV with headers
sqlite3 reseller-intel.db -header -csv "SELECT * FROM companies WHERE state = 'KY';" > ky_companies.csv

# Export multi-location targets
sqlite3 reseller-intel.db -header -csv "
  SELECT company_name, COUNT(*) as locations, primary_phone 
  FROM companies 
  GROUP BY company_name 
  HAVING locations >= 5 
  ORDER BY locations DESC;
" > multi_location_targets.csv

# Export OEM dealers
sqlite3 reseller-intel.db -header -csv "
  SELECT company_name, city, state, primary_phone, input_sub_service_type 
  FROM companies 
  WHERE input_sub_service_type IN ('Cummins', 'Caterpillar', 'Mack', 'Freightliner', 'International', 'Volvo', 'Kenworth', 'Peterbilt')
  ORDER BY input_sub_service_type, state, city;
" > oem_dealers.csv
```

---

*Use these queries to extract actionable target lists and analyze market opportunities in the Reseller Intel database.*
