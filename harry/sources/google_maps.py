"""
Google Maps scraper using Playwright for JS rendering
Searches for businesses near hub locations
"""
import time
import random
import re
from datetime import datetime


def scrape_with_playwright(hub, keyword, radius_miles=300):
    """
    Use Playwright to scrape Google Maps listings.
    Returns list of businesses.
    """
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("  ⚠️  Playwright not installed. Run: pip install playwright && playwright install chromium")
        return []
    
    all_finds = []
    seen_names = set()
    
    query = f"{keyword} near {hub['name']}, {hub['state']}"
    maps_url = f"https://www.google.com/maps/search/{query.replace(' ', '+')}"
    
    print(f"  🗺️  Google Maps: {query}")
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            # Set viewport and user agent
            page.set_viewport_size({"width": 1920, "height": 1080})
            
            page.goto(maps_url, wait_until="domcontentloaded", timeout=60000)
            
            # Wait for results to load
            time.sleep(5)
            
            # Scroll to load more results
            for _ in range(3):
                page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                time.sleep(2)
            
            # Extract business listings
            # Google Maps uses dynamic class names, so we target by role/aria labels
            listings = page.query_selector_all('[role="article"]') or page.query_selector_all('div[jsaction*="mouseover"]')
            
            print(f"  📍 Found {len(listings)} map listings")
            
            for listing in listings[:50]:  # Limit to first 50
                try:
                    # Click to expand details (if needed)
                    name_elem = listing.query_selector('div[role="heading"]') or listing.query_selector('a[aria-label]')
                    if not name_elem:
                        continue
                    
                    company_name = name_elem.inner_text().strip()
                    
                    # Skip if already seen
                    if company_name.lower() in seen_names:
                        continue
                    seen_names.add(company_name.lower())
                    
                    # Get full text content
                    full_text = listing.inner_text()
                    
                    # Extract phone
                    phone_match = re.search(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', full_text)
                    phone = phone_match.group(0) if phone_match else ""
                    
                    # Extract address
                    address = ""
                    addr_lines = [line for line in full_text.split('\n') if re.search(r'\d+\s+\w', line)]
                    if addr_lines:
                        address = addr_lines[0]
                    
                    # Extract rating
                    rating = None
                    rating_match = re.search(r'(\d\.\d)\s*stars?', full_text, re.IGNORECASE)
                    if rating_match:
                        try:
                            rating = float(rating_match.group(1))
                        except:
                            pass
                    
                    # Extract review count
                    review_count = None
                    review_match = re.search(r'(\d{1,5})\s*reviews?', full_text, re.IGNORECASE)
                    if review_match:
                        try:
                            review_count = int(review_match.group(1))
                        except:
                            pass
                    
                    # Try to get website
                    website = ""
                    website_link = listing.query_selector('a[href*="http"]')
                    if website_link:
                        href = website_link.get_attribute('href') or ""
                        if 'google.com' not in href:
                            website = href
                    
                    all_finds.append({
                        "company_name": company_name,
                        "address": address,
                        "city": hub['name'],
                        "state": hub['state'],
                        "zip": "",
                        "phone": phone,
                        "website": website,
                        "source_url": maps_url,
                        "source": "google_maps",
                        "service_type": keyword,
                        "brand": None,
                        "rating": rating,
                        "review_count": review_count,
                        "scraped_at": datetime.now().isoformat(),
                        "harry_notes": f"Hub: {hub['name']}, {hub['state']}, Radius: {radius_miles}mi"
                    })
                
                except Exception as e:
                    print(f"  ⚠️  Error parsing listing: {e}")
                    continue
            
            browser.close()
    
    except Exception as e:
        print(f"  ❌ Error with Playwright: {e}")
    
    return all_finds


def scrape(hub, keyword, radius_miles=300):
    """Main entry point - use Playwright."""
    return scrape_with_playwright(hub, keyword, radius_miles)
