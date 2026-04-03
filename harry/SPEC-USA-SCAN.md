# SPEC: Harry USA Reseller Scan
**Agent: Harry (Gemma4 OpenClaw bot)**
**No paid APIs. Pure web scraping only.**

---

## Mission
Scan the entire USA for truck parts resellers, OEM dealers, repair shops, and reefer specialists. Find businesses not yet in the reseller-intel database. Write everything to the shared repo so Larry can review and the main DB can be enriched.

---

## What We Are Looking For
Class 6-8 commercial vehicle businesses:
- Truck parts suppliers and distributors
- OEM dealers (Freightliner, Kenworth, Peterbilt, Mack, Volvo, International, Western Star, Cummins, Detroit Diesel)
- Heavy duty repair shops
- Trailer dealers and repair shops
- Reefer/refrigeration specialists (Thermo King, Carrier Transicold)
- Fleet maintenance companies
- Tire shops (commercial/truck)
- Towing and recovery (heavy duty)

NOT looking for: passenger car dealers, light duty repair, car parts stores

---

## Free Scraping Sources (in priority order)

### 1. FindTruckService.com
Already the source of existing 23,660 records — but coverage is incomplete.
URL pattern: https://www.findtruckservice.com/[service-type]/[state]/[city]
Scrape by state + service type. Extract: name, address, phone, detail URL, service type.

### 2. OEM Dealer Locators (highest value targets)
These are public locator pages — no API needed:
- Freightliner: https://www.freightliner.com/find-a-dealer/
- Kenworth: https://www.kenworth.com/dealers/
- Peterbilt: https://www.peterbilt.com/dealer-locator
- Mack: https://www.macktrucks.com/dealer-locator/
- Volvo: https://www.volvotrucks.us/find-a-dealer/
- International: https://www.internationaltrucks.com/dealer-locator
- Western Star: https://www.westernstar.com/find-a-dealer/
- Cummins: https://www.cummins.com/parts-and-service/dealer-locator
- Thermo King: https://www.thermoking.com/dealer-locator
- Carrier Transicold: https://www.carrier.com/truck-trailer/en/north-america/find-a-dealer/

### 3. Yellow Pages
URL pattern: https://www.yellowpages.com/search?search_terms=[keyword]&geo_location_terms=[city]+[state]
Keywords: "truck parts", "semi truck repair", "commercial truck dealer", "trailer repair", "diesel repair"
50 major cities × 5 keywords = 250 searches

### 4. Yelp Search Pages
URL pattern: https://www.yelp.com/search?find_desc=[keyword]&find_loc=[city]+[state]
Same keywords and cities as Yellow Pages.

### 5. BBB Business Search
URL pattern: https://www.bbb.org/search?find_text=[keyword]&find_loc=[city]+[state]
Good for finding established businesses with addresses and phone numbers.

### 6. TruckPaper.com Dealers
https://www.truckpaper.com/dealers/
Lists commercial truck dealers by state — scrape all states.

### 7. Commercial Carrier Journal Directories
https://www.ccjdigital.com/
Public dealer/service directories.

---

## USA City Coverage (50 cities, 300-mile radius each)

Priority Tier 1 (Major logistics hubs — scan first):
Chicago IL, Dallas TX, Memphis TN, Atlanta GA, Columbus OH, Indianapolis IN, Louisville KY, Nashville TN, St Louis MO, Kansas City MO, Minneapolis MN, Denver CO, Phoenix AZ, Los Angeles CA, Seattle WA, Charlotte NC, Detroit MI, Cleveland OH, Pittsburgh PA, Cincinnati OH

Priority Tier 2 (Secondary hubs):
Milwaukee WI, Omaha NE, Salt Lake City UT, Portland OR, Sacramento CA, Jacksonville FL, Tampa FL, Miami FL, Houston TX, San Antonio TX, Oklahoma City OK, Little Rock AR, Birmingham AL, Knoxville TN, Lexington KY, Columbus GA, Raleigh NC, Richmond VA, Baltimore MD, Philadelphia PA

Priority Tier 3 (Fill gaps):
Buffalo NY, Hartford CT, Providence RI, Albany NY, Des Moines IA, Sioux Falls SD, Billings MT, Boise ID, Albuquerque NM, El Paso TX

---

## Keywords Per City (from existing KEYWORD-CHECKLIST.md)

Core (run on every city):
- truck parts [city] [state]
- semi truck repair [city]
- commercial truck dealer [city]
- trailer repair [city]
- diesel repair shop [city]
- heavy duty truck parts [city]
- truck service center [city]

OEM (run on Tier 1 cities):
- Freightliner dealer [state]
- Kenworth dealer [state]
- Peterbilt dealer [city]
- Mack truck dealer [city]
- Volvo truck dealer [city]
- International truck dealer [city]
- Cummins dealer [city]
- Thermo King dealer [city]
- Carrier Transicold [city]

Specialty:
- refrigerated trailer repair [city]
- fleet maintenance [city]
- commercial tire service [city]
- trailer parts [city]
- heavy duty towing [city]

---

## Output Format

Each find written as JSON to ~/dev/reseller-intel/harry/finds-raw/

File naming: YYYY-MM-DD-[city]-[source]-[batch#].json

Each record:
```json
{
  "company_name": "...",
  "address": "...",
  "city": "...",
  "state": "...",
  "zip": "...",
  "phone": "...",
  "website": "...",
  "source_url": "...",
  "source": "yellowpages|yelp|findtruckservice|oem-locator|bbb|truckpaper",
  "service_type": "...",
  "brand": "...",
  "rating": null,
  "review_count": null,
  "scraped_at": "ISO timestamp",
  "harry_notes": "brief classification note"
}
```

---

## Scan State / Checkpoint

Harry writes progress to: ~/dev/reseller-intel/harry/scan-state.json

```json
{
  "started_at": "...",
  "last_updated": "...",
  "cities_completed": [...],
  "cities_remaining": [...],
  "current_city": "...",
  "current_source": "...",
  "total_finds": 0,
  "new_finds": 0,
  "duplicates_skipped": 0,
  "errors": []
}
```

---

## Scan Log

Harry appends each batch result to: ~/dev/reseller-intel/harry/scan-log.json

Each entry:
```json
{
  "timestamp": "...",
  "city": "...",
  "source": "...",
  "keyword": "...",
  "results_found": 5,
  "new_records": 3,
  "skipped_duplicates": 2,
  "sample": ["Company A - Memphis TN", "Company B - Memphis TN"]
}
```

---

## Larry Feedback Loop

Harry reads: ~/dev/reseller-intel/harry/larry-feedback.md before each new city batch.

Format Larry will use:
```
## Feedback [timestamp]
- QUALITY: good/poor + reason
- SKIP: [source] - reason
- PRIORITIZE: [city or keyword] - reason
- NOTE: any other instruction
```

Harry acts on the most recent feedback entry.

---

## Cron Schedule

Harry cron (every 30 minutes):
- Read larry-feedback.md for any new instructions
- Run next batch: 1 city × 3 sources × 5 keywords
- Write finds to finds-raw/
- Update scan-state.json and scan-log.json
- If no cities remaining: start Tier 2, then Tier 3

Nightly at 2am:
- Deduplicate all finds-raw/ against existing DB
- Write clean records to ingest-queue.json
- Write summary to harry/nightly-summary.md

---

## Larry's Cron Jobs (on Hermes/Larry side)

Every 2 hours Larry runs:
1. Read scan-state.json — how many cities done, total finds
2. Sample 10 random records from finds-raw/
3. Evaluate quality using Gemma4 locally
4. Write feedback to larry-feedback.md
5. Send Telegram message to Justin with:
   - Cities scanned so far
   - New finds count
   - Quality verdict
   - Any issues flagged

Nightly at 3am Larry runs:
1. Read harry/nightly-summary.md
2. Run ingest: import ingest-queue.json into reseller-intel.db
3. Report: X new companies added, Y duplicates skipped
4. Send final nightly report to Justin on Telegram

---

## Deduplication Rules

A record is a duplicate if ANY of these match existing DB:
1. Exact phone number match
2. Exact company name + city + state
3. Same domain in company_detail_url

New records only: write to DB with source=harry-scan

---

## Rate Limiting (be a good citizen)

- 2-3 second delay between requests
- Max 10 requests per minute per domain
- Rotate user agents
- If 429/blocked: skip source, log error, move to next
- Never hammer the same domain back to back

---

## Tech Stack for Harry

Python script: ~/dev/reseller-intel/harry/scanner.py
Dependencies: requests, beautifulsoup4, playwright (for JS-heavy sites)
State file: scan-state.json (resume on restart)
Logging: scan-log.json

Harry runs this via his OpenClaw cron every 30 minutes:
`cd ~/dev/reseller-intel && python3 harry/scanner.py --batch`

---

## Deliverables

1. harry/scanner.py — main scraper
2. harry/sources/ — one file per source (findtruckservice.py, yellowpages.py, yelp.py, oem_locators.py, bbb.py, truckpaper.py)
3. harry/ingest.py — dedup + import to DB
4. harry/cities.json — full city list with coordinates
5. harry/keywords.json — keyword list by tier
6. harry/scan-state.json — initial empty state
7. harry/larry-feedback.md — initial empty file
8. harry/scan-log.json — initial empty log
9. Cron instruction for Harry's OpenClaw
10. Cron instructions for Larry's Hermes

---

## Acceptance Criteria

- scanner.py runs without errors on first city
- Finds are written to finds-raw/ in correct format
- scan-state.json updates after each batch
- Duplicates against existing DB are detected and skipped
- Rate limiting is respected
- Larry can read scan-log.json and understand what Harry did
- ingest.py imports new records to reseller-intel.db correctly
- No paid API calls anywhere
