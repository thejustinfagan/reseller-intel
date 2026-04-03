"""
Scraper for yelp.com
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
    Scrape yelp.com for keyword in city.
    Paginate up to 3 pages.
    """
    session = requests.Session()
    all_finds = []
    seen_phones = set()
    
    base_url = f"https://www.yelp.com/search?find_desc={quote_plus(keyword)}&find_loc={quote_plus(city)}+{state}"
    
    for page in range(0, 3):  # Pages 0, 1, 2 (Yelp uses start=0, start=10, start=20)
        start = page * 10
        url = f"{base_url}&start={start}" if start > 0 else base_url
        
        try:
            response = polite_get(url, session)
            if response.status_code != 200:
                print(f"  ⚠️  Page {page+1} returned {response.status_code}")
                break
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Yelp uses JSON-LD or dynamic classes - try common patterns
            listings = soup.select('[data-testid^="serp-ia-card"]') or soup.select('div[class*="businessName"]')
            
            if not listings:
                # Try alternative selectors
                listings = soup.select('div[class*="container__"]') or soup.select('.arrange-unit__')
            
            if not listings:
                print(f"  ℹ️  No listings found on page {page+1}")
                break
            
            for listing in listings:
                try:
                    # Name
                    name_elem = listing.select_one('a[class*="businessName"]') or listing.select_one('h3 a') or listing.select_one('h4 a')
                    name = name_elem.get_text(strip=True) if name_elem else None
                    
                    # Address
                    address_elem = listing.select_one('[class*="address"]') or listing.select_one('address')
                    address = address_elem.get_text(strip=True) if address_elem else ""
                    
                    # Phone
                    phone_elem = listing.select_one('[class*="phone"]') or listing.select_one('div:contains("(")') 
                    phone = phone_elem.get_text(strip=True) if phone_elem else ""
                    
                    # Rating
                    rating_elem = listing.select_one('[aria-label*="star rating"]') or listing.select_one('[class*="rating"]')
                    rating = None
                    if rating_elem and 'aria-label' in rating_elem.attrs:
                        rating_text = rating_elem['aria-label']
                        try:
                            rating = float(rating_text.split()[0])
                        except:
                            pass
                    
                    # Review count
                    review_elem = listing.select_one('[class*="reviewCount"]')
                    review_count = None
                    if review_elem:
                        review_text = review_elem.get_text(strip=True)
                        try:
                            review_count = int(''.join(filter(str.isdigit, review_text)))
                        except:
                            pass
                    
                    # Category
                    category_elem = listing.select_one('[class*="category"]') or listing.select_one('span.category-str-list')
                    category = category_elem.get_text(strip=True) if category_elem else keyword
                    
                    if not name:
                        continue
                    
                    # Dedupe by name+city since phone might not be visible
                    dedupe_key = f"{name.lower()}_{city.lower()}"
                    if dedupe_key in seen_phones:
                        continue
                    seen_phones.add(dedupe_key)
                    
                    all_finds.append({
                        "company_name": name,
                        "address": address,
                        "city": city,
                        "state": state,
                        "zip": "",
                        "phone": phone,
                        "website": "",
                        "source_url": url,
                        "source": "yelp",
                        "service_type": category,
                        "brand": None,
                        "rating": rating,
                        "review_count": review_count,
                        "scraped_at": datetime.now().isoformat(),
                        "harry_notes": ""
                    })
                
                except Exception as e:
                    print(f"  ⚠️  Error parsing listing: {e}")
                    continue
        
        except Exception as e:
            print(f"  ❌ Error scraping page {page+1}: {e}")
            break
    
    return all_finds
