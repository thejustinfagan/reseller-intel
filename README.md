# Reseller Intel: Louisville Market Analysis
**Market Research Analysis | 40217 Zip + 250-Mile Radius**  
**Completed:** February 27, 2026

---

## 📊 What's in This Folder

This market research project now references the **22,981-company deduped production dataset** (down from the original 41,064-row pre-dedup scrape, with the same 7,227-company Louisville-region analysis basis) to develop buyer personas and keyword strategies for truck parts suppliers targeting the Louisville, KY market.

---

## 📁 Deliverables

### 1. **LOUISVILLE-MARKET-ANALYSIS.md** (Full Report - 44KB)
**Complete market research analysis including:**
- Database analysis (service types, geographic distribution, company characteristics)
- 7 detailed buyer personas with pain points, goals, and decision criteria
- 30+ keyword search strategies grouped by persona
- Gap analysis (1,200-1,800 missing companies identified)
- Scraping recommendations with estimated yield by source

**Read this first** for the full strategic analysis.

---

### 2. **EXECUTIVE-SUMMARY.md** (Quick Briefing - 9KB)
**High-level overview for executives/sales leadership:**
- Key numbers and business type breakdown
- 7 buyer personas (quick reference)
- Critical gaps and immediate actions
- Top 3 priorities for next 30 days
- ROI estimate for scraping investment

**Read this** for a 10-minute briefing on findings and recommendations.

---

### 3. **KEYWORD-CHECKLIST.md** (Tactical Guide - 10KB)
**Copy/paste-ready keyword list and scraping workflow:**
- 30+ search keywords organized by persona
- Geographic modifiers (Louisville + surrounding cities)
- 6-week scraping workflow with progress tracking
- Deduplication checklist
- Data quality validation rules

**Use this** as your day-to-day scraping reference.

---

### 4. **SQL-QUERY-LIBRARY.md** (Database Toolkit - 18KB)
**20+ SQL queries for target list extraction and analysis:**
- Target list queries (multi-location operators, OEM dealers, reefer specialists, etc.)
- Analysis queries (service distribution, competitive intelligence, gap analysis)
- Export queries for sales team (CSV-ready)
- Performance tips and indexing recommendations

**Use this** to extract prospect lists from the database.

---

## 🎯 Key Findings at a Glance

### Database Overview
- **Current live deduped company count:** 22,981 nationwide (original raw scrape: 41,064 rows)
- **Louisville region (7 states):** 7,227 companies
- **Kentucky only:** 935 companies
- **Database coverage:** ~80% of total market

### Business Type Breakdown
- **47.3%** multi-location operators (2-4 locations) → Focus on regional buyers
- **20.9%** large chains (10+ locations) → Corporate procurement targets
- **24.7%** independents (single location) → Owner/manager direct sales
- **7.2%** regional chains (5-9 locations) → Regional manager targets

### Critical Market Gaps
1. **Trailer parts suppliers:** Only 69 in region (expected: 200-300) → **150-200 missing**
2. **OEM dealers:** Freightliner, International, Volvo, Kenworth, Peterbilt severely underrepresented → **170-260 missing**
3. **Louisville metro data quality:** Many KY records have incorrect city assignments → **100-150 corrections needed**

### Total Opportunity
- **Potential new companies to find:** 1,200-1,800
- **High-priority targets:** 500-700 (OEM dealers + trailer parts suppliers)
- **Estimated scraping effort:** 180-260 hours over 6 weeks
- **Expected yield:** 1,000-1,700 new qualified prospects

---

## 👥 7 Buyer Personas (Quick Reference)

| Persona | Business Type | Database Count | Key Need | Decision Driver |
|---|---|---|---|---|
| **Marcus** | Multi-location truck shop chain (5-15 locations) | 850 | Volume pricing, 24/7 delivery | Speed (2-4 hour emergency) |
| **Skip** | Independent truck/trailer shop | 1,784 | Fair pricing, same-day local delivery | Trust + reliability |
| **Jennifer** | OEM dealer parts manager | 350 | Quality aftermarket alternatives | Margin improvement |
| **Carlos** | Tire shop chain buyer (10-50 locations) | 631 tire shops | Wheel-end kits, volume pricing | Inventory turns |
| **Robert** | Reefer specialist owner | 760 | Emergency parts (2-4 hour delivery) | **SPEED** (spoilage risk) |
| **Amanda** | Trailer dealer/shop manager | 617 | Generic trailer parts, breadth | Product range + pricing |
| **Tony** | Towing/recovery owner | 577 | Roadside parts, small quantities | Immediate availability |

**Full persona details (pain points, goals, decision criteria, geographic patterns) in main report.**

---

## 🚀 Immediate Actions (Next 30 Days)

### Week 1-2: Fix Critical Data Quality Issues
- [ ] Re-scrape Louisville metro (40217 + 50 miles) with verified addresses
- [ ] Phone verification for all 7,227 existing companies (expect 5-10% disconnected)
- [ ] Website extraction (currently missing for ~60% of records)

### Week 2-4: Fill Critical Gaps
- [ ] Scrape OEM dealer locators (Freightliner, International, Volvo, Kenworth, Peterbilt) → **Target: 170-260 dealers**
- [ ] Google Places: "trailer parts" + "trailer supply" (all cities) → **Target: 150-200 suppliers**
- [ ] Yellow Pages: "trailer parts" + "trailer accessories"

### Week 4-6: Enrich for Sales Targeting
- [ ] LinkedIn: Extract decision-maker names/titles (Parts Manager, Service Manager, Owner)
- [ ] Website scraping: Services offered + brands carried
- [ ] Categorize by company size (facility analysis)

**Expected outcome:** 500-700 new high-priority companies + cleaned database ready for sales outreach

---

## 📈 Scraping ROI Estimate

### Investment
- **Effort:** 180-260 hours over 6 weeks
- **Tools:** Google Places API, web scraping tools (Scrapy/Octoparse), phone verification API

### Return
- **New companies added:** 1,000-1,700 qualified prospects
- **Conversion rate (est.):** 3%
- **New customers:** 30-50
- **Average customer value:** $50K/year
- **New annual revenue:** $1.5M - $2.5M

**Payback period:** < 6 months if executed properly

---

## 🔍 Top 5 Highest-ROI Scraping Targets

If you only have time for 5 searches, prioritize these:

1. **OEM dealer locators** (Freightliner, International, Volvo, Kenworth, Peterbilt) → **170-260 high-value dealers**
2. **"trailer parts [city]"** (Google Places + Yellow Pages) → **150-200 critical gap companies**
3. **"truck repair shops Louisville KY"** (+ surrounding cities) → **200-300 core prospects**
4. **"refrigerated trailer repair [city]"** → **100-150 high-urgency buyers**
5. **LinkedIn: "parts manager" + "truck dealer"** → **200-400 decision-maker contacts**

**These 5 = 820-1,310 new records (50-75% of total potential yield)**

---

## 🛠️ How to Use These Documents

### For Sales Leadership
1. Read **EXECUTIVE-SUMMARY.md** (10 minutes)
2. Review 7 buyer personas and prioritize which to target first
3. Decide on scraping investment (180-260 hours over 6 weeks)
4. Assign resources: 1-2 people for scraping, 1 person for enrichment

### For Sales Reps
1. Use **SQL-QUERY-LIBRARY.md** to extract target lists:
   - Top 200 multi-location operators → Regional buyers
   - Top 150 OEM dealers → Parts managers
   - Top 100 reefer specialists → Emergency service focus
2. Tailor messaging to specific persona (see main report for pain points/decision criteria)
3. Track outreach and conversion rates by persona

### For Marketing Team
1. Use **KEYWORD-CHECKLIST.md** for:
   - Google Ads campaign keywords
   - SEO content strategy
   - Industry directory listings
2. Develop persona-specific messaging:
   - Marcus: "Volume pricing + 24/7 emergency delivery"
   - Skip: "Same-day local delivery + personal service"
   - Jennifer: "Quality aftermarket alternatives + protect your margin"
   - Robert: "2-4 hour emergency delivery + reefer expertise"

### For Data/Operations Team
1. Execute scraping workflow from **KEYWORD-CHECKLIST.md**
2. Use **SQL-QUERY-LIBRARY.md** for deduplication and data quality checks
3. Prioritize enrichment:
   - Phone verification (remove disconnected numbers)
   - Website extraction (for brand inference)
   - LinkedIn scraping (for decision-maker names)

---

## 📊 Data Quality Notes

### Current State
- ✅ 22,981 live deduped records in production (original raw scrape was 41,064 rows)
- ✅ 100% have city, state, phone (basic contact info)
- ✅ 25% have detailed service descriptions (`features` column)
- ✅ Multi-location chains well-represented

### Issues to Fix
- ❌ `input_service_type` column is BLANK for ALL records (use `input_sub_service_type` instead)
- ❌ Kentucky records have incorrect city assignments (many labeled "La Grange" incorrectly)
- ❌ Missing decision-maker names/titles (need LinkedIn enrichment)
- ❌ ~40% missing websites (limits brand inference)
- ❌ No facility size data (bay count, lot size)

### Priority Improvements
1. **Fix KY city assignments** (re-scrape with address verification)
2. **Phone verification** (expect 5-10% disconnected)
3. **Website extraction** (scrape for all records)
4. **LinkedIn enrichment** (decision-maker names/titles)
5. **Facility analysis** (Google Street View for shop size assessment)

---

## 🗺️ Geographic Coverage

**7-State Region Analyzed:**
- Kentucky: 935 companies
- Ohio: 1,419 companies
- Indiana: 1,361 companies
- Illinois: 1,135 companies
- Missouri: 1,044 companies
- Tennessee: 946 companies
- West Virginia: 387 companies

**Total:** 7,227 companies

**Louisville Metro Focus:**
- Louisville, KY
- Jeffersonville, IN
- New Albany, IN
- Clarksville, IN
- Elizabethtown, KY
- Shepherdsville, KY

**250-Mile Radius Extends To:**
- Cincinnati, OH
- Lexington, KY
- Indianapolis, IN
- Nashville, TN
- Evansville, IN
- Bowling Green, KY

---

## 📞 Next Steps

### Decision Required
- **Approve scraping budget:** 180-260 hours over 6 weeks
- **Assign resources:** Who will execute the scraping workflow?
- **Set timeline:** When do you want the enriched database ready for sales outreach?

### Questions to Resolve
1. Which buyer personas are highest priority? (Recommend: Marcus, Jennifer, Robert)
2. Which geographic markets to focus on first? (Recommend: Louisville metro, then expand)
3. What level of enrichment is required before sales outreach? (Recommend: phone verification + website extraction minimum)

---

## 📧 Contact

For questions about this analysis or assistance with execution, contact the project lead.

---

## 📁 File Inventory

```
/projects/reseller-intel/
├── README.md                           # This file (project overview)
├── LOUISVILLE-MARKET-ANALYSIS.md      # Full report (44KB)
├── EXECUTIVE-SUMMARY.md               # Executive briefing (9KB)
├── KEYWORD-CHECKLIST.md               # Tactical scraping guide (10KB)
├── SQL-QUERY-LIBRARY.md               # Database queries (18KB)
└── data/
    └── reseller-intel.db              # SQLite database (22,981 live deduped companies; 41,064 raw rows before dedup)
```

**Total Documentation:** 81KB (4 markdown files)  
**Database Size:** 22,981 live deduped companies nationwide (from 41,064 raw rows), 7,227 in Louisville-region analysis

---

*Analysis completed: February 27, 2026*  
*Database analyzed: reseller-intel.db (22,981 live deduped companies; 41,064 raw rows before dedup)*  
*Geographic focus: 40217 zip code (Louisville, KY) + 250-mile radius*
