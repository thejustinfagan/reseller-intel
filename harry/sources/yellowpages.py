"""
Scraper for yellowpages.com
"""
import time
import random
from datetime import datetime
import requests
from bs4 import BeautifulSoup
from urllib.parse import quote_plus

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
]


def polite_get(url, session, min_delay=2, max_delay=4):
    """Rate-limited GET request."""
    time.sleep(random.uniform(min_delay, max_delay))
    headers = {"User-Agent": random.choice(USER_AGENTS)}
    return session.get(url, headers=headers, timeout=15)


def scrape(city, state, keyword):
    """
    Scrape yellowpages.com for keyword in city.
    Paginate up to 3 pages.
    """
    session = requests.Session()
    all_finds = []
    seen_phones = set()
    
    base_url = f"https://www.yellowpages.com/search?search_terms={quote_plus(keyword)}&geo_location_terms={quote_plus(city)}+{state}"
    
    for page in range(1, 4):  # Pages 1-3
        url = f"{base_url}&page={page}" if page > 1 else base_url
        
        try:
            response = polite_get(url, session)
            if response.status_code != 200:
                print(f"  ⚠️  Page {page} returned {response.status_code}")
                break
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Yellow Pages uses .result class for listings
            listings = soup.select('.result') or soup.select('.search-results .info')
            
            if not listings:
                print(f"  ℹ️  No listings found on page {page}")
                break
            
            for listing in listings:
                try:
                    name_elem = listing.select_one('.business-name') or listing.select_one('a.business-name')
                    name = name_elem.get_text(strip=True) if name_elem else None
                    
                    address_elem = listing.select_one('.street-address')
                    city_elem = listing.select_one('.locality')
                    state_elem = listing.select_one('.region')
                    zip_elem = listing.select_one('.postal-code')
                    
                    address = address_elem.get_text(strip=True) if address_elem else ""
                    city_parsed = city_elem.get_text(strip=True) if city_elem else city
                    state_parsed = state_elem.get_text(strip=True) if state_elem else state
                    zip_code = zip_elem.get_text(strip=True) if zip_elem else ""
                    
                    phone_elem = listing.select_one('.phones') or listing.select_one('div.phone')
                    phone = phone_elem.get_text(strip=True) if phone_elem else ""
                    
                    website_elem = listing.select_one('a.track-visit-website')
                    website = website_elem.get('href', '') if website_elem else ""
                    
                    categories_elem = listing.select_one('.categories')
                    category = categories_elem.get_text(strip=True) if categories_elem else ""
                    
                    if not name or not phone:
                        continue
                    
                    # Dedupe
                    if phone in seen_phones:
                        continue
                    seen_phones.add(phone)
                    
                    all_finds.append({
                        "company_name": name,
                        "address": address,
                        "city": city_parsed,
                        "state": state_parsed,
                        "zip": zip_code,
                        "phone": phone,
                        "website": website,
                        "source_url": url,
                        "source": "yellowpages",
                        "service_type": keyword,
                        "brand": None,
                        "rating": None,
                        "review_count": None,
                        "scraped_at": datetime.now().isoformat(),
                        "harry_notes": ""
                    })
                
                except Exception as e:
                    print(f"  ⚠️  Error parsing listing: {e}")
                    continue
        
        except Exception as e:
            print(f"  ❌ Error scraping page {page}: {e}")
            break
    
    return all_finds
