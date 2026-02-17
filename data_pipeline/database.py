from sqlalchemy import create_engine, Column, String, Float, Integer, ARRAY, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import Config
from datetime import datetime

Base = declarative_base()
engine = create_engine(Config.DATABASE_URL)
Session = sessionmaker(bind=engine)

class Reseller(Base):
    __tablename__ = 'resellers'
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    address = Column(String)
    city = Column(String)
    state = Column(String)
    zip_code = Column(String)
    phone = Column(String)
    website = Column(String)
    google_place_id = Column(String)
    business_types = Column(ARRAY(String))
    brands_carried = Column(ARRAY(String))
    google_rating = Column(Float)
    review_count = Column(Integer)
    naics_codes = Column(ARRAY(String))
    latitude = Column(Float)
    longitude = Column(Float)
    last_verified = Column(DateTime, default=datetime.utcnow)

def init_db():
    Base.metadata.create_all(engine)
    print("Database tables created successfully.")