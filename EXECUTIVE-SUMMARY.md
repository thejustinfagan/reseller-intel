# Executive Summary: Louisville Market Analysis
**40217 Zip + 250-Mile Radius | February 27, 2026**

---

## Key Numbers

- **Total companies in 7-state region:** 7,227
- **Database coverage rate:** ~80% (est. 8,400-9,000 total market)
- **Potential new companies to find:** 1,200-1,800
- **High-priority gaps:** 
  - Trailer parts suppliers: 150-200 missing
  - OEM dealers (Freightliner, International, Volvo, Kenworth, Peterbilt): 170-260 missing

---

## Business Type Breakdown

| Type | Count | % of Total | Sales Strategy |
|---|---|---|---|
| **Multi-location (2-4 locations)** | 3,417 | 47.3% | Regional buyer focus |
| **Independent (single location)** | 1,784 | 24.7% | Owner/manager direct |
| **Large chain (10+ locations)** | 1,509 | 20.9% | Corporate procurement |
| **Regional chain (5-9 locations)** | 517 | 7.2% | Regional manager |

**Insight:** Nearly half are multi-location operators - prioritize finding corporate/regional decision-makers over individual shop owners.

---

## 7 Buyer Personas (Quick Reference)

### 1. Marcus – Regional Fleet Maintenance Manager
- **Business:** Multi-location truck shop/mobile repair (5-15 locations)
- **Database count:** ~850 multi-location operators
- **Target:** 200-300 with 5+ locations
- **Key need:** Volume pricing, 24/7 delivery, single point of contact
- **Decision driver:** Speed (2-4 hour emergency delivery)

### 2. Skip – Independent Truck Shop Owner
- **Business:** Single-location independent shop
- **Database count:** 1,784 independents
- **Target:** 800-1,000 truck/trailer repair shops
- **Key need:** Fair pricing, same-day delivery, personal relationship
- **Decision driver:** Trust + reliability

### 3. Jennifer – OEM Dealer Parts Manager
- **Business:** Authorized OEM dealer (Cummins, Freightliner, Mack, etc.)
- **Database count:** ~350 OEM dealers
- **Target:** 200-250 parts managers at multi-location dealers
- **Key need:** Quality aftermarket alternatives to protect margin
- **Decision driver:** Quality + warranty + margin improvement

### 4. Carlos – Tire Shop Chain Regional Buyer
- **Business:** Tire shop chain (10-50 locations)
- **Database count:** 631 tire shops
- **Target:** 100-150 chains with 5+ locations
- **Key need:** Wheel-end kits, standardized SKUs, volume pricing
- **Decision driver:** Inventory turns + labor efficiency

### 5. Robert – Refrigeration/Reefer Specialist Owner
- **Business:** Reefer/refrigeration specialist shop
- **Database count:** 760 reefer/refrigeration shops
- **Target:** 200-300 independent specialists
- **Key need:** Emergency parts availability (2-4 hour delivery)
- **Decision driver:** **SPEED** (spoilage = lawsuits)

### 6. Amanda – Trailer Dealer/Repair Shop Manager
- **Business:** Trailer OEM dealer or large independent shop
- **Database count:** 617 trailer shops/dealers
- **Target:** 200-300 trailer dealers
- **Key need:** Generic trailer parts at aftermarket pricing
- **Decision driver:** Product breadth + competitive pricing

### 7. Tony – Towing/Recovery Company Owner
- **Business:** Towing company with repair shop (1-5 trucks)
- **Database count:** 577 towing companies
- **Target:** 200-300 with heavy-duty/repair capabilities
- **Key need:** Roadside repair parts, small quantities, driver pickup
- **Decision driver:** Immediate availability

---

## Critical Gaps (Highest Priority for Scraping)

### Gap #1: Trailer Parts Suppliers
- **Current:** 69 in region (only 5 in KY)
- **Expected:** 200-300
- **Missing:** 150-200 companies
- **Action:** Scrape Google Places + Yellow Pages for "trailer parts", "trailer supply"

### Gap #2: OEM Dealers (Freightliner, International, Volvo, Kenworth, Peterbilt)
- **Current:** 32 dealers for these brands combined
- **Expected:** 200-260
- **Missing:** 170-260 companies
- **Action:** Scrape manufacturer dealer locators

### Gap #3: Louisville Metro Data Quality
- **Issue:** Many KY records have incorrect city assignments (everything listed as "La Grange")
- **Action:** Re-scrape Louisville metro (40217 + 50 miles) with verified addresses
- **Expected yield:** 100-150 correctly-categorized companies

### Gap #4: Specialty Service Categories
- **Missing:** Engine parts suppliers (125-225), truck accessories (110-160), mobile service (200-300)
- **Action:** Phase 3 scraping with specialty keywords

---

## Top 3 Immediate Actions

### 1. Fix Louisville Data Quality (Week 1-2)
- Re-scrape Louisville metro using Google Places
- Verify city/address for all 935 KY records
- Phone verification pass (expect 5-10% disconnected)

### 2. Fill Critical Gaps (Week 2-4)
- Scrape OEM dealer locators (Freightliner, International, Volvo, Kenworth, Peterbilt)
- Scrape "trailer parts" + "trailer supply" keywords
- Target: 250-350 new companies

### 3. Enrich for Sales Targeting (Week 4-6)
- Extract decision-maker names from LinkedIn
- Website scraping for services offered + brands carried
- Segment by company size (facility analysis)

---

## Keyword Search Strategy (Top 10 by ROI)

### Highest-Yield Keywords (Google Places)
1. "truck repair shops Louisville KY"
2. "Freightliner dealer Kentucky" (+ other OEM brands)
3. "trailer parts Louisville"
4. "commercial truck service Louisville"
5. "mobile truck repair Louisville"
6. "Cummins dealer Louisville KY"
7. "refrigerated trailer repair Louisville"
8. "diesel repair shops Louisville"
9. "heavy duty truck repair Louisville"
10. "fleet repair services Louisville"

**Geographic Modifiers:** Apply to Jeffersonville IN, New Albany IN, Elizabethtown KY, Shepherdsville KY, Lexington KY, Cincinnati OH, Indianapolis IN

---

## Scraping ROI Estimate

### Phase 1: Fill Critical Gaps (Weeks 1-2)
- **Sources:** OEM dealer locators + Google Places (trailer parts)
- **Estimated yield:** 320-510 new companies
- **Effort:** 40-60 hours
- **Priority:** HIGH

### Phase 2: Broaden Coverage (Weeks 3-4)
- **Sources:** Google Places (all keywords) + Yelp + Yellow Pages
- **Estimated yield:** 650-1,050 new companies
- **Effort:** 80-120 hours
- **Priority:** MEDIUM

### Phase 3: Long-Tail & Specialty (Weeks 5-6)
- **Sources:** LinkedIn + Industry directories + BBB
- **Estimated yield:** 300-550 new companies
- **Effort:** 60-80 hours
- **Priority:** LOW

**Total Estimated Yield:** 1,270-2,110 new companies (realistic: 1,000-1,700 at 80% success rate)

---

## Sales Team Action Items

### Immediate (This Week)
1. **Export top 200 multi-location operators** (5+ locations) → Target: Regional/corporate buyers
2. **Export top 150 OEM dealers** → Target: Parts managers
3. **Export top 100 reefer specialists** → Target: Owners (highest urgency = best prospects)

### Short-Term (Next 30 Days)
1. **LinkedIn enrichment:** Extract decision-maker names/titles for top 500 prospects
2. **Website scraping:** Identify brands carried + services offered for targeting
3. **Phone verification:** Clean database (remove disconnected numbers)

### Long-Term (60-90 Days)
1. **Facility analysis:** Categorize shops by size (small/medium/large) for prioritization
2. **Brand affiliation database:** Map which shops service which OEM brands
3. **Ongoing scraping pipeline:** Monthly Google Places updates for new businesses

---

## Competitive Intelligence

### Top Multi-Location Operators (Potential National Account Targets)
1. **FYX Fleet** - 175 locations (mobile fleet service)
2. **Cummins Sales & Service** - 69 locations
3. **Rush Truck Center** - 39 locations
4. **Best One Tire & Service** - 33 locations
5. **Pomp's Tire** - 32 locations
6. **FleetPride** - 29 locations (parts distribution)

**Insight:** These companies represent high-volume, centralized purchasing. Winning one contract = 30-175 locations.

---

## Data Quality Observations

### Strengths
- ✅ 22,981 live deduped records in production (original raw scrape was 41,064 rows)
- ✅ 100% have city, state, phone (basic contact info)
- ✅ 25% have detailed service descriptions (features column)
- ✅ Multi-location chains well-represented

### Weaknesses
- ❌ `input_service_type` column is BLANK for ALL records (data in `input_sub_service_type` instead)
- ❌ Kentucky records have incorrect city assignments (many labeled "La Grange")
- ❌ Missing decision-maker names/titles (need LinkedIn enrichment)
- ❌ ~40% missing websites (limits brand inference)
- ❌ No facility size data (bay count, lot size)

### Priority Fixes
1. Fix KY city assignments (re-scrape with address verification)
2. Populate `input_service_type` from `input_sub_service_type`
3. Phone verification pass (expect 5-10% disconnected)
4. LinkedIn enrichment for decision-maker contacts

---

## Conclusion

**The Louisville market (40217 + 250 miles) is well-covered but has significant white space opportunities:**

- **1,200-1,800 potential new companies** to add (mostly trailer parts suppliers and OEM dealers)
- **7 distinct buyer personas** requiring differentiated messaging
- **Multi-location operators dominate** (47.3%) - focus on corporate/regional decision-makers
- **Reefer specialists operate on urgency** - emergency delivery capability is the key differentiator
- **Data quality improvements needed** - particularly in Louisville metro area

**Recommended investment:** 180-260 hours of scraping effort over 6 weeks to add 1,000-1,700 qualified prospects and clean existing data.

**Expected ROI:** Adding 1,500 new companies at 3% conversion rate = 45 new customers. If average customer value is $50K/year, that's $2.25M in new annual revenue from this effort.

---

*Full analysis: LOUISVILLE-MARKET-ANALYSIS.md*
