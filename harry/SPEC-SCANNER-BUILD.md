# SPEC: Harry Scanner Scaffolding
**Builder: Barry (claude-sonnet-4-5)**
**Runner: Harry (Gemma4)**

---

## Goal
Build a Python scraping pipeline that Harry (a local Gemma4 AI agent) runs every 30 minutes to find truck parts resellers, OEM dealers, and repair shops across the USA. No paid APIs. Pure web scraping with rate limiting.

---

## Repo
~/dev/reseller-intel/
All scanner code goes in: ~/dev/reseller-intel/harry/

---

## What to Build

### 1. harry/scanner.py — Main entry point
```
Usage: python3 harry/scanner.py --batch
```
- Reads harry/scan-state.json to find next city + source + keyword to process
- Runs the appropriate source scraper
- Writes results to harry/finds-raw/YYYY-MM-DD-[city]-[source]-[n].json
- Updates harry/scan-state.json and appends to harry/scan-log.json
- Reads harry/larry-feedback.md for any instructions before starting
- Exits after one batch (cron handles repeat)
- Handles errors gracefully — logs and moves on, never crashes

### 2. harry/sources/findtruckservice.py
Scrape findtruckservice.com
URL pattern: https://www.findtruckservice.com/[service-type]/[state]/[city]
Service types to iterate: truck-repair, truck-parts, trailer-repair, diesel-repair, refrigeration
Extract per listing: name, address, phone, detail_url, service_type
Return list of dicts in standard output format (see below)

### 3. harry/sources/yellowpages.py
Scrape yellowpages.com search results
URL: https://www.yellowpages.com/search?search_terms=[keyword]&geo_location_terms=[city]+[state]
Keywords: "truck parts", "semi truck repair", "commercial truck dealer", "trailer repair", "diesel repair"
Extract: business name, address, phone, website, category
Paginate up to 3 pages per search

### 4. harry/sources/yelp.py
Scrape yelp.com search results (public pages, no API)
URL: https://www.yelp.com/search?find_desc=[keyword]&find_loc=[city]+[state]
Same keywords as Yellow Pages
Extract: business name, address, phone, rating, review_count, category
Paginate up to 3 pages

### 5. harry/sources/oem_locators.py
Scrape OEM dealer locator pages
Each brand has a public locator — use Playwright for JS-heavy ones
Brands and URLs:
- Freightliner: https://www.freightliner.com/find-a-dealer/
- Kenworth: https://www.kenworth.com/dealers/
- Peterbilt: https://www.peterbilt.com/dealer-locator
- Mack: https://www.macktrucks.com/dealer-locator/
- Volvo: https://www.volvotrucks.us/find-a-dealer/
- International: https://www.internationaltrucks.com/dealer-locator
- Thermo King: https://www.thermoking.com/dealer-locator
- Carrier Transicold: https://www.carrier.com/truck-trailer/en/north-america/find-a-dealer/
Extract: dealer name, address, phone, website, brand
Run once (not per city) — gets all USA dealers for each brand

### 6. harry/sources/truckpaper.py
Scrape truckpaper.com dealer listings
URL: https://www.truckpaper.com/dealers/
Extract dealer name, location, phone, website, brands
Paginate through all states

### 7. harry/ingest.py
```
Usage: python3 harry/ingest.py
```
- Reads all files in harry/finds-raw/
- Deduplicates against existing reseller-intel.db:
  - Skip if phone already exists in companies table
  - Skip if company_name + city + state already exists
  - Skip if website domain already exists in company_detail_url
- Inserts new unique records into companies table
- Fields: company_name, city, state, primary_phone, company_detail_url, input_sub_service_type, created_at, source (='harry-scan')
- Writes summary to harry/nightly-summary.md
- Clears processed files from finds-raw/ (move to finds-raw/processed/)

### 8. harry/cities.json
Full list of 50 cities with state abbreviation:
Tier 1: Chicago IL, Dallas TX, Memphis TN, Atlanta GA, Columbus OH, Indianapolis IN, Louisville KY, Nashville TN, St Louis MO, Kansas City MO, Minneapolis MN, Denver CO, Phoenix AZ, Los Angeles CA, Seattle WA, Charlotte NC, Detroit MI, Cleveland OH, Pittsburgh PA, Cincinnati OH
Tier 2: Milwaukee WI, Omaha NE, Salt Lake City UT, Portland OR, Sacramento CA, Jacksonville FL, Tampa FL, Miami FL, Houston TX, San Antonio TX, Oklahoma City OK, Little Rock AR, Birmingham AL, Knoxville TN, Lexington KY, Raleigh NC, Richmond VA, Baltimore MD, Philadelphia PA, Buffalo NY

Format:
```json
[
  {"city": "Chicago", "state": "IL", "tier": 1},
  ...
]
```

### 9. harry/keywords.json
```json
{
  "core": ["truck parts", "semi truck repair", "commercial truck dealer", "trailer repair", "diesel repair", "heavy duty truck parts", "truck service center"],
  "oem": ["Freightliner dealer", "Kenworth dealer", "Peterbilt dealer", "Mack truck dealer", "Volvo truck dealer", "International truck dealer", "Cummins dealer", "Thermo King dealer"],
  "specialty": ["refrigerated trailer repair", "fleet maintenance", "commercial tire service", "trailer parts", "heavy duty towing"]
}
```

---

## Standard Output Format (all sources return this)

```python
{
    "company_name": str,
    "address": str,           # full street address
    "city": str,
    "state": str,             # 2-letter abbreviation
    "zip": str,
    "phone": str,
    "website": str,           # company website if available
    "source_url": str,        # page we scraped this from
    "source": str,            # "yellowpages" | "yelp" | "findtruckservice" | "oem-locator" | "truckpaper"
    "service_type": str,      # "truck repair" | "truck parts" | "dealer" | "trailer repair" | etc
    "brand": str,             # OEM brand if applicable, else None
    "rating": float,          # if available, else None
    "review_count": int,      # if available, else None
    "scraped_at": str,        # ISO timestamp
    "harry_notes": str        # leave blank — Harry fills this in
}
```

---

## Rate Limiting (critical — do not skip)

```python
import time, random

def polite_get(url, session, min_delay=2, max_delay=4):
    time.sleep(random.uniform(min_delay, max_delay))
    headers = {"User-Agent": random_user_agent()}
    return session.get(url, headers=headers, timeout=15)
```

- 2-4 second random delay between ALL requests
- Max 10 requests per minute per domain
- If 429 or blocked: log error, skip to next keyword/city, do not retry immediately
- Rotate user agents (provide a list of 5 common browser user agents)

---

## Deduplication Before Writing

Before writing any find to finds-raw/, check in-memory against already-found records in current session:
- Skip exact duplicate phone numbers
- Skip exact duplicate name + city combinations
This reduces noise in the raw files.

---

## Error Handling

- Every scraper wrapped in try/except
- Log all errors to scan-state.json errors array
- Never let one bad URL crash the whole batch
- If a source is consistently failing (3+ errors in a row): skip it for this city, move on

---

## Constraints

- No paid APIs anywhere
- No Google Places API, no Yelp Fusion API, no SerpAPI
- Use requests + BeautifulSoup for static pages
- Use Playwright (already installed) for JS-heavy OEM locators
- Python 3.11
- Dependencies: requests, beautifulsoup4, playwright, better-sqlite3 (already in project)

---

## Testing

After building, run:
```bash
cd ~/dev/reseller-intel
python3 harry/scanner.py --batch
```

Should:
- Process first city (Chicago) from first source (findtruckservice)
- Write at least 1 file to harry/finds-raw/
- Update harry/scan-state.json
- Append 1 entry to harry/scan-log.json
- Print summary to stdout

---

## Deliverables

1. harry/scanner.py
2. harry/sources/__init__.py
3. harry/sources/findtruckservice.py
4. harry/sources/yellowpages.py
5. harry/sources/yelp.py
6. harry/sources/oem_locators.py
7. harry/sources/truckpaper.py
8. harry/ingest.py
9. harry/cities.json
10. harry/keywords.json
11. harry/requirements.txt (just the new deps)

Commit with: "feat: harry scanner scaffolding"
Report back: what you built, first batch test results, any sources that failed and why.
