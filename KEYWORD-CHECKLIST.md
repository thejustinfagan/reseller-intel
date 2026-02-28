# Keyword Search Checklist
**For Google Places, Yelp, Yellow Pages Scraping**

## Quick Reference Guide
✅ = High priority (scrape first)  
⚡ = Emergency/24-hour services (high-value prospects)  
🎯 = Multi-location indicators

---

## MASTER KEYWORD LIST (Copy/Paste Ready)

### Core Service Types (High Volume)
```
✅ truck repair shops [city] [state]
✅ semi truck repair [city]
✅ commercial truck service [city]
✅ diesel repair shops [city]
✅ trailer repair [city]
✅ truck parts suppliers [city]
✅ heavy duty truck repair near me
⚡ 24 hour truck repair [city]
```

### Independent Shop Keywords (Persona 2: Skip)
```
independent truck shop [city]
family owned truck repair [city]
diesel mechanic shop [city]
truck and trailer repair [city]
heavy duty repair shop [city]
semi truck mechanic [city]
truck repair shop near [interstate]
```

### Multi-Location/Fleet Keywords (Persona 1: Marcus)
```
🎯 truck repair chain [state]
🎯 mobile truck repair service [city]
🎯 fleet repair services [city]
🎯 multi-location truck shops [state]
⚡ 24/7 mobile diesel repair
fleet maintenance companies [city]
truck repair franchise locations
```

### OEM Dealer Keywords (Persona 3: Jennifer)
```
✅ Cummins dealer [city] [state]
✅ Freightliner dealer [state]
✅ Mack truck dealer [city]
✅ International truck dealer [state]
✅ Volvo truck dealer [city]
Kenworth dealer [state]
Peterbilt dealer [city]
authorized truck dealer [brand]
OEM truck parts [city]
factory authorized service center [brand]
Detroit Diesel dealer [state]
Caterpillar dealer [city]
```

### Tire Shop Keywords (Persona 4: Carlos)
```
commercial tire service [city]
🎯 truck tire shop chain [state]
tire service center [city]
commercial tire dealers [city]
fleet tire service [state]
Goodyear commercial tire [city]
Michelin truck tire dealer
tire shop locations [state]
truck tire and service center
```

### Reefer/Refrigeration Keywords (Persona 5: Robert)
```
✅ refrigerated trailer repair [city]
✅ Thermo King dealer [city]
✅ Carrier Transicold service [city]
⚡ reefer repair shop [state]
trailer refrigeration service [city]
⚡ reefer unit repair near me
refrigeration repair truck trailer
cold chain equipment repair
reefer shop [city]
Thermo King authorized service
```

### Trailer Dealer/Shop Keywords (Persona 6: Amanda)
```
✅ trailer dealer [city]
✅ Great Dane dealer [state]
✅ Wabash trailer dealer [city]
✅ Utility trailer dealer [state]
trailer repair shop [city]
semi trailer sales and service
trailer parts [city]
trailer service center [state]
authorized trailer dealer
Stoughton trailer dealer
Fontaine trailer dealer
```

### Towing/Recovery Keywords (Persona 7: Tony)
```
heavy duty towing [city]
truck towing service [state]
semi towing and recovery
⚡ 24 hour truck towing [city]
commercial towing [city]
wrecker service [city]
truck recovery service [state]
towing company with repair shop
```

### Specialty Service Keywords
```
DOT inspection station [city]
PM service truck shop [city]
DPF cleaning service [city]
truck diagnostic repair [city]
fleet maintenance contract [city]
⚡ 24/7 roadside repair [city]
mobile truck service [city]
APU service [city]
lift gate repair [city]
truck upfitting [city]
truck wash [city]
truck alignment [city]
```

### NAICS Code Reference
```
811111 - General Automotive Repair
811198 - All Other Automotive Repair and Maintenance
423120 - Motor Vehicle Supplies and New Parts
441228 - Motor Vehicle Dealers (includes trailers)
488410 - Motor Vehicle Towing
441320 - Tire Dealers
```

---

## GEOGRAPHIC MODIFIERS (Copy/Paste)

### Primary Markets (Louisville Metro + 50 Miles)
```
Louisville KY
Jeffersonville IN
New Albany IN
Clarksville IN
Elizabethtown KY
Shepherdsville KY
La Grange KY
Shelbyville KY
Bardstown KY
```

### Secondary Markets (50-100 Miles)
```
Lexington KY
Cincinnati OH
Evansville IN
Bowling Green KY
Frankfort KY
Georgetown KY
```

### Tertiary Markets (100-250 Miles)
```
Indianapolis IN
Columbus OH
Nashville TN
Owensboro KY
Paducah KY
Fort Wayne IN
Dayton OH
```

---

## SCRAPING WORKFLOW (Step-by-Step)

### Phase 1: Critical Gaps (Week 1-2)
**Priority: Trailer Parts + OEM Dealers**

**Day 1-2: OEM Dealer Locators**
- [ ] Freightliner.com → Dealer Locator (7-state region)
- [ ] InternationalTrucks.com → Find a Dealer
- [ ] Volvo.com/trucks → Service & Parts Locator
- [ ] Kenworth.com → Dealer Locator
- [ ] Peterbilt.com → Find a Dealer
- [ ] Cummins.com → QuickServe Locator
- [ ] MackTrucks.com → Dealer Locator

**Expected Yield:** 170-260 dealers

**Day 3-5: Trailer Parts Suppliers**
- [ ] Google Places: "trailer parts" + all cities (primary + secondary markets)
- [ ] Google Places: "trailer supply" + all cities
- [ ] Yellow Pages: "trailer parts" + "trailer accessories"
- [ ] NTEA.com → Member Directory (filter for trailer equipment)

**Expected Yield:** 150-200 suppliers

---

### Phase 2: Broaden Coverage (Week 3-4)
**Priority: All Service Types, All Geographies**

**Week 3: Google Places Scraping**
Run these searches for ALL primary + secondary market cities:
- [ ] "truck repair shops [city] [state]"
- [ ] "trailer repair [city] [state]"
- [ ] "diesel repair shops [city]"
- [ ] "commercial truck service [city]"
- [ ] "mobile truck repair [city]"
- [ ] "truck parts suppliers [city]"
- [ ] "refrigerated trailer repair [city]"
- [ ] "tire service center [city]"
- [ ] "24 hour truck repair [city]"
- [ ] "heavy duty truck repair [city]"

**Expected Yield:** 400-600 companies

**Week 4: Yelp + Yellow Pages**
- [ ] Yelp: All keywords from Week 3 (dedupe against Google results)
- [ ] Yellow Pages: "Truck Repair", "Trailer Repair", "Diesel Repair", "Truck Parts", "Towing", "Tire Service"

**Expected Yield:** 250-450 companies (after deduping)

---

### Phase 3: Long-Tail & Specialty (Week 5-6)
**Priority: LinkedIn + Industry Directories + BBB**

**Week 5: LinkedIn Company Search**
- [ ] "truck repair" + location filters (KY, IN, OH, TN, IL, MO, WV)
- [ ] "diesel service" + location
- [ ] "trailer repair" + location
- [ ] "mobile truck repair" + location
- [ ] "fleet service" + location

**Bonus:** Extract decision-maker names/titles (Parts Manager, Service Manager, Owner, etc.)

**Expected Yield:** 100-200 companies + 200-400 contact names

**Week 6: Industry Associations + BBB**
- [ ] NTEA (National Truck Equipment Association) → Member Directory
- [ ] TRALA (Truck Renting and Leasing Association) → Supplier Directory
- [ ] TMC (Technology & Maintenance Council) → Member List
- [ ] State Trucking Associations (KY, IN, OH, TN) → Member lists
- [ ] BBB.org → "Truck Repair", "Diesel Engines", "Trailer Repair", "Truck Parts"

**Expected Yield:** 200-350 companies

---

## DEDUPLICATION CHECKLIST

After each scraping batch, dedupe against existing database:

1. **Phone Number Match** (highest confidence)
   - [ ] Check if `primary_phone` exists in database
   - [ ] If match + similar name → DUPLICATE (keep newer/more complete record)
   - [ ] If match + very different name → FLAG FOR REVIEW (could be acquisition)

2. **Normalized Name + City + State Match**
   - [ ] Normalize: lowercase, remove punctuation, remove "LLC", "Inc", "Corp", "Co", "Ltd", "the", "and", "&"
   - [ ] If exact match → DUPLICATE (merge records)

3. **Fuzzy Name + Address Match**
   - [ ] Use Levenshtein distance (85%+ similarity)
   - [ ] If fuzzy match + same street address → FLAG FOR REVIEW

4. **Website Match**
   - [ ] If both records have website URLs and they match → DUPLICATE

**Tools:**
- Python: `fuzzywuzzy`, `phonenumbers`, `pandas`
- SQL: `SOUNDEX()`, `DIFFERENCE()`

---

## ENRICHMENT CHECKLIST

For each new company record:

### Immediate (Required)
- [ ] **Phone verification** - Validate format, check if disconnected
- [ ] **Address validation** - Verify street address (not PO Box only)
- [ ] **Service type assignment** - Categorize into 1-3 service types
- [ ] **Website extraction** - Scrape company website URL

### Secondary (High Priority)
- [ ] **Services offered** - Scrape website for services list
- [ ] **Brands carried** - Look for OEM logos/mentions on website
- [ ] **Multiple locations** - Check website for additional addresses
- [ ] **Contact names** - Extract from website "About Us" or "Contact" pages

### Tertiary (Nice to Have)
- [ ] **Facility size** - Google Street View for bay count/lot size assessment
- [ ] **Reviews** - Capture Google/Yelp review count + average rating
- [ ] **Social media** - Facebook business page URL
- [ ] **Email addresses** - Use Hunter.io or manual website scraping

---

## DATA QUALITY VALIDATION

Before adding to database, verify:

- ✅ Phone number is valid format (not disconnected)
- ✅ Address is complete (street, city, state, zip)
- ✅ Service type is assigned (at least one category)
- ✅ No duplicate match on phone, name+city, or website
- ✅ Legitimacy check: Website exists OR Yelp/Google reviews exist OR listed in industry directory

**Reject if:**
- ❌ Phone disconnected or invalid
- ❌ Address is PO Box only (need physical location)
- ❌ Obvious duplicate
- ❌ No online presence AND not in any directory (likely out of business)

---

## PROGRESS TRACKING

### Phase 1: Critical Gaps (Target: 320-510 new companies)
- [ ] OEM dealers scraped: ___/260
- [ ] Trailer parts suppliers scraped: ___/200
- [ ] Phone verified: ___% 
- [ ] Websites extracted: ___%
- [ ] Duplicates removed: ___

### Phase 2: Broaden Coverage (Target: 650-1,050 new companies)
- [ ] Google Places: ___/600
- [ ] Yelp: ___/250
- [ ] Yellow Pages: ___/200
- [ ] Duplicates removed: ___

### Phase 3: Long-Tail (Target: 300-550 new companies)
- [ ] LinkedIn: ___/200
- [ ] Industry associations: ___/250
- [ ] BBB: ___/100
- [ ] Decision-maker names extracted: ___

**TOTAL NEW COMPANIES ADDED:** _____  
**GOAL:** 1,000-1,700

---

## QUICK REFERENCE: Top 5 Highest-ROI Searches

If you only have time for 5 searches, do these:

1. **"Freightliner dealer [state]"** (+ other OEM brands) → 170-260 high-value dealers
2. **"trailer parts [city]"** → 150-200 critical gap companies
3. **"truck repair shops Louisville KY"** (+ surrounding cities) → 200-300 core prospects
4. **"refrigerated trailer repair [city]"** → 100-150 high-urgency buyers
5. **LinkedIn: "parts manager" + "truck dealer"** → 200-400 decision-maker contacts

**These 5 searches = 820-1,310 new records (50-75% of total potential yield)**

---

*Use this checklist to track scraping progress and ensure consistent data quality.*
