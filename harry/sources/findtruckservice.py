"""
Scraper for findtruckservice.com
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


def scrape(city, state):
    """
    Scrape findtruckservice.com for a city.
    Returns list of standardized company dicts.
    """
    service_types = [
        "truck-repair",
        "truck-parts",
        "trailer-repair",
        "diesel-repair",
        "refrigeration"
    ]
    
    session = requests.Session()
    all_finds = []
    seen_phones = set()
    
    for service_type in service_types:
        city_slug = city.lower().replace(" ", "-")
        url = f"https://www.findtruckservice.com/{service_type}/{state.lower()}/{city_slug}"
        
        try:
            response = polite_get(url, session)
            if response.status_code != 200:
                print(f"  ⚠️  {url} returned {response.status_code}")
                continue
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find listings (structure may vary - adjust selectors as needed)
            listings = soup.select('.listing-item') or soup.select('.business-listing') or soup.select('article')
            
            for listing in listings:
                try:
                    name_elem = listing.select_one('.business-name') or listing.select_one('h2') or listing.select_one('h3')
                    name = name_elem.get_text(strip=True) if name_elem else None
                    
                    address_elem = listing.select_one('.address') or listing.select_one('.location')
                    address = address_elem.get_text(strip=True) if address_elem else ""
                    
                    phone_elem = listing.select_one('.phone') or listing.select_one('a[href^="tel:"]')
                    phone = phone_elem.get_text(strip=True) if phone_elem else ""
                    if phone_elem and phone_elem.has_attr('href'):
                        phone = phone_elem['href'].replace('tel:', '').strip()
                    
                    detail_url_elem = listing.select_one('a[href*="/"]')
                    detail_url = ""
                    if detail_url_elem and detail_url_elem.has_attr('href'):
                        detail_url = detail_url_elem['href']
                        if not detail_url.startswith('http'):
                            detail_url = f"https://www.findtruckservice.com{detail_url}"
                    
                    # Skip if no name or phone
                    if not name or not phone:
                        continue
                    
                    # Dedupe by phone
                    if phone in seen_phones:
                        continue
                    seen_phones.add(phone)
                    
                    all_finds.append({
                        "company_name": name,
                        "address": address,
                        "city": city,
                        "state": state,
                        "zip": "",
                        "phone": phone,
                        "website": detail_url,
                        "source_url": url,
                        "source": "findtruckservice",
                        "service_type": service_type.replace("-", " "),
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
            print(f"  ❌ Error scraping {service_type}: {e}")
            continue
    
    return all_finds
