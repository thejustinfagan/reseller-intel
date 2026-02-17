import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY')
    DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://localhost/reseller_intel')
    
    SEARCH_QUERIES = [
        "truck dealership",
        "Kenworth dealer",
        "Freightliner dealer",
        "Peterbilt dealer",
        "Mack dealer",
        "Volvo trucks dealer",
        "Cummins dealer",
        "Caterpillar dealer",
        "Heavy duty truck parts",
        "Aftermarket truck parts"
    ]
    
    STATES = [
        "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", 
        "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
        # Add remaining states here
    ]