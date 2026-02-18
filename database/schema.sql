-- Reseller Intel Database Schema

-- Reseller Core Information
CREATE TABLE resellers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    legal_business_name TEXT,
    
    -- Contact Details
    primary_phone TEXT,
    secondary_phone TEXT,
    email TEXT,
    website URL,
    
    -- Geographical Information
    street_address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    county TEXT,
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    
    -- Business Classification
    business_type TEXT[], -- dealer, parts, service, distributor
    naics_codes TEXT[],
    years_in_business INTEGER,
    annual_revenue_range TEXT,
    
    -- Truck/Parts Specifics
    brands_represented TEXT[],
    primary_manufacturer_brands TEXT[],
    service_capabilities TEXT[],
    
    -- Data Quality & Sourcing
    original_source TEXT,
    source_confidence DECIMAL(3,2),
    last_verified TIMESTAMP,
    
    -- Sales Relevance for Autocar
    potential_customer BOOLEAN DEFAULT FALSE,
    territory_priority INTEGER,
    estimated_annual_parts_spend DECIMAL(12,2),
    
    -- Validation Metadata
    google_place_id TEXT,
    google_rating DECIMAL(3,2),
    google_review_count INTEGER,
    
    -- Tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- VIN/Vehicle Compatibility Mapping
CREATE TABLE vin_compatibility (
    reseller_id UUID REFERENCES resellers(id),
    make TEXT,
    model TEXT,
    years INT[],
    compatibility_score DECIMAL(3,2),
    PRIMARY KEY (reseller_id, make, model)
);

-- Contact Persons
CREATE TABLE contact_persons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reseller_id UUID REFERENCES resellers(id),
    first_name TEXT,
    last_name TEXT,
    title TEXT,
    direct_phone TEXT,
    email TEXT,
    linkedin_profile URL,
    primary_contact BOOLEAN DEFAULT FALSE
);

-- Data Verification Log
CREATE TABLE verification_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reseller_id UUID REFERENCES resellers(id),
    verification_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verification_source TEXT,
    verification_result TEXT,
    confidence_score DECIMAL(3,2)
);

-- Indexes for Performance
CREATE INDEX idx_resellers_state ON resellers(state);
CREATE INDEX idx_resellers_business_type ON resellers(business_type);
CREATE INDEX idx_resellers_brands ON resellers(primary_manufacturer_brands);
CREATE INDEX idx_resellers_territory_priority ON resellers(territory_priority);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reseller_modtime
    BEFORE UPDATE ON resellers
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();