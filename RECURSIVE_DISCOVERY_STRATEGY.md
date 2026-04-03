# Recursive Reseller Discovery Strategy
**Target:** 100-mile radius from Louisville, KY 40217  
**Mission:** Find EVERY business touching Class 6-8 commercial vehicle parts/service supply chain

---

## Core Philosophy

**Treat every result as a clue to generate MORE searches.**

- Start with seed keywords
- Extract new terms from every result (business names, reviews, websites, descriptions)
- Generate 2nd-order searches from findings
- Generate 3rd-order searches from 2nd-order results
- Never stop expanding until exhaustion

---

## Tier 1: Seed Keywords (Starting Point)

### Primary Search Terms (Already Used)
```
truck parts
semi truck repair
commercial truck dealer
heavy duty parts
diesel repair
trailer repair
truck service
fleet maintenance
OEM truck dealer
```

### Expanded Primary Terms (Add These)
```
Class 6 truck parts
Class 7 truck parts
Class 8 truck parts
vocational truck parts
municipal truck parts
commercial vehicle parts
heavy equipment parts
diesel engine parts
truck component distributor
truck parts warehouse
truck parts supplier
commercial parts broker
fleet parts distributor
```

---

## Tier 2: Supply Chain Functions (Verb-Based)

### Selling & Distribution
```
truck parts reseller
truck parts distributor
truck parts wholesaler
truck parts retailer
truck component supplier
fleet parts supplier
diesel parts vendor
commercial vehicle parts sales
truck aftermarket supplier
parts depot
```

### Warehousing & Logistics
```
truck parts warehouse
parts distribution center
truck component warehouse
fleet parts inventory
parts fulfillment center
truck parts stocking distributor
```

### Rebuilding & Remanufacturing
```
truck parts remanufacturer
diesel engine rebuilder
transmission rebuilder
turbocharger rebuilder
alternator rebuilder
starter rebuilder
fuel pump rebuilder
brake rebuilder
clutch rebuilder
axle rebuilder
differential rebuilder
hydraulic pump rebuilder
```

### Machining & Fabrication
```
truck parts machining
diesel engine machine shop
cylinder head rebuilder
crankshaft grinding
engine block repair
flywheel resurfacing
brake drum turning
rotor machining
```

### Refurbishing & Reconditioning
```
truck parts refurbisher
diesel parts reconditioning
core exchange
remanufactured truck parts
refurbished diesel engines
rebuilt transmissions
```

---

## Tier 3: Component & System Categories

### Engine Systems
```
diesel engine parts
engine rebuild kits
piston rings
cylinder heads
crankshafts
camshafts
fuel injectors
turbochargers
oil pumps
water pumps
radiators
intercoolers
EGR systems
DPF filters
DEF systems
```

### Drivetrain
```
transmission parts
clutch assemblies
driveshafts
u-joints
axle parts
differential parts
carrier assemblies
ring and pinion
hub assemblies
wheel bearings
```

### Braking Systems
```
brake drums
brake shoes
brake chambers
slack adjusters
air brake parts
hydraulic brake parts
brake calipers
brake rotors
brake pads
ABS components
```

### Electrical
```
truck electrical parts
alternators
starters
batteries
wiring harnesses
sensors
ECM modules
lighting systems
```

### Suspension & Steering
```
truck suspension parts
leaf springs
air springs
shock absorbers
king pins
tie rod ends
steering gears
```

### Body & Cab
```
truck body parts
cab parts
bumpers
grilles
fenders
mirrors
doors
hoods
```

---

## Tier 4: Brand-Specific Searches

### OEM Dealers & Service Centers
```
Freightliner parts Louisville
Peterbilt parts Louisville
Kenworth parts Louisville
International parts Louisville
Volvo truck parts Louisville
Mack parts Louisville
Western Star parts Louisville
Hino parts Louisville
Isuzu parts Louisville
```

### Engine Manufacturers
```
Cummins parts distributor
Detroit Diesel parts
Caterpillar diesel parts
Paccar parts
Navistar parts
Mercedes diesel parts
Volvo diesel parts
```

### Component Brands
```
Eaton transmission parts
Meritor parts distributor
Dana axle parts
Bendix brake parts
Wabco parts
Haldex parts
ZF parts
Allison transmission parts
```

---

## Tier 5: Service & Specialty Terms

### Repair & Service
```
diesel truck repair
heavy truck service
fleet repair
mobile truck repair
roadside truck service
DOT inspection station
truck diagnostic service
DPF cleaning service
diesel performance shop
```

### Installation & Support
```
truck parts installation
fleet maintenance service
preventive maintenance
PM service
truck upfitting
trailer upfitting
liftgate installer
```

### Inspection & Certification
```
DOT inspection
annual vehicle inspection
brake inspection
emissions testing
diesel emissions testing
commercial vehicle inspection
```

---

## Tier 6: Adjacent & Hidden Categories

### Mislabeled Businesses
```
automotive parts (may serve commercial)
industrial supply
equipment parts
machinery parts
construction equipment parts
farm equipment parts (crossover inventory)
marine diesel parts (crossover inventory)
```

### Industry-Specific
```
waste hauler parts
refuse truck parts
dump truck parts
tanker truck parts
wrecker parts
tow truck parts
delivery truck parts
box truck parts
```

### Municipal & Vocational
```
municipal fleet parts
fire truck parts
ambulance parts
utility truck parts
bucket truck parts
crane truck parts
snowplow parts
street sweeper parts
```

---

## Tier 7: Second-Order Expansion (From Results)

### When You Find a Business:

**Extract from business name:**
- Parent company name → search for other locations
- Brand mentions → search "[Brand] parts Louisville"
- Service mentions → search for that service type

**Extract from business description:**
- Every product mentioned → new search
- Every service mentioned → new search
- Every brand mentioned → new search

**Extract from reviews:**
- "They have great [X]" → search for [X]
- "Best place for [Y]" → search for [Y]
- "Only place that had [Z]" → search for [Z]

**Extract from website:**
- Product categories → each becomes a search
- Brands listed → each becomes a search
- Services offered → each becomes a search
- "Related products" links → follow and search

---

## Tier 8: Third-Order Expansion (From 2nd-Order)

### Network Effects

**Dealer networks:**
- Find one dealer → search for entire network
- Example: "TLG Peterbilt" → search "TLG Trucks locations Kentucky"

**Franchise/Chain discovery:**
- "FleetPride" → search "FleetPride locations 100 miles Louisville"
- "4 State Trucks" → search all branches
- "TruckPro" → map all locations

**Supplier relationships:**
- Business mentions "we use [Supplier X]" → search for [Supplier X]
- "Authorized dealer for [Brand Y]" → search all authorized dealers

**Cross-references:**
- Company A mentions Company B → search Company B
- Review mentions "cheaper than [Company C]" → search Company C

---

## Search Execution Strategy

### Phase 1: Broad Net (Days 1-2)
Run all Tier 1-3 searches:
- 200+ unique search terms
- Google Places API radius search
- 100-mile radius
- Dedupe by place_id

### Phase 2: Deep Dive (Days 3-5)
For every business found in Phase 1:
1. Visit website → extract all product/service terms → search each
2. Read reviews → extract mentioned parts/services → search each
3. Check "Related businesses" → search each
4. Look for branch networks → search all locations

### Phase 3: Lateral Expansion (Days 6-10)
For every new term discovered in Phase 2:
1. Create search variations
2. Run new searches
3. Repeat extraction process
4. Keep expanding until no new results

### Phase 4: Validation & Enrichment (Days 11-14)
For all discovered businesses:
1. Website scraping (if not done)
2. Satellite imagery analysis
3. Confidence scoring
4. Final classification

---

## Search Term Generation Patterns

### Pattern: Component + Action
```
[component] + rebuilder
[component] + remanufacturer
[component] + refurbisher
[component] + repair
[component] + supplier
[component] + distributor
```

Example:
- turbocharger rebuilder
- fuel injector remanufacturer
- transmission refurbisher

### Pattern: Vehicle Type + Parts
```
[vehicle type] + parts
[vehicle type] + components
[vehicle type] + accessories
```

Example:
- dump truck parts
- refuse truck components
- tanker accessories

### Pattern: Brand + Service
```
[brand] + authorized dealer
[brand] + parts distributor
[brand] + service center
[brand] + repair specialist
```

### Pattern: Service + Location
```
mobile [service] Louisville
fleet [service] Kentucky
on-site [service] Jefferson County
```

---

## Hidden Category Discovery

### Look for businesses NOT labeled as "truck parts" but that serve the market:

**Industrial Supply Houses:**
- May stock bearings, seals, hydraulics
- Search: "industrial supply Louisville"
- Filter: check inventory for truck-compatible items

**Equipment Rental:**
- May have parts counter
- Search: "equipment rental Louisville"
- Filter: check if they sell parts

**Scrap & Salvage:**
- Used parts sources
- Search: "truck salvage yard Louisville"
- Include: "auto salvage" (many serve commercial)

**Welding & Fabrication:**
- Custom part fabrication
- Search: "metal fabrication Louisville truck"

**Hydraulic Shops:**
- Hydraulic hoses, pumps, cylinders
- Search: "hydraulic repair Louisville"

---

## Recursive Query Examples

### Starting Point:
Search: "Freightliner parts Louisville"

### First-Order Results:
- TLG Peterbilt (wait, not Freightliner!)
- Wiers Fleet Service
- Rush Truck Centers

### Second-Order Searches (generated from results):
- "TLG Peterbilt locations Kentucky" → find all branches
- "Wiers Fleet Service brands" → discover they service multiple OEMs
- "Rush Truck Centers" → search entire network
- "Peterbilt parts Louisville" → new search from TLG finding
- Each result website → extract brands → search each brand

### Third-Order Searches:
- From Rush website: "Hino trucks" mentioned → search "Hino parts Louisville"
- From review: "They fixed our Isuzu" → search "Isuzu repair Louisville"
- Related business: "Velocity Truck Centers" → search them
- Website mentions: "Cummins certified" → search "Cummins service Louisville"

### Keep Going:
- Every new business → extract terms → search
- Every new term → generate variations → search
- Never stop until exhausted

---

## Database Fields to Track Discovery

```sql
CREATE TABLE discovery_searches (
  search_id INTEGER PRIMARY KEY,
  search_term TEXT NOT NULL,
  search_date TIMESTAMP,
  tier INTEGER,  -- 1=seed, 2=2nd-order, 3=3rd-order
  parent_search_id INTEGER,  -- which search generated this one
  results_count INTEGER,
  new_results_count INTEGER,  -- after deduplication
  status TEXT  -- pending, complete, exhausted
);

CREATE TABLE discovery_sources (
  source_id INTEGER PRIMARY KEY,
  place_id TEXT,
  discovered_by_search_id INTEGER,
  discovered_date TIMESTAMP,
  discovery_method TEXT  -- search, website_extraction, review_extraction, network_expansion
);
```

---

## Success Metrics

**Coverage:**
- Total unique businesses found
- % increase per discovery iteration
- Exhaustion point (when new searches yield <5% new results)

**Depth:**
- Average searches per business (should be 3-5)
- Network expansions followed
- Website terms extracted and searched

**Quality:**
- % with visual analysis
- % with website analysis
- % with confidence scores >70

---

## Automation Script Structure

```python
def recursive_discovery():
    # Phase 1: Seed searches
    seed_terms = load_tier_1_terms()
    run_searches(seed_terms, tier=1)
    
    # Phase 2: Extract from results
    while True:
        new_terms = extract_terms_from_results()
        if len(new_terms) < threshold:
            break
        
        run_searches(new_terms, tier=current_tier+1)
        deduplicate_results()
    
    # Phase 3: Network expansion
    for business in all_businesses:
        follow_network(business)
        extract_from_website(business)
        extract_from_reviews(business)
    
    # Phase 4: Validate
    score_all_businesses()
    visual_analysis_all()
```

---

## Expected Outcomes

**Starting Point:**
- ~680 businesses (from original 50-mile search)

**After Tier 1-3 Expansion:**
- ~2,000-3,000 businesses (100-mile radius + expanded terms)

**After Second-Order Expansion:**
- ~4,000-6,000 businesses (following networks, extracting from websites)

**After Third-Order Expansion:**
- ~8,000-12,000 businesses (exhaustive coverage, hidden categories, mislabeled)

**Final After Dedup & Validation:**
- ~5,000-8,000 legitimate resellers in 100-mile radius

---

## Next Steps

1. **Build search term database** (500+ unique terms from this doc)
2. **Create recursive search script** (Google Places API automation)
3. **Set up term extraction pipeline** (website scraping + NLP)
4. **Run discovery in phases** (track what's searched vs. found)
5. **Deduplicate continuously** (by place_id, address, phone)
6. **Visual analysis on all** (satellite imagery + AI)
7. **Final validation** (confidence scoring, manual review of edge cases)

---

**This is not a one-time search. This is a recursive intelligence operation.** 🎯
