# Louisville Market Analysis: Buyer Personas & Search Strategy
**40217 Zip Code + 250-Mile Radius**  
**Analysis Date:** February 27, 2026  
**Database Size:** 22,981 live deduped reseller companies in production (from the original 41,064-row scrape; 7,227 in target region)

---

## EXECUTIVE SUMMARY

**Target Region Coverage:** Kentucky, Indiana, Ohio, Tennessee, Illinois, Missouri, West Virginia  
**Total Companies in Region:** 7,227 locations  
**Kentucky Specific:** 935 companies  
**Database Quality:** 25% have detailed service descriptions; all records have city/state/phone; service type data in `input_sub_service_type` column

**Key Findings:**
- **47.3%** are multi-location operators (2-4 locations)
- **20.9%** are large chains (10+ locations)
- **24.7%** are true independents (single location)
- **Major gap:** Trailer parts suppliers severely underrepresented (only 69 in entire region)
- **Multi-location indicator:** 175+ locations share phone numbers indicating corporate ownership

---

## 1. RESELLER DATABASE ANALYSIS

### Service Type Distribution (7-State Region)

| Service Type | Total Locations | KY Only | % of Total |
|---|---|---|---|
| **Tire Shops** | 631 | 80 | 8.7% |
| **Towing & Recovery** | 577 | 87 | 8.0% |
| **Trailer Shops** | 548 | 73 | 7.6% |
| **Truck Shops** | 424 | 57 | 5.9% |
| **Reefer Shops** | 359 | 49 | 5.0% |
| **Refrigeration** | 401 | 63 | 5.5% |
| **Trailer Repair** | 304 | 48 | 4.2% |
| **Truck Repair** | 297 | 55 | 4.1% |
| **Truck Parts** | 230 | 54 | 3.2% |
| **All Truck Stops** | 186 | 24 | 2.6% |
| **Trailer Parts** | 69 | 5 | 1.0% |

**OEM Dealer Presence (7-State Region):**
- **Cummins:** 179 locations (116 unique companies)
- **Caterpillar:** 123 locations (90 unique companies)
- **Mack:** 27 locations (21 unique companies)
- **Detroit Diesel:** 25 locations (8 unique companies)
- **Freightliner:** 23 locations
- **International:** 6 locations
- **Volvo, Kenworth, Peterbilt:** <5 each

### Geographic Distribution

**State-by-State Breakdown:**

| State | Total Companies | Unique Phone Numbers | Multi-Location % |
|---|---|---|---|
| Ohio | 1,419 | 890 | 37.3% |
| Indiana | 1,361 | 878 | 35.5% |
| Illinois | 1,135 | 722 | 36.4% |
| Missouri | 1,044 | 688 | 34.1% |
| Tennessee | 946 | 596 | 37.0% |
| **Kentucky** | **935** | **555** | **40.6%** |
| West Virginia | 387 | 257 | 33.6% |

**Kentucky has the HIGHEST percentage of multi-location operators in the region** (40.6% share phone numbers with other locations).

### Company Size Characteristics

| Business Type | Count | % of Total |
|---|---|---|
| Multi-location (2-4 locations) | 3,417 | 47.3% |
| Independent (single location) | 1,784 | 24.7% |
| Large Chain (10+ locations) | 1,509 | 20.9% |
| Regional Chain (5-9 locations) | 517 | 7.2% |

### Top Multi-Location Operators (7-State Region)

| Company Name | Locations | Service Type |
|---|---|---|
| FYX Fleet | 175 | Mobile/Fleet Service |
| Cummins Sales & Service | 69 | OEM Dealer |
| Rush Truck Center | 39 | OEM Dealer |
| Priority Wrecker Service | 39 | Towing/Recovery |
| Best One Tire & Service | 33 | Tire Service |
| Pomp's Tire | 32 | Tire Service |
| FleetPride | 29 | Parts Distribution |
| Wrancle Mobile Service | 26 | Mobile Repair |
| Purcell Tire & Service | 25 | Tire Service |
| JX Truck Center | 25 | Truck Service |

### Phone Number Patterns (Multi-Location Indicators)

**Top Shared Phone Numbers:**
- **(800) 655-6837** → 1,453 locations (Love's Truck Care)
- **(866) 220-0730** → 1,116 locations (FYX Fleet - 175 in region)
- **(877) 769-8177** → 634 locations
- **(833) 260-7867** → 122 locations
- **(866) 220-0730)** → 175 regional locations (FYX Fleet)

**Insight:** Companies with toll-free numbers (800, 866, 877, 833) are 87% likely to be multi-location chains. This is a strong indicator for targeting decision-makers vs. owner-operators.

---

## 2. BUYER PERSONAS (5-7 Detailed Profiles)

### PERSONA 1: "Marcus – Regional Fleet Maintenance Manager"

**Title:** Director of Fleet Maintenance / Fleet Operations Manager  
**Business Type:** Multi-location truck shop or mobile repair company (5-15 locations)  
**Examples:** Wrancle Mobile Service (26 locations), Quick Fix Truck Repair (23 locations), J&L Mobile Truck & Trailer Repair (16 locations)

**Characteristics:**
- Manages 5-15 service locations across 2-3 states
- Corporate phone number (toll-free or centralized)
- Responsible for $2-5M annual parts procurement
- Reports to VP Operations or owns equity in the business

**Pain Points:**
- Inconsistent parts availability across locations
- Need for rapid delivery (2-4 hour windows for emergency repairs)
- Price volatility on common failure items (starters, alternators, brake components)
- Managing inventory across multiple locations without over-stocking
- Vendor consolidation (too many suppliers = too many invoices)

**Goals:**
- Reduce downtime for customer fleets (their reputation depends on speed)
- Negotiate volume pricing across all locations
- Single point of contact for all locations
- Real-time inventory visibility
- 24/7 emergency parts availability

**Decision Criteria:**
1. Same-day or 2-4 hour delivery capability
2. Volume pricing with corporate account terms
3. Product range (can you be a one-stop shop?)
4. After-hours support (nights/weekends)
5. Credit terms (net 30-60)

**Geographic Patterns:**
- Cluster along major interstate corridors (I-65, I-71, I-75, I-64)
- Typically have 1-2 "hub" locations near metro areas (Louisville, Cincinnati, Indianapolis)
- Satellite locations in smaller markets 50-100 miles out

**Database Count:**
- **Exist in database:** ~850 companies (multi-location with 2-4 shops)
- **Should target:** ~200-300 (focus on 5+ locations with mobile/truck repair services)

**Marketing Hook:** "One call, all your locations covered. Volume pricing. 24/7 emergency delivery."

---

### PERSONA 2: "Skip – Independent Truck Shop Owner"

**Title:** Owner / General Manager  
**Business Type:** Independent single-location truck or trailer repair shop  
**Examples:** Walters Truck & Trailer Repair, Don's Heavy Duty Truck Repair, B&M Truck Tire & Trailer Repair

**Characteristics:**
- Single location, 3-10 bays
- Owner-operator or family-owned business
- $500K - $2M annual revenue
- 5-20 employees (mix of techs, service writers, parts counter)
- Been in business 10-30 years
- Local phone number (area code matches location)

**Pain Points:**
- Can't get volume pricing like the big guys
- Parts suppliers don't prioritize small orders
- Emergency situations = scrambling to find parts from multiple vendors
- Supplier sales reps don't visit regularly
- Stuck between cheap offshore parts (quality issues) and OEM pricing (margin killer)
- Limited warehouse space - can't stock everything

**Goals:**
- Reliable same-day parts availability
- Fair pricing without volume commitments
- Build relationship with ONE supplier who understands his business
- Access to hard-to-find legacy parts
- Technical support (application help, cross-references)

**Decision Criteria:**
1. Local delivery (within 50 miles) - ideally same-day
2. Personal relationship with sales rep
3. Fair pricing (not bottom-dollar, but not gouging)
4. Product knowledge / technical support
5. Willingness to stock specialty items he needs regularly

**Geographic Patterns:**
- Small towns and rural areas (populations 5,000-50,000)
- Along state highways and secondary routes
- 30-60 miles outside major metro areas
- Often near truck stops or weigh stations

**Database Count:**
- **Exist in database:** ~1,784 single-location independents
- **Should target:** ~800-1,000 (focus on truck/trailer repair shops, exclude towing-only)

**Marketing Hook:** "We treat you like the big accounts. Same-day delivery, personal service, fair pricing."

---

### PERSONA 3: "Jennifer – OEM Dealer Parts Manager"

**Title:** Parts Manager / Parts Director  
**Business Type:** Authorized OEM dealer (Cummins, Freightliner, Mack, International, Volvo, etc.)  
**Examples:** Rush Truck Center, Nacarato Truck Centers, Fyda Freightliner, MHC Kenworth

**Characteristics:**
- Large dealership, often multi-location (3-20+ stores)
- Focused on one or two OEM brands
- High-volume parts department ($3-15M annual parts sales)
- Significant OEM parts inventory on-site
- Factory-trained technicians
- Heavy warranty/recall work

**Pain Points:**
- OEM parts margin pressure (manufacturer sets prices)
- Need aftermarket alternatives for out-of-warranty work
- Customer price resistance on OEM parts
- Inventory carrying costs (need to stock OEM + need aftermarket options)
- Competition from independent shops on price

**Goals:**
- Offer competitive aftermarket alternatives for non-warranty work
- Improve parts margin (OEM = 20-25%, aftermarket = 35-45%)
- Keep customers in-house (vs. losing them to independents)
- Fast delivery on aftermarket items not stocked
- Quality assurance (can't risk comebacks)

**Decision Criteria:**
1. Quality certification (ISO, TSI6949, OE-equivalent specs)
2. Warranty support (1-2 year warranty matching OEM)
3. Brand reputation (tier 1/2 suppliers preferred)
4. Delivery speed (emergency 2-4 hour, routine next-day)
5. Credit terms and margin support

**Geographic Patterns:**
- Major metro areas and interstate highway intersections
- Typically 1-2 dealers per OEM brand per metro market
- Often co-located with truck sales showrooms

**Database Count:**
- **Exist in database:** ~350 OEM dealer locations (Cummins, Cat, Mack, Freightliner, International, Volvo, Kenworth, Peterbilt)
- **Should target:** ~200-250 (parts managers at multi-location dealers and high-volume independents)

**Marketing Hook:** "Quality aftermarket alternatives. Protect your margin without compromising your reputation."

---

### PERSONA 4: "Carlos – Tire Shop Chain Regional Buyer"

**Title:** Regional Purchaser / Procurement Manager  
**Business Type:** Tire shop chain (10-50 locations), mix of commercial and consumer tires  
**Examples:** Pomp's Tire (32 locations), Best One Tire & Service (33 locations), Purcell Tire & Service (25 locations)

**Characteristics:**
- Manages purchasing for 10-50 tire service centers
- 70/30 mix of tire sales vs. mechanical service
- Significant wheel, brake, suspension parts volume
- Centralized purchasing with location-level inventory
- Strong focus on cost per unit and turn rates

**Pain Points:**
- Tire suppliers dominate relationship (Goodyear, Bridgestone, Michelin) but weak on mechanical parts
- Need reliable wheel-end component supplier (drums, hubs, bearings, seals, brake components)
- Inconsistent quality from discount suppliers
- Managing SKU proliferation across locations
- Need kits and assemblies (not individual parts)

**Goals:**
- Consolidate wheel-end, brake, and suspension parts with one vendor
- Standardize SKUs across all locations
- Improve inventory turns (reduce slow-moving stock)
- Get better pricing than current 3-4 fragmented suppliers
- Kitting/bundling to reduce tech labor time

**Decision Criteria:**
1. Wheel-end and brake expertise (application guides, kitting)
2. Volume pricing with rebate programs
3. VMI (vendor-managed inventory) or consignment options
4. Training support for technicians
5. EDI/integration with their POS system

**Geographic Patterns:**
- Concentrated in urban/suburban markets
- Cluster within 100-mile radius (drivable for regional manager)
- Locations along commercial corridors

**Database Count:**
- **Exist in database:** ~631 tire shops (including 80 in KY)
- **Should target:** ~100-150 tire chains with 5+ locations

**Marketing Hook:** "Wheel-end and brake kits. One SKU, complete repair. Better pricing, faster turns."

---

### PERSONA 5: "Robert – Refrigeration/Reefer Specialist Owner"

**Title:** Owner / Service Manager  
**Business Type:** Reefer/refrigeration specialist shop (single or 2-3 locations)  
**Examples:** Gateway Truck & Refrigeration (17 locations), independent Thermo King/Carrier dealers

**Characteristics:**
- Specializes in trailer refrigeration units (Thermo King, Carrier Transicold)
- 2-8 technicians with EPA certifications
- Services fleets (food distribution, pharmaceuticals, grocery)
- High-value parts (compressors, condensers, evaporators = $1K-$5K each)
- Emergency service is critical (spoilage = lawsuits)

**Pain Points:**
- Parts availability is EVERYTHING (customer can't wait - product is spoiling)
- Limited supplier options (mostly OEM or specialty distributors)
- Markup on refrigeration components is high but so is urgency
- Need same-day or emergency delivery (2-4 hours)
- Technical support for diagnostics (refrigeration systems are complex)

**Goals:**
- Emergency parts availability (compressors, controllers, sensors)
- Competitive pricing on high-volume consumables (filters, belts, refrigerant)
- Technical support hotline for diagnostics
- Stock consignment for critical failure items
- Build trust with a supplier who understands reefer urgency

**Decision Criteria:**
1. **Emergency availability** (this is #1 - nothing else matters if you can't deliver in 2-4 hours)
2. Breadth of refrigeration parts (Thermo King, Carrier, plus generic components)
3. Technical expertise (not just a parts counter - actual refrigeration knowledge)
4. Willingness to stock critical items locally or consignment
5. After-hours support (breakdowns don't wait for business hours)

**Geographic Patterns:**
- Near food distribution hubs, cold storage facilities, ports
- Urban and suburban markets (where fleets are based)
- Less common in rural areas

**Database Count:**
- **Exist in database:** ~760 reefer/refrigeration shops (359 reefer shops + 401 refrigeration)
- **Should target:** ~200-300 (focus on independent specialists and small chains)

**Marketing Hook:** "Reefer emergency? We deliver in 2-4 hours. Critical parts in stock. Technical support 24/7."

---

### PERSONA 6: "Amanda – Trailer Dealer/Repair Shop Manager"

**Title:** Service Manager / Parts Manager  
**Business Type:** Trailer sales & service dealer (Great Dane, Wabash, Utility, Stoughton, etc.)  
**Examples:** Wick's Truck Trailers (Wabash dealer), Great Dane dealers, Utility dealers

**Characteristics:**
- Authorized trailer OEM dealer or large independent trailer shop
- New trailer sales + service & parts
- 5-15 service bays
- Significant parts counter business (sell to walk-in customers)
- Focus on trailer-specific components (doors, hinges, flooring, landing gear, lights, gladhands)

**Pain Points:**
- OEM trailer parts are expensive and slow (special order, 3-7 days)
- Customers want cheaper alternatives for older trailers (10+ years old)
- Trailer parts suppliers are fragmented (one for lights, one for doors, one for suspensions)
- Need aftermarket options for generic components (lights, wiring, gladhands, mud flaps)
- Managing inventory for 5-10 different trailer brands

**Goals:**
- One-stop supplier for generic trailer components
- Competitive pricing on high-volume items (lights, wiring, connectors)
- Fast delivery on doors, hinges, flooring, landing gear
- Technical resources (application guides, cross-references for OEM parts)
- Display/merchandising support for retail parts counter

**Decision Criteria:**
1. Product breadth (can you supply 70%+ of non-OEM trailer parts?)
2. Competitive pricing (20-30% below OEM on generic components)
3. Same-day or next-day delivery
4. Technical support and application guides
5. Counter display programs (for walk-in retail sales)

**Geographic Patterns:**
- Interstate highway corridors and logistics hubs
- Near manufacturing/distribution centers
- Often co-located with truck dealers or in industrial parks

**Database Count:**
- **Exist in database:** ~548 trailer shops + 69 trailer parts suppliers = 617 total
- **Should target:** ~200-300 trailer dealers and large independent shops

**Marketing Hook:** "Generic trailer parts, OEM quality, aftermarket pricing. One supplier, full coverage."

---

### PERSONA 7: "Tony – Towing/Recovery Company Owner"

**Title:** Owner / Dispatcher  
**Business Type:** Towing & recovery company (1-5 trucks)  
**Examples:** Priority Wrecker Service, Complete Towing & Repair, Candido's Towing & Repair

**Characteristics:**
- 1-10 tow trucks (mix of light-duty, medium-duty, heavy-duty)
- Provides roadside assistance: lockouts, fuel delivery, jump starts, tire changes, towing
- May have small repair shop (2-4 bays) for basic service work
- Contracts with motor clubs (AAA, Better World Club), trucking companies, and municipalities
- Emergency service 24/7 (tow truck operators work nights/weekends)

**Pain Points:**
- Parts needs are sporadic but urgent (broken gladhand, blown air line, flat tire)
- Need small quantities fast (can't stock everything on the truck)
- Compete on response time (faster = more business)
- Low margin business (need cheap, reliable parts)
- Parts suppliers don't understand roadside service urgency

**Goals:**
- Fast access to roadside repair parts (air lines, fittings, glad hands, bulbs, fuses)
- Small-quantity orders (don't need bulk)
- Emergency delivery or pickup (can driver pick up parts on the way to a call?)
- Competitive pricing (margin is tight)
- Relationship with supplier who understands towing business

**Decision Criteria:**
1. Immediate availability (can driver pick up en route?)
2. Small quantity sales (sell by the piece, not by the case)
3. After-hours access (emergency delivery or pickup)
4. Consumable items in stock (glad hands, air fittings, bulbs, fuses, belts)
5. Pricing (need to stay competitive)

**Geographic Patterns:**
- Every city and town has 1-5 towing companies
- Concentrated near interstate highways and truck routes
- Rural areas have fewer but cover larger territories

**Database Count:**
- **Exist in database:** ~577 towing & recovery companies
- **Should target:** ~200-300 (focus on companies with repair shops or heavy-duty towing capabilities)

**Marketing Hook:** "Roadside parts, right now. Driver pickup, emergency delivery, small quantities OK."

---

## 3. KEYWORD SEARCH STRATEGIES (20-30 Keywords by Persona)

### General/Cross-Persona Keywords (High-Volume)
1. "truck repair shops near Louisville KY"
2. "semi truck repair Louisville"
3. "commercial truck service Louisville KY"
4. "diesel repair shops Louisville"
5. "trailer repair Louisville KY"
6. "truck parts suppliers Louisville"
7. "heavy duty truck repair near me"
8. "24 hour truck repair Louisville"

---

### PERSONA 1 (Marcus – Regional Fleet Manager) – Multi-Location Chains

**Keywords:**
1. "truck repair chain Kentucky"
2. "mobile truck repair service Louisville"
3. "fleet repair services Louisville KY"
4. "multi-location truck shops Kentucky"
5. "commercial truck repair chain Indiana"
6. "24/7 mobile diesel repair"
7. "fleet maintenance companies Louisville"
8. "truck repair franchise locations"

**NAICS Codes:**
- **811111** - General Automotive Repair
- **811198** - All Other Automotive Repair and Maintenance
- **423120** - Motor Vehicle Supplies and New Parts Merchant Wholesalers

**Industry Directories:**
- American Trucking Associations (ATA) membership directories
- Technology & Maintenance Council (TMC) member lists
- State trucking association directories (Kentucky Trucking Association, etc.)
- FleetOwner.com supplier directories

---

### PERSONA 2 (Skip – Independent Shop Owner)

**Keywords:**
1. "independent truck shop [city name]"
2. "family owned truck repair [city name]"
3. "diesel mechanic shop [city name]"
4. "truck and trailer repair [city name]"
5. "heavy duty repair shop [city name]"
6. "semi truck mechanic [city name]"
7. "truck repair shop near [interstate highway]"
8. "[city name] truck service"

**Location-Specific Examples:**
- "truck repair Elizabethtown KY"
- "diesel shop Shepherdsville KY"
- "semi repair Jeffersonville IN"
- "truck mechanic New Albany IN"
- "heavy duty shop Clarksville IN"

**NAICS Codes:**
- **811111** - General Automotive Repair
- **811198** - All Other Automotive Repair and Maintenance

---

### PERSONA 3 (Jennifer – OEM Dealer Parts Manager)

**Keywords:**
1. "Cummins dealer Louisville KY"
2. "Freightliner dealer Kentucky"
3. "Mack truck dealer Louisville"
4. "International truck dealer Indiana"
5. "Volvo truck dealer Louisville KY"
6. "Kenworth dealer Kentucky"
7. "Peterbilt dealer Louisville"
8. "authorized truck dealer [brand]"
9. "OEM truck parts Louisville"
10. "factory authorized service center"

**Specific Brand Searches:**
- "Cummins service center Louisville KY"
- "Detroit Diesel dealer Kentucky"
- "Caterpillar dealer Louisville"
- "Allison transmission dealer"
- "Eaton dealer Louisville KY"

**NAICS Codes:**
- **423110** - Automobile and Other Motor Vehicle Merchant Wholesalers
- **441228** - Motorcycle, ATV, and All Other Motor Vehicle Dealers
- **423120** - Motor Vehicle Supplies and New Parts Merchant Wholesalers

---

### PERSONA 4 (Carlos – Tire Shop Chain)

**Keywords:**
1. "commercial tire service Louisville KY"
2. "truck tire shop chain Kentucky"
3. "tire service center Louisville"
4. "commercial tire dealers Louisville"
5. "fleet tire service Kentucky"
6. "Goodyear commercial tire Louisville"
7. "Michelin truck tire dealer"
8. "tire shop locations Kentucky Indiana"
9. "truck tire and service center"

**Multi-Location Examples:**
- "Pomp's Tire locations"
- "Best One Tire Kentucky"
- "tire shop with multiple locations"

**NAICS Codes:**
- **441320** - Tire Dealers
- **811198** - All Other Automotive Repair and Maintenance (tire repair)

---

### PERSONA 5 (Robert – Reefer Specialist)

**Keywords:**
1. "refrigerated trailer repair Louisville KY"
2. "Thermo King dealer Louisville"
3. "Carrier Transicold service Louisville"
4. "reefer repair shop Kentucky"
5. "trailer refrigeration service Louisville"
6. "reefer unit repair near me"
7. "refrigeration repair truck trailer"
8. "cold chain equipment repair"
9. "reefer shop Louisville KY"
10. "Thermo King authorized service"

**NAICS Codes:**
- **811198** - All Other Automotive Repair and Maintenance
- **423740** - Refrigeration Equipment and Supplies Merchant Wholesalers
- **811310** - Commercial and Industrial Machinery and Equipment Repair

---

### PERSONA 6 (Amanda – Trailer Dealer/Shop)

**Keywords:**
1. "trailer dealer Louisville KY"
2. "Great Dane dealer Kentucky"
3. "Wabash trailer dealer Louisville"
4. "Utility trailer dealer Indiana"
5. "trailer repair shop Louisville KY"
6. "semi trailer sales and service"
7. "trailer parts Louisville"
8. "trailer service center Kentucky"
9. "authorized trailer dealer"
10. "Stoughton trailer dealer"

**NAICS Codes:**
- **441228** - Motorcycle, ATV, and All Other Motor Vehicle Dealers (includes trailers)
- **423110** - Automobile and Other Motor Vehicle Merchant Wholesalers
- **423120** - Motor Vehicle Supplies and New Parts Merchant Wholesalers

---

### PERSONA 7 (Tony – Towing/Recovery)

**Keywords:**
1. "heavy duty towing Louisville KY"
2. "truck towing service Kentucky"
3. "semi towing and recovery"
4. "24 hour truck towing Louisville"
5. "commercial towing Louisville KY"
6. "wrecker service Louisville"
7. "truck recovery service Kentucky"
8. "towing company with repair shop"

**NAICS Codes:**
- **488410** - Motor Vehicle Towing
- **811198** - All Other Automotive Repair and Maintenance

---

### Additional Keyword Strategies

**Geo-Modifier Keywords (apply to all personas):**
- Replace "Louisville KY" with: Jeffersonville IN, New Albany IN, Elizabethtown KY, Shepherdsville KY, Clarksville IN, Lexington KY, Cincinnati OH, Indianapolis IN, Evansville IN, Bowling Green KY, Owensboro KY, Paducah KY

**Industry-Specific Terms:**
- "DOT inspection station"
- "PM service truck shop"
- "DPF cleaning service"
- "truck diagnostic repair"
- "fleet maintenance contract"
- "24/7 roadside repair"
- "mobile truck service"

**Search Modifiers:**
- "near me"
- "open now"
- "24 hour"
- "emergency"
- "[brand] authorized"
- "certified technicians"

---

## 4. GAP ANALYSIS – Underrepresented Reseller Types

### Critical Gaps (40217 + 250-Mile Radius)

#### **GAP #1: Trailer Parts Suppliers (Severely Underrepresented)**

**Current Database:**
- Only **69 trailer parts suppliers** in entire 7-state region
- Only **5 in Kentucky**
- This is FAR below expected density

**Expected Density:**
- Should be 200-300 trailer parts suppliers in region (1 per 25-30 trailer shops)
- Ratio is currently 1:8 (69 parts suppliers for 548 trailer shops)

**Competitive White Space:**
- **Target:** 150-200 additional trailer parts suppliers NOT in database
- **Source Recommendations:** 
  - Yellow Pages: "trailer parts", "trailer supply", "truck trailer accessories"
  - Industry directories: NTEA (National Truck Equipment Association), TRALA (Truck Renting and Leasing Association)
  - LinkedIn company searches: "trailer parts", "trailer supply"

---

#### **GAP #2: OEM Dealers (Underrepresented Brands)**

**Current Database:**
- **Cummins:** 179 (well-represented)
- **Caterpillar:** 123 (good)
- **Freightliner:** 23 (**LOW**)
- **International:** 6 (**VERY LOW**)
- **Volvo:** 1 (**CRITICAL GAP**)
- **Kenworth:** 3 (**CRITICAL GAP**)
- **Peterbilt:** 0 (**MISSING**)

**Expected Dealer Counts (7-State Region):**
- Freightliner: 80-100 dealers (currently have 23) → **60-80 missing**
- International: 40-60 dealers (currently have 6) → **35-55 missing**
- Volvo: 30-50 dealers (currently have 1) → **30-50 missing**
- Kenworth: 25-40 dealers (currently have 3) → **22-37 missing**
- Peterbilt: 20-35 dealers (currently have 0) → **20-35 missing**

**Competitive White Space:**
- **Total missing OEM dealers:** 170-260 locations
- **Source Recommendations:**
  - OEM dealer locators: Freightliner.com, InternationalTrucks.com, Volvo.com, Kenworth.com, Peterbilt.com
  - Industry publications: Heavy Duty Trucking, Commercial Carrier Journal dealer directories
  - LinkedIn searches: "[brand] dealer", "[brand] service center"

---

#### **GAP #3: Specialty Service Categories**

**Current vs. Expected:**

| Service Type | Current | Expected | Gap |
|---|---|---|---|
| **Engine Parts Suppliers** | 275 | 400-500 | 125-225 missing |
| **Truck Accessories** | 42 | 150-200 | 110-160 missing |
| **Mobile Service Providers** | ~200 | 400-500 | 200-300 missing |
| **APU Service Centers** | Not tracked | 50-100 | 50-100 missing |
| **Lift Gate Repair** | Not tracked | 75-125 | 75-125 missing |
| **Truck Wash/Detailing** | 608 tractor wash, 123 trailer wash | 800-1,000 | 70-270 missing |

---

#### **GAP #4: Geographic Coverage Gaps**

**Underrepresented Cities/Regions (Kentucky):**

Based on population and trucking activity, these markets should have MORE representation:

| City/Region | Current Count | Expected Count | Gap |
|---|---|---|---|
| **Louisville Metro** | ~40-50* | 150-200 | 100-150 missing |
| **Lexington** | ~30-40* | 80-100 | 50-70 missing |
| **Bowling Green** | Low | 40-60 | 30-50 missing |
| **Owensboro** | Low | 30-50 | 20-40 missing |
| **Paducah** | Low | 25-40 | 15-30 missing |

*Note: Many KY records have incorrect city assignments (e.g., everything listed as "La Grange"), making exact counts unreliable. Recommend re-scraping with verified addresses.

**Indiana (Adjacent to Louisville):**
- **Jeffersonville/Clarksville/New Albany** (Louisville metro): Should have 50-75, likely have 20-30 → **30-50 missing**

---

### What Service Types Are Missing Entirely?

**Not Currently Tracked (Should Add):**
1. **APU (Auxiliary Power Unit) Service** - 50-100 locations regionally
2. **Lift Gate Repair Specialists** - 75-125 locations regionally
3. **Truck Upfitting/Body Shops** - 100-150 locations regionally
4. **Truck Scales (Non-Truck Stop)** - 50-75 locations regionally
5. **Truck Wash (Standalone)** - Partial coverage (608 tractor, 123 trailer) but likely missing 100-200
6. **DOT Inspection-Only Facilities** - 50-100 locations regionally
7. **Mobile Tire Service** - Partial coverage (likely missing 50-100)
8. **Truck Alignment Specialists** - Not tracked separately (50-100 locations)

---

### Competitive White Space Summary

**Total Estimated Missing Companies in 7-State Region:**
- **Trailer Parts Suppliers:** 150-200
- **OEM Dealers (Freightliner, International, Volvo, Kenworth, Peterbilt):** 170-260
- **Engine Parts Suppliers:** 125-225
- **Truck Accessories:** 110-160
- **Mobile Service Providers:** 200-300
- **Specialty Service Categories:** 250-400
- **Geographic Gaps (Louisville/Lexington metros):** 200-300

**TOTAL POTENTIAL NEW COMPANIES TO FIND:** **1,200 - 1,800**

**Current Database:** 7,227 companies in 7-state region  
**Total Market Size (Estimated):** 8,400 - 9,000 companies  
**Coverage Rate:** ~80% (good, but significant gaps remain)

---

## 5. SCRAPING RECOMMENDATIONS

### Best Data Sources (Ranked by Quality & Yield)

#### **TIER 1: Highest Quality, Best ROI**

**1. Google Places API**
- **Why:** Most current, best contact data, user reviews provide validation
- **Estimated New Companies:** 400-600
- **Keywords to Use:** See Section 3 (all 30+ keywords)
- **Geographic Strategy:** 
  - Start with Louisville metro (40217 zip + 50-mile radius)
  - Expand to 100-mile, 150-mile, 200-mile, 250-mile radius incrementally
- **Enrichment Priority:** HIGH - phone, address, website, hours, reviews
- **Deduplication Strategy:** Match on phone number first (most reliable), then normalized name + city

**2. OEM Dealer Locators (Manufacturer Websites)**
- **Why:** 100% accurate for authorized dealers, includes service capabilities
- **Estimated New Companies:** 170-260 (mostly OEM dealers)
- **Sources:**
  - Freightliner.com → Dealer Locator
  - InternationalTrucks.com → Find a Dealer
  - Volvo.com/trucks → Service & Parts Locator
  - Kenworth.com → Dealer Locator
  - Peterbilt.com → Find a Dealer
  - Cummins.com → QuickServe Locator
  - MackTrucks.com → Dealer Locator
- **Enrichment Priority:** MEDIUM - you'll get name, address, phone, services; may need to enrich contact names
- **Deduplication:** Match on dealer name + city (OEM dealers rarely share names)

**3. Yelp Business Search**
- **Why:** Good for finding independents, user reviews validate legitimacy
- **Estimated New Companies:** 200-300
- **Keywords:** Same as Google Places
- **Enrichment Priority:** HIGH - similar to Google Places
- **Deduplication:** Phone number + normalized name

---

#### **TIER 2: Good Quality, Moderate Effort**

**4. Yellow Pages (YP.com, Yellowpages.com)**
- **Why:** Still surprisingly comprehensive for truck services
- **Estimated New Companies:** 150-250
- **Keywords:** 
  - "Truck Repair"
  - "Trailer Repair"
  - "Diesel Repair"
  - "Truck Parts"
  - "Towing"
  - "Tire Service"
- **Enrichment Priority:** MEDIUM - data is often stale, prioritize phone verification
- **Deduplication:** Phone + name (expect 30-40% duplicates with existing database)

**5. Better Business Bureau (BBB.org)**
- **Why:** Good for finding established businesses, accreditation = quality signal
- **Estimated New Companies:** 100-150
- **Search Categories:**
  - "Truck Repair"
  - "Diesel Engines - Service & Repair"
  - "Trailer Repair"
  - "Truck Parts & Accessories"
- **Enrichment Priority:** LOW - BBB provides basic data, use for validation
- **Deduplication:** Business name + city

**6. Industry Association Directories**
- **Why:** Members are typically serious operators, not fly-by-night
- **Estimated New Companies:** 150-250
- **Sources:**
  - **NTEA (National Truck Equipment Association)** - Member Directory
  - **TRALA (Truck Renting and Leasing Association)** - Supplier Directory
  - **TMC (Technology & Maintenance Council / ATA)** - Member List
  - **State Trucking Associations:**
    - Kentucky Trucking Association
    - Indiana Motor Truck Association
    - Ohio Trucking Association
    - Tennessee Trucking Association
  - **MACS (Mobile Air Climate Systems Association)** - for A/C specialists
  - **ATRA (Automatic Transmission Rebuilders Association)** - for transmission shops
- **Enrichment Priority:** HIGH - association directories often lack full contact data
- **Deduplication:** Company name + state (association members less likely to duplicate)

---

#### **TIER 3: Lower Yield, Niche Coverage**

**7. LinkedIn Company Search**
- **Why:** Good for finding newer companies, executive contact info
- **Estimated New Companies:** 100-200
- **Search Terms:**
  - "truck repair" + location
  - "diesel service" + location
  - "trailer repair" + location
  - "mobile truck repair" + location
- **Enrichment Priority:** HIGH - LinkedIn gives you decision-maker names/titles (GOLD for B2B)
- **Deduplication:** Company name + LinkedIn URL

**8. Trucking Industry Publications - Advertiser Lists**
- **Why:** Advertisers = companies with marketing budgets = good prospects
- **Sources:**
  - **Heavy Duty Trucking Magazine** - advertiser index
  - **Commercial Carrier Journal** - supplier directory
  - **Fleet Owner Magazine** - supplier guide
  - **Overdrive Magazine** - service directory
- **Estimated New Companies:** 50-100
- **Enrichment Priority:** MEDIUM
- **Deduplication:** Company name + website

**9. State Business License Databases**
- **Why:** Comprehensive but raw data (lots of noise)
- **Sources:**
  - Kentucky Secretary of State - Business Entity Search
  - Indiana Secretary of State - Business Search
  - Ohio Secretary of State - Business Search
- **Estimated New Companies:** 200-400 (but HIGH false positive rate)
- **NAICS Codes to Filter:**
  - 811111, 811198, 423120, 441228, 488410, 441320
- **Enrichment Priority:** VERY HIGH - state databases give you name + address only
- **Deduplication:** Normalized name + address (expect LOTS of duplicates)

---

### Scraping Strategy & Workflow

#### **Phase 1: Fill Critical Gaps (Weeks 1-2)**
**Priority:** OEM Dealers & Trailer Parts Suppliers

1. **Scrape OEM dealer locators** (Freightliner, International, Volvo, Kenworth, Peterbilt)
   - Estimated yield: 170-260 companies
   - Dedupe against existing database on name + city
   - Enrich with phone verification

2. **Google Places: "trailer parts" + "trailer supply"** (Louisville + 250-mile radius)
   - Estimated yield: 100-150 companies
   - Dedupe on phone number
   - Prioritize companies with websites + good reviews

3. **Industry associations: NTEA member directory**
   - Estimated yield: 50-100 trailer equipment companies
   - Enrich with LinkedIn for contact names

**Outcome:** 320-510 new companies, focused on highest-gap areas

---

#### **Phase 2: Broaden Coverage (Weeks 3-4)**
**Priority:** Independent Shops & Multi-Location Chains

1. **Google Places: All truck/trailer repair keywords** (see Section 3)
   - Run 30+ keyword searches across Louisville + 250-mile radius
   - Estimated yield: 400-600 companies
   - Dedupe on phone + normalized name

2. **Yelp scraping** (same keywords as Google)
   - Estimated yield: 150-250 (after deduping against Google results)
   - Prioritize shops with 4+ star reviews and 10+ reviews

3. **Yellow Pages scraping** (top 10 service categories)
   - Estimated yield: 100-200 (after deduping)
   - Phone verification CRITICAL (YP data goes stale fast)

**Outcome:** 650-1,050 new companies

---

#### **Phase 3: Long-Tail & Specialty (Weeks 5-6)**
**Priority:** Niche Service Types & Geographic Gaps

1. **LinkedIn company search** (find newer/unlisted companies)
   - Focus on "mobile truck repair", "fleet service", newer businesses
   - Estimated yield: 100-200
   - BONUS: Extract decision-maker names/titles for direct outreach

2. **Industry publication directories** (HDT, CCJ, Fleet Owner)
   - Estimated yield: 50-100
   - Cross-reference against existing database

3. **BBB + state license databases** (fill remaining gaps)
   - Estimated yield: 150-250
   - HIGH noise rate - prioritize phone verification

**Outcome:** 300-550 new companies

---

### Total Estimated New Companies: **1,270 - 2,110**

**Realistic Target (80% success rate):** **1,000 - 1,700 new companies**

---

### Enrichment Priorities (After Scraping)

**Immediate Enrichment (Do This First):**
1. **Phone verification** - Call or use phone validation API (remove disconnected numbers)
2. **Website extraction** - Scrape websites for:
   - Services offered (to assign service_type)
   - Brands carried (to infer OEM relationships)
   - Multiple location addresses (to identify chains)
   - Contact names/titles (for direct outreach)

**Secondary Enrichment (Do This After Phone Verification):**
3. **Facility analysis** - Use Google Street View API or manual review to assess:
   - Number of service bays (indicator of shop size)
   - Lot size/equipment (identifies large vs. small operators)
   - Signage (identifies brand affiliations)

4. **Brand inference** - Look for OEM logos, certifications, partnerships on websites/photos

**Tertiary Enrichment (Nice to Have):**
5. **Decision-maker names** - LinkedIn scraping, website "About Us" pages
6. **Email addresses** - Hunter.io, Voila Norbert, manual website scraping
7. **Social media** - Facebook business pages (often have contact info + customer reviews)

---

### Deduplication Strategy (CRITICAL)

**Hierarchy of Match Rules (Apply in Order):**

1. **Phone number match** (primary_phone = primary_phone)
   - **If match:** Likely duplicate (95% confidence)
   - **Action:** Keep newer record OR record with more complete data
   - **Exception:** If company_name is VERY different (e.g., "Joe's Truck Shop" vs. "Freightliner of Louisville"), flag for manual review (could be acquisition/name change)

2. **Normalized name + city + state** (all must match)
   - **Normalization rules:**
     - Remove legal suffixes: LLC, Inc, Corp, Co, Ltd
     - Remove punctuation: commas, periods, apostrophes
     - Lowercase everything
     - Remove common words: "the", "and", "&"
     - Example: "Bob's Truck & Trailer Repair, LLC" → "bobs truck trailer repair"
   - **If match:** Likely duplicate (85% confidence)
   - **Action:** Merge records, keep most complete data

3. **Fuzzy name match + address match**
   - **Use Levenshtein distance or Jaro-Winkler similarity**
   - **Threshold:** 85%+ similarity on name + exact match on street address
   - **Example:** "Louisville Truck Service" vs. "Louisville Truck Services" = likely duplicate
   - **If match:** Flag for manual review (70% confidence)
   - **Action:** Human review before merging

4. **Website match** (if both records have websites)
   - **If website URLs match:** Duplicate (90% confidence)
   - **Action:** Merge records

**Edge Cases to Handle:**
- **Multi-location chains with same phone number:** NOT duplicates - keep all records, link them with a `corporate_phone` field
- **Franchises/dealers with same name, different cities:** NOT duplicates (e.g., "Best One Tire & Service" in 20 cities)
- **Acquisitions/name changes:** Manual review required (check company_detail_url for business history)

**Recommended Tool:** 
- **Python:** `pandas` + `fuzzywuzzy` + `phonenumbers` library
- **SQL:** Use `SOUNDEX()` or `DIFFERENCE()` for fuzzy name matching

---

### Data Quality Checklist (Before Adding to Database)

For each new company record, validate:

- ✅ **Phone number:** Valid format, not disconnected
- ✅ **Address:** Complete (street, city, state, zip)
- ✅ **Service type:** Assigned to at least one category
- ✅ **Dedupe check:** No match on phone, name+city, or website
- ✅ **Legitimacy:** Website exists OR Yelp/Google reviews exist OR listed in industry directory

**Reject records if:**
- ❌ Phone number is disconnected or invalid
- ❌ Address is PO Box only (need physical location)
- ❌ Obvious duplicate (matches existing record on multiple fields)
- ❌ No online presence AND not in any directory (likely out of business)

---

## FINAL RECOMMENDATIONS

### Immediate Actions (Next 30 Days)

1. **Fix Louisville Area Data Quality**
   - Re-scrape Louisville metro area (40217 + 50 miles) using Google Places
   - Verify city assignments (many KY records have incorrect "La Grange" city)
   - Target: 100-150 correctly-categorized Louisville area companies

2. **Fill Critical Gaps**
   - Scrape OEM dealer locators (Freightliner, International, Volvo, Kenworth, Peterbilt)
   - Scrape "trailer parts" + "trailer supply" (Google Places + Yellow Pages)
   - Target: 250-350 new companies in high-priority categories

3. **Enrich Existing Database**
   - Phone verification for all 7,227 existing companies (expect 5-10% disconnected)
   - Website extraction (currently missing for ~60% of records)
   - Service type validation (all KY records have blank input_service_type)

4. **Create Target Lists for Sales Team**
   - Export top 200-300 multi-location operators (5+ locations) with decision-maker titles
   - Export top 150-200 OEM dealers (parts managers are buyers)
   - Export top 100-150 reefer specialists (highest urgency = best prospects)

### Long-Term Strategy (60-90 Days)

5. **Ongoing Scraping Pipeline**
   - Set up monthly Google Places scraping for new businesses
   - Monitor OEM dealer network changes (new locations, closures)
   - Track company acquisitions (consolidation is accelerating in this industry)

6. **Facility Analysis Project**
   - Use Google Street View API to assess shop size (bay count, lot size)
   - Categorize companies as Small (1-3 bays), Medium (4-8 bays), Large (9+ bays)
   - Prioritize sales outreach to Medium/Large shops (higher volume potential)

7. **Brand Inference System**
   - Scrape websites for OEM logos, brand mentions, certifications
   - Build brand affiliation database (which shops service which OEM brands)
   - Enables targeted marketing: "We supply Cummins aftermarket parts" to Cummins dealers

---

## APPENDIX: Data Sources & Tools

### Data Sources
- **Google Places API:** https://developers.google.com/maps/documentation/places/web-service
- **Yelp Fusion API:** https://www.yelp.com/developers/documentation/v3
- **Yellow Pages:** YP.com, Yellowpages.com (web scraping)
- **OEM Dealer Locators:** See Tier 1 recommendations
- **Industry Associations:** NTEA, TRALA, TMC, state trucking associations
- **BBB:** BBB.org business search
- **State Business Licenses:** Kentucky SOS, Indiana SOS, Ohio SOS

### Tools & Technologies
- **Scraping:** Python (BeautifulSoup, Scrapy, Selenium), Octoparse, ParseHub
- **Deduplication:** Python (fuzzywuzzy, phonenumbers, pandas)
- **Phone Verification:** Twilio Lookup API, Numverify, AbstractAPI
- **Email Enrichment:** Hunter.io, Voila Norbert, Clearbit
- **Facility Analysis:** Google Street View API, manual review
- **LinkedIn Scraping:** PhantomBuster, LinkedIn Sales Navigator

---

## CONCLUSION

This analysis reveals a **well-established but incomplete database** with significant opportunities in Louisville and the broader 250-mile radius market. The 7 buyer personas represent **distinct decision-making profiles** that require **differentiated messaging and channel strategies**.

**Key Takeaways:**
1. **Multi-location operators dominate** (47.3%) - prioritize relationship-building with regional/corporate buyers
2. **Trailer parts suppliers are severely underrepresented** - white space opportunity for aggressive prospecting
3. **OEM dealers need aftermarket alternatives** - quality + margin story will resonate
4. **Reefer specialists operate on urgency** - emergency availability is the primary decision criterion
5. **Independent shops value personal relationships** - local sales rep visits + fair pricing wins

**Estimated Total Addressable Market:**
- **Current database:** 7,227 companies in 7-state region
- **Estimated total market:** 8,400-9,000 companies
- **Coverage rate:** ~80%
- **Potential new companies:** 1,200-1,800

**Scraping ROI:** Investing in comprehensive Google Places + OEM dealer scraping should yield **1,000-1,700 new qualified prospects** with **170-260 being high-value OEM dealers**.

**Next Steps:** Prioritize Louisville metro data quality fixes, fill trailer parts gap, and build enrichment pipeline for decision-maker contact information.

---

*End of Report*
