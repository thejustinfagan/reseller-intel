# Reseller Intel - Product Specification

## 1. Product Vision
A comprehensive database and intelligence platform for truck parts resellers, designed to support Autocar Parts LLC's sales team in identifying, analyzing, and targeting potential business partners.

## 2. Business Objectives
- Provide detailed insights into truck parts resellers nationwide
- Support sales team's lead generation and market mapping
- Create a data-driven platform for understanding market landscape
- Enable precise matching of resellers to specific vehicle/part needs

## 3. Data Sources & Acquisition Strategy

### 3.1 Primary Data Sources
1. **Google Places API**
   - Search queries:
     * "truck dealership"
     * "Kenworth dealer"
     * "Freightliner dealer"
     * "Peterbilt dealer"
     * "Mack dealer"
     * "Volvo trucks dealer"
     * "Cummins dealer"
     * "Caterpillar dealer"
     * "Heavy duty truck parts"
     * "Aftermarket truck parts"

2. **FMCSA Census Data**
   - Filter for:
     * Brokers
     * Dealers
     * Non-fleet commercial entities

3. **Existing FindTruckService Scrape**
   - Historical data cleanup and integration
   - Deduplication against new sources

4. **NAICS Codes Targeting**
   - 423120: Motor Vehicle Supplies
   - 441228: Vehicle Dealers
   - 811198: Auto Repair Services

### 3.2 Data Enrichment Strategies
- AI-powered website analysis
- Review/rating aggregation
- Geocoding and precise location mapping
- Brand/inventory inference

## 4. Technical Architecture

### 4.1 Database Schema
```sql
CREATE TABLE resellers (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    phone VARCHAR(20),
    website URL,
    google_place_id TEXT,
    business_type TEXT[], -- dealer, parts, repair
    brands_carried TEXT[],
    google_rating DECIMAL(3,2),
    review_count INTEGER,
    naics_codes TEXT[],
    lat DECIMAL(10,7),
    lon DECIMAL(10,7),
    last_verified TIMESTAMP
);

CREATE TABLE vin_compatibility (
    reseller_id UUID,
    make TEXT,
    model TEXT,
    years INT[],
    PRIMARY KEY (reseller_id, make, model)
);
```

### 4.2 Data Pipeline
1. Google Places API Crawler
   - State-by-state search
   - Rate limit management
   - Deduplication logic
   - Error handling and retry

2. Enrichment Microservice
   - Website scraping
   - AI analysis of business details
   - Brand/inventory inference

3. VIN Compatibility Mapping
   - Decode VIN databases
   - Match reseller inventory potential

### 4.3 Tech Stack (Forked from Fleet Intel)
- Next.js
- Tailwind CSS
- PostgreSQL
- SQLAlchemy
- Railway for deployment

## 5. Features & UI

### 5.1 Search & Filters
- Name search
- Geographic filters (state/region)
- Business type
- Brands carried
- Google rating
- VIN compatibility

### 5.2 Map View
- Clustered markers
- Detailed business popups
- Color-coding by business type

### 5.3 List View
- Sortable columns
- Export capabilities (CSV/JSON)

## 6. AI Enrichment Capabilities
- Extract brands from website text
- Infer business specialties
- Rate likelihood of being a good sales target
- Predict inventory based on location/reviews

## 7. Compliance & Ethics
- No unauthorized scraping
- Respect robots.txt
- Use only publicly available data
- Provide opt-out mechanism

## 8. Future Roadmap
- Integrate with Fleet Intel
- Add paid data source subscriptions
- Build predictive sales scoring model
- Create territory overlap visualizations

## 9. Success Metrics
- Total unique resellers mapped
- Geographic coverage percentage
- Sales team lead conversion rate
- Data accuracy validation

## 10. MVP Milestones
1. Data ingestion pipeline
2. Basic database setup
3. Initial Google Places crawler
4. Frontend map/list view
5. Basic search and filter
6. VIN compatibility prototype

## 11. Risks & Mitigations
- API rate limits → Implement exponential backoff
- Data staleness → Regular verification process
- Incomplete data → Multiple source cross-referencing