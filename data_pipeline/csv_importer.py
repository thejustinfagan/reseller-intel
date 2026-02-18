import pandas as pd
import numpy as np
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import logging
import re
from database.models import Base, Reseller, ContactPerson
from config import Config

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s: %(message)s')

class ResellerImporter:
    def __init__(self, csv_path):
        self.engine = create_engine(Config.DATABASE_URL)
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.csv_path = csv_path
        self.df = None

    def _clean_phone(self, phone):
        """Standardize phone number format"""
        if pd.isna(phone):
            return None
        cleaned = re.sub(r'\D', '', str(phone))
        if len(cleaned) == 10:
            return f"({cleaned[:3]}) {cleaned[3:6]}-{cleaned[6:]}"
        return cleaned

    def _validate_email(self, email):
        """Basic email validation"""
        if pd.isna(email):
            return None
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return email if re.match(email_regex, str(email)) else None

    def load_csv(self):
        """Load and perform initial cleaning of CSV"""
        try:
            self.df = pd.read_csv(self.csv_path)
            logging.info(f"Loaded CSV: {self.csv_path}")
            logging.info(f"Total rows: {len(self.df)}")
            return self
        except Exception as e:
            logging.error(f"Error loading CSV: {e}")
            raise

    def print_columns(self):
        """Print column names for reference"""
        print(self.df.columns.tolist())
        return self

    def transform_data(self):
        """Transform raw data to match Reseller model"""
        # Implement column mapping based on actual CSV structure
        # This is a placeholder - will need adjustment based on actual data
        resellers = []
        session = self.Session()

        for _, row in self.df.iterrows():
            try:
                reseller = Reseller(
                    name=row.get('Business Name', 'Unknown'),
                    primary_phone=self._clean_phone(row.get('Phone', None)),
                    email=self._validate_email(row.get('Email', None)),
                    street_address=row.get('Address', None),
                    city=row.get('City', None),
                    state=row.get('State', None),
                    zip_code=row.get('Zip', None),
                    original_source='FindTruckService Scrape'
                )
                session.add(reseller)
            except Exception as e:
                logging.warning(f"Could not process row: {e}")

        try:
            session.commit()
            logging.info(f"Successfully imported {session.query(Reseller).count()} resellers")
        except Exception as e:
            session.rollback()
            logging.error(f"Error committing resellers: {e}")
        finally:
            session.close()

        return self

def main():
    importer = ResellerImporter('/path/to/your/csv/file.csv')
    importer.load_csv().print_columns().transform_data()

if __name__ == "__main__":
    main()