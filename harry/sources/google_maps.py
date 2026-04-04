"""
Google Maps scraper using Playwright for JS rendering
Searches for businesses near hub locations
"""
import time
import random
import re
from datetime import datetime
from urllib.parse import unquote


def extract_business_metadata(text):
    """Extract metadata from business text (hours, categories, attributes)."""
    metadata = {
        "business_type": None,
        "is_open_now": None,
        "hours_available": False,
        "services": [],
        "attributes": []
    }
    
    # Business type hints
    type_keywords = {
        "parts": ["parts", "supply", "supplier"],
        "repair": ["repair", "service", "maintenance"],
        "dealer": ["dealer", "dealership", "sales"],
        "manufacturer": ["manufacturer", "manufacturing"],
        "distributor": ["distributor", "wholesale"]
    }
    
    text_lower = text.lower()
    for btype, keywords in type_keywords.items():
        if any(kw in text_lower for kw in keywords):
            metadata["business_type"] = btype
            break
    
    # Open status
    if re.search(r'\bopen\b.*\bnow\b', text_lower) or re.search(r'\bopen\s+\u00b7', text_lower):
        metadata["is_open_now"] = True
    elif 'closed' in text_lower:
        metadata["is_open_now"] = False
    
    # Hours availability
    if re.search(r'\d+\s*(?:am|pm)', text_lower):
        metadata["hours_available"] = True
    
    # Service keywords
    service_keywords = [
        "mobile", "24/7", "emergency", "roadside", "towing",
        "diesel", "refrigerated", "reefer", "heavy duty", "commercial"
    ]
    metadata["services"] = [kw for kw in service_keywords if kw in text_lower]
    
    # Attribute keywords
    attribute_keywords = [
        "veteran-owned", "woman-owned", "family-owned", "certified", 
        "authorized", "factory authorized", "ASE certified"
    ]
    metadata["attributes"] = [kw for kw in attribute_keywords if kw in text_lower]
    
    return metadata


def scrape_with_playwright(hub, keyword, radius_miles=300):
    """
    Use Playwright to scrape Google Maps listings with deep detail extraction.
    Returns list of businesses with comprehensive metadata.
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
            context = browser.new_context(viewport={"width": 1920, "height": 1080})
            page = context.new_page()
            
            page.goto(maps_url, wait_until="domcontentloaded", timeout=60000)
            time.sleep(5)  # Wait for initial load
            
            # Scroll left panel to load more results
            results_panel = page.query_selector('div[role="feed"]')
            if results_panel:
                for _ in range(3):
                    results_panel.evaluate("el => el.scrollTop = el.scrollHeight")
                    time.sleep(2)
            
            # Get all listing links (not the containers - the actual clickable links)
            listing_links = page.query_selector_all('a[href*="/maps/place/"]')
            print(f"  📍 Found {len(listing_links)} map listings")
            
            # Process each listing individually
            for idx, link in enumerate(listing_links[:15]):  # Limit to 15 for quality
                try:
                    # Get company name from aria-label before clicking
                    aria_label = link.get_attribute('aria-label') or ''
                    parts = aria_label.split('·')
                    company_name = parts[0].strip() if parts else aria_label.strip()
                    
                    if not company_name or company_name.lower() in seen_names:
                        continue
                    
                    seen_names.add(company_name.lower())
                    
                    # Parse rating and reviews from aria-label (format: "Name · 4.5★ · Category · (123)")
                    rating = None
                    review_count = None
                    
                    # Try star emoji first
                    rating_match = re.search(r'(\d\.\d)\s*★', aria_label)
                    if not rating_match:
                        # Try 'stars' keyword
                        rating_match = re.search(r'(\d\.\d)\s+stars?', aria_label, re.IGNORECASE)
                    if rating_match:
                        try:
                            rating = float(rating_match.group(1))
                        except:
                            pass
                    
                    # Extract review count
                    review_match = re.search(r'\((\d[\d,]*)\)', aria_label)
                    if review_match:
                        try:
                            review_count = int(review_match.group(1).replace(',', ''))
                        except:
                            pass
                    
                    # Click to open detail panel
                    link.click()
                    
                    # Wait for the NEW detail panel to load by checking h1 text changes
                    escaped_name = company_name.replace("'", "\\'")
                    try:
                        # Wait for h1 to contain this company name
                        page.wait_for_function(
                            f"document.querySelector('h1')?.innerText.includes('{escaped_name}')",
                            timeout=5000
                        )
                    except:
                        # Fallback: just wait 3 seconds for panel to update
                        time.sleep(3)
                    
                    # CRITICAL: Re-query detail panel fresh each time to avoid caching
                    # Google Maps has TWO role="main" elements - list panel and detail panel
                    # We want the SECOND one (detail panel with aria-label)
                    time.sleep(0.5)  # Let DOM settle
                    detail_panel = page.locator('[role="main"][aria-label]').first
                    detail_text = detail_panel.inner_text()
                    
                    # If still no rating from aria-label, check detail panel text
                    if rating is None:
                        rating_in_panel = re.search(r'(\d\.\d)\s*(?:out of 5|stars?)', detail_text, re.IGNORECASE)
                        if rating_in_panel:
                            try:
                                rating = float(rating_in_panel.group(1))
                            except:
                                pass
                    
                    # Extract phone - scope to detail panel with aria-label
                    phone = ""
                    phone_locator = page.locator('[role="main"][aria-label] button[data-item-id*="phone"]').first
                    if phone_locator.count() > 0:
                        phone_text = phone_locator.inner_text()
                        phone_match = re.search(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', phone_text)
                        phone = phone_match.group(0) if phone_match else phone_text.strip()
                    else:
                        # Fallback: regex in full text
                        phone_match = re.search(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', detail_text)
                        phone = phone_match.group(0) if phone_match else ""
                    
                    # Extract address - try multiple selectors
                    address = ""
                    zip_code = None
                    
                    # Try button with address data-item-id
                    addr_locator = page.locator('[role="main"][aria-label] button[data-item-id*="address"]').first
                    if addr_locator.count() > 0:
                        raw_addr = addr_locator.inner_text()
                        # Clean up: remove unicode icons/emojis at start of line
                        raw_addr = re.sub(r'^[\ue000-\uf8ff\U0001f000-\U0001ffff]+\s*', '', raw_addr, flags=re.MULTILINE)
                        raw_addr = raw_addr.strip()
                    else:
                        raw_addr = ""
                    
                    # If button didn't work or returned garbage, try aria-label
                    if not raw_addr or len(raw_addr) < 5:
                        # Try getting address from aria-label attribute
                        addr_aria = addr_locator.get_attribute('aria-label') if addr_locator.count() > 0 else None
                        if addr_aria:
                            raw_addr = addr_aria.strip()
                    
                    # If still no luck, search detail text for address pattern
                    if not raw_addr or len(raw_addr) < 5:
                        # Format: "1234 Street Name" on its own line
                        addr_match = re.search(r'\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Circle|Cir|Plaza|Plz)[\w\s,]*', detail_text, re.IGNORECASE)
                        raw_addr = addr_match.group(0).strip() if addr_match else ""
                    
                    if raw_addr and len(raw_addr) >= 5:
                        addr_lines = raw_addr.split('\n')
                        address = addr_lines[0].strip()
                        # Remove any remaining unicode icons
                        address = re.sub(r'[\ue000-\uf8ff\U0001f000-\U0001ffff]+', '', address).strip()
                        # Extract ZIP from full raw address
                        zip_match = re.search(r'\b(\d{5})(?:-\d{4})?\b', raw_addr)
                        if zip_match:
                            zip_code = zip_match.group(1)
                    
                    # Last resort: try to get ZIP from detail text
                    if not zip_code:
                        zip_match = re.search(r'\b(\d{5})(?:-\d{4})?\b', detail_text)
                        if zip_match:
                            zip_code = zip_match.group(1)
                    
                    # Extract website - scope to detail panel
                    website = ""
                    web_locator = page.locator('[role="main"][aria-label] a[data-item-id="authority"]').first
                    if web_locator.count() > 0:
                        href = web_locator.get_attribute('href') or ""
                        if '/url?q=' in href:
                            url_match = re.search(r'[?&]q=([^&]+)', href)
                            if url_match:
                                website = unquote(url_match.group(1))
                        elif href and not href.startswith('javascript:'):
                            website = href
                    
                    # Extract metadata
                    metadata = extract_business_metadata(detail_text)
                    
                    # Build result
                    result = {
                        "company_name": company_name,
                        "address": address,
                        "city": hub['name'],
                        "state": hub['state'],
                        "zip": zip_code,
                        "phone": phone,
                        "website": website,
                        "source_url": maps_url,
                        "source": "google_maps",
                        "service_type": keyword,
                        "rating": rating,
                        "review_count": review_count,
                        "scraped_at": datetime.now().isoformat(),
                        
                        # Metadata fields
                        "business_type": metadata["business_type"],
                        "is_open_now": metadata["is_open_now"],
                        "hours_available": metadata["hours_available"],
                        "services": ", ".join(metadata["services"]) if metadata["services"] else None,
                        "attributes": ", ".join(metadata["attributes"]) if metadata["attributes"] else None,
                        
                        # Notes
                        "harry_notes": f"Hub: {hub['name']}, {hub['state']}, Radius: {radius_miles}mi"
                    }
                    
                    all_finds.append(result)
                    print(f"  ✓ {idx+1}/{min(len(listing_links), 15)}: {company_name} [{rating or 'N/A'}★, {phone or 'no phone'}]")
                
                except Exception as e:
                    print(f"  ⚠️  Error scraping listing {idx+1}: {e}")
                    continue
            
            browser.close()
    
    except Exception as e:
        print(f"  ❌ Error with Playwright: {e}")
        import traceback
        traceback.print_exc()
    
    return all_finds


def scrape(hub, keyword, radius_miles=300):
    """Main entry point - use Playwright."""
    return scrape_with_playwright(hub, keyword, radius_miles)
