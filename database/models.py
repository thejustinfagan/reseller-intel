import uuid
from sqlalchemy import Column, String, Float, Integer, ARRAY, DateTime, Boolean, Numeric, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Reseller(Base):
    __tablename__ = 'resellers'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    legal_business_name = Column(String)
    
    # Contact Details
    primary_phone = Column(String)
    secondary_phone = Column(String)
    email = Column(String)
    website = Column(String)
    
    # Geographical Information
    street_address = Column(String)
    city = Column(String)
    state = Column(String)
    zip_code = Column(String)
    county = Column(String)
    latitude = Column(Numeric(precision=10, scale=7))
    longitude = Column(Numeric(precision=10, scale=7))
    
    # Business Classification
    business_type = Column(ARRAY(String))
    naics_codes = Column(ARRAY(String))
    years_in_business = Column(Integer)
    annual_revenue_range = Column(String)
    
    # Truck/Parts Specifics
    brands_represented = Column(ARRAY(String))
    primary_manufacturer_brands = Column(ARRAY(String))
    service_capabilities = Column(ARRAY(String))
    
    # Data Quality
    original_source = Column(String)
    source_confidence = Column(Numeric(precision=3, scale=2))
    last_verified = Column(DateTime)
    
    # Sales Relevance
    potential_customer = Column(Boolean, default=False)
    territory_priority = Column(Integer)
    estimated_annual_parts_spend = Column(Numeric(precision=12, scale=2))
    
    # Validation Metadata
    google_place_id = Column(String)
    google_rating = Column(Numeric(precision=3, scale=2))
    google_review_count = Column(Integer)
    
    # Tracking
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    contacts = relationship("ContactPerson", back_populates="reseller")
    vin_compatibility = relationship("VINCompatibility", back_populates="reseller")
    verification_logs = relationship("VerificationLog", back_populates="reseller")

class ContactPerson(Base):
    __tablename__ = 'contact_persons'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reseller_id = Column(UUID(as_uuid=True), ForeignKey('resellers.id'))
    first_name = Column(String)
    last_name = Column(String)
    title = Column(String)
    direct_phone = Column(String)
    email = Column(String)
    linkedin_profile = Column(String)
    primary_contact = Column(Boolean, default=False)

    reseller = relationship("Reseller", back_populates="contacts")

class VINCompatibility(Base):
    __tablename__ = 'vin_compatibility'

    reseller_id = Column(UUID(as_uuid=True), ForeignKey('resellers.id'), primary_key=True)
    make = Column(String, primary_key=True)
    model = Column(String, primary_key=True)
    years = Column(ARRAY(Integer))
    compatibility_score = Column(Numeric(precision=3, scale=2))

    reseller = relationship("Reseller", back_populates="vin_compatibility")

class VerificationLog(Base):
    __tablename__ = 'verification_log'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reseller_id = Column(UUID(as_uuid=True), ForeignKey('resellers.id'))
    verification_date = Column(DateTime, default=datetime.utcnow)
    verification_source = Column(String)
    verification_result = Column(String)
    confidence_score = Column(Numeric(precision=3, scale=2))

    reseller = relationship("Reseller", back_populates="verification_logs")