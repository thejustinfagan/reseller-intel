import googlemaps
import pandas as pd
from config import Config
from database import Session, Reseller
from sqlalchemy.exc import IntegrityError
import time
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s: %(message)s')

class GooglePlacesCrawler:
    def __init__(self, api_key=Config.GOOGLE_MAPS_API_KEY):
        self.gmaps = googlemaps.Client(key=api_key)
        self.session = Session()

    def search_by_query(self, query, state, radius=50000):  # 50km radius
        try:
            # Approximate state center (rough estimation)
            state_centers = {
                "AL": (32.7794, -86.8287), "CA": (37.2272, -119.2486),
                # Add more state centers
            }
            
            center = state_centers.get(state, (0, 0))
            
            results = self.gmaps.places_nearby(
                location=center,
                radius=radius,
                keyword=query,
                type='establishment'
            )

            for place in results.get('results', []):
                self._save_place(place, state, query)
                
            time.sleep(1)  # Respect API rate limits
            
        except Exception as e:
            logging.error(f"Error searching {query} in {state}: {e}")

    def _save_place(self, place, state, search_query):
        try:
            reseller = Reseller(
                id=place.get('place_id'),
                name=place.get('name', ''),
                address=place.get('vicinity', ''),
                state=state,
                google_place_id=place.get('place_id'),
                business_types=[search_query],
                latitude=place['geometry']['location']['lat'] if 'geometry' in place else None,
                longitude=place['geometry']['location']['lng'] if 'geometry' in place else None
            )
            
            self.session.merge(reseller)
            self.session.commit()
        except IntegrityError:
            self.session.rollback()
        except Exception as e:
            logging.error(f"Error saving place {place.get('name')}: {e}")
            self.session.rollback()

    def crawl(self):
        for state in Config.STATES:
            logging.info(f"Crawling state: {state}")
            for query in Config.SEARCH_QUERIES:
                self.search_by_query(query, state)

def main():
    crawler = GooglePlacesCrawler()
    crawler.crawl()

if __name__ == "__main__":
    main()