"""
Google Search scraper for truck parts/repair businesses
Searches within radius of hub cities
"""
import time
import random
import re
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


def polite_get(url, session, min_delay=3, max_delay=6):
    """Rate-limited GET request with Google-friendly headers."""
    time.sleep(random.uniform(min_delay, max_delay))
    
    headers = {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1"
    }
    
    return session.get(url, headers=headers, timeout=20)


def extract_phone(text):
    """Extract phone number from text."""
    # Match (XXX) XXX-XXXX or XXX-XXX-XXXX
    phone_patterns = [
        r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
        r'\d{3}[-.\s]\d{3}[-.\s]\d{4}'
    ]
    
    for pattern in phone_patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(0)
    return None


def scrape(hub, keyword, radius_miles=300):
    """
    Search Google for keyword within radius of hub.
    
    Args:
        hub: dict with name, state, lat, lon
        keyword: search term (e.g., "truck parts")
        radius_miles: search radius
    
    Returns:
        list of company dicts
    """
    session = requests.Session()
    all_finds = []
    seen_names = set()
    
    # Build Google search query
    # Format: "keyword" near "City, ST" within X miles
    location = f"{hub['name']}, {hub['state']}"
    query = f"{keyword} near {location}"
    
    # Google search URL
    search_url = f"https://www.google.com/search?q={quote_plus(query)}&num=50"
    
    print(f"  🔍 Google: {query}")
    
    try:
        response = polite_get(search_url, session)
        
        if response.status_code == 429:
            print(f"  ⚠️  Rate limited by Google (429)")
            return []
        
        if response.status_code != 200:
            print(f"  ⚠️  Google returned {response.status_code}")
            return []
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Google uses div.g for search results
        # Within each result: h3 for title, cite for URL, div for snippet
        results = soup.select('div.g') or soup.select('[data-hveid]')
        
        print(f"  📍 Found {len(results)} search results")
        
        for result in results:
            try:
                # Company name from heading
                title_elem = result.select_one('h3')
                if not title_elem:
                    continue
                
                company_name = title_elem.get_text(strip=True)
                
                # Skip if already seen
                if company_name.lower() in seen_names:
                    continue
                
                # URL/website
                link_elem = result.select_one('a[href]')
                website = ""
                if link_elem:
                    href = link_elem.get('href', '')
                    # Google wraps URLs - extract actual domain
                    if href.startswith('http'):
                        website = href.split('&')[0]  # Clean up tracking params
                
                # Snippet text (contains address, phone sometimes)
                snippet_elem = result.select_one('div[data-sncf]') or result.select_one('.VwiC3b')
                snippet = snippet_elem.get_text(strip=True) if snippet_elem else ""
                
                # Try to extract phone from snippet
                phone = extract_phone(snippet)
                
                # Try to extract address from snippet
                # Common pattern: "123 Main St, City, ST 12345"
                address = ""
                # Look for street address pattern
                addr_match = re.search(r'\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd|Lane|Ln|Way|Court|Ct)', snippet, re.IGNORECASE)
                if addr_match:
                    address = addr_match.group(0)
                
                # Extract city/state/zip if present
                city = hub['name']  # Default to hub city
                state = hub['state']
                zip_code = ""
                
                zip_match = re.search(r'\b\d{5}(?:-\d{4})?\b', snippet)
                if zip_match:
                    zip_code = zip_match.group(0)
                
                seen_names.add(company_name.lower())
                
                all_finds.append({
                    "company_name": company_name,
                    "address": address,
                    "city": city,
                    "state": state,
                    "zip": zip_code,
                    "phone": phone or "",
                    "website": website,
                    "source_url": search_url,
                    "source": "google",
                    "service_type": keyword,
                    "brand": None,
                    "rating": None,
                    "review_count": None,
                    "scraped_at": datetime.now().isoformat(),
                    "harry_notes": f"Hub: {location}, Radius: {radius_miles}mi"
                })
            
            except Exception as e:
                print(f"  ⚠️  Error parsing result: {e}")
                continue
    
    except Exception as e:
        print(f"  ❌ Error scraping Google: {e}")
    
    return all_finds
