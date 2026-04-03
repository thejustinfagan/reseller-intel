"""
Scraper for truckpaper.com dealer listings
"""
import time
import random
from datetime import datetime
import requests
from bs4 import BeautifulSoup

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


def scrape(state):
    """
    Scrape truckpaper.com for dealers in a state.
    Returns list of dealers.
    """
    session = requests.Session()
    all_finds = []
    seen_names = set()
    
    url = f"https://www.truckpaper.com/dealers/{state.lower()}"
    
    try:
        response = polite_get(url, session)
        if response.status_code != 200:
            print(f"  ⚠️  {url} returned {response.status_code}")
            return []
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find dealer listings
        listings = soup.select('.dealer-listing') or soup.select('div[class*="dealer"]')
        
        for listing in listings:
            try:
                name_elem = listing.select_one('.dealer-name') or listing.select_one('h3') or listing.select_one('h4')
                name = name_elem.get_text(strip=True) if name_elem else None
                
                address_elem = listing.select_one('.address') or listing.select_one('.location')
                address = address_elem.get_text(strip=True) if address_elem else ""
                
                phone_elem = listing.select_one('.phone') or listing.select_one('a[href^="tel:"]')
                phone = phone_elem.get_text(strip=True) if phone_elem else ""
                if phone_elem and phone_elem.has_attr('href'):
                    phone = phone_elem['href'].replace('tel:', '').strip()
                
                website_elem = listing.select_one('a[href*="http"]')
                website = website_elem.get('href', '') if website_elem else ""
                
                brands_elem = listing.select_one('.brands') or listing.select('.brand')
                brands = ""
                if brands_elem:
                    if isinstance(brands_elem, list):
                        brands = ", ".join([b.get_text(strip=True) for b in brands_elem])
                    else:
                        brands = brands_elem.get_text(strip=True)
                
                if not name:
                    continue
                
                # Dedupe by name
                if name.lower() in seen_names:
                    continue
                seen_names.add(name.lower())
                
                all_finds.append({
                    "company_name": name,
                    "address": address,
                    "city": "",  # Extract from address if needed
                    "state": state,
                    "zip": "",
                    "phone": phone,
                    "website": website,
                    "source_url": url,
                    "source": "truckpaper",
                    "service_type": "truck dealer",
                    "brand": brands or None,
                    "rating": None,
                    "review_count": None,
                    "scraped_at": datetime.now().isoformat(),
                    "harry_notes": ""
                })
            
            except Exception as e:
                print(f"  ⚠️  Error parsing listing: {e}")
                continue
    
    except Exception as e:
        print(f"  ❌ Error scraping truckpaper: {e}")
    
    return all_finds
