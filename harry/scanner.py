#!/usr/bin/env python3
"""
Harry Scanner — Main Entry Point
Reads scan-state.json, runs one batch, updates state, exits.
"""
import json
import os
import sys
from datetime import datetime
from pathlib import Path

# Add harry/sources to path
sys.path.insert(0, str(Path(__file__).parent))

from sources import findtruckservice, yellowpages, yelp, oem_locators, truckpaper

HARRY_DIR = Path(__file__).parent
STATE_FILE = HARRY_DIR / "scan-state.json"
LOG_FILE = HARRY_DIR / "scan-log.json"
FINDS_DIR = HARRY_DIR / "finds-raw"
FEEDBACK_FILE = HARRY_DIR / "larry-feedback.md"


def load_state():
    """Load scan state or initialize if missing."""
    if STATE_FILE.exists():
        with open(STATE_FILE) as f:
            return json.load(f)
    
    # Initialize fresh state
    with open(HARRY_DIR / "cities.json") as f:
        cities = json.load(f)
    
    with open(HARRY_DIR / "keywords.json") as f:
        keywords = json.load(f)
    
    sources = [
        "findtruckservice",
        "yellowpages",
        "yelp",
        "oem_locators",
        "truckpaper"
    ]
    
    return {
        "current_city_idx": 0,
        "current_source_idx": 0,
        "current_keyword_idx": 0,
        "cities": cities,
        "sources": sources,
        "keywords": keywords,
        "batch_count": 0,
        "errors": [],
        "last_run": None
    }


def save_state(state):
    """Save scan state."""
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2)


def append_log(entry):
    """Append entry to scan log."""
    logs = []
    if LOG_FILE.exists():
        with open(LOG_FILE) as f:
            logs = json.load(f)
    
    logs.append(entry)
    
    with open(LOG_FILE, 'w') as f:
        json.dump(logs, f, indent=2)


def read_feedback():
    """Read Larry's feedback if exists."""
    if FEEDBACK_FILE.exists():
        with open(FEEDBACK_FILE) as f:
            feedback = f.read().strip()
            if feedback:
                print(f"📝 Larry says: {feedback}\n")
                return feedback
    return None


def write_finds(finds, city, state_abbr, source):
    """Write finds to JSON file."""
    if not finds:
        return None
    
    timestamp = datetime.now().strftime("%Y-%m-%d")
    batch_num = len(list(FINDS_DIR.glob(f"{timestamp}-{city}-{source}-*.json")))
    filename = f"{timestamp}-{city}-{source}-{batch_num}.json"
    filepath = FINDS_DIR / filename
    
    with open(filepath, 'w') as f:
        json.dump(finds, f, indent=2)
    
    return filename


def run_batch():
    """Run one scan batch."""
    state = load_state()
    
    # Save initial state if first run
    if not STATE_FILE.exists():
        save_state(state)
    
    # Read feedback
    read_feedback()
    
    # Get current position
    city_idx = state.get("current_city_idx", 0)
    source_idx = state.get("current_source_idx", 0)
    keyword_idx = state.get("current_keyword_idx", 0)
    
    cities = state["cities"]
    sources = state["sources"]
    keywords_all = state["keywords"]
    
    # Check if done
    if city_idx >= len(cities):
        print("✅ All cities completed!")
        return
    
    city_info = cities[city_idx]
    source = sources[source_idx]
    
    # Select keywords based on source
    if source in ["yellowpages", "yelp"]:
        keywords = keywords_all["core"] + keywords_all["specialty"]
        if keyword_idx >= len(keywords):
            # Move to next source
            state["current_source_idx"] += 1
            state["current_keyword_idx"] = 0
            if state["current_source_idx"] >= len(sources):
                # Move to next city
                state["current_city_idx"] += 1
                state["current_source_idx"] = 0
            save_state(state)
            print(f"⏭ Finished {source} for {city_info['city']}, moving on...")
            return run_batch()
        
        keyword = keywords[keyword_idx]
    else:
        keyword = None
    
    print(f"🔍 Scanning: {city_info['city']}, {city_info['state']} | Source: {source} | Keyword: {keyword or 'N/A'}")
    
    # Run scraper
    finds = []
    errors = []
    
    try:
        if source == "findtruckservice":
            finds = findtruckservice.scrape(city_info["city"], city_info["state"])
        elif source == "yellowpages":
            finds = yellowpages.scrape(city_info["city"], city_info["state"], keyword)
        elif source == "yelp":
            finds = yelp.scrape(city_info["city"], city_info["state"], keyword)
        elif source == "oem_locators":
            finds = oem_locators.scrape()  # Scrapes all USA, not city-specific
        elif source == "truckpaper":
            finds = truckpaper.scrape(city_info["state"])
    except Exception as e:
        error_msg = f"Error in {source} for {city_info['city']}: {str(e)}"
        print(f"❌ {error_msg}")
        errors.append({
            "timestamp": datetime.now().isoformat(),
            "source": source,
            "city": city_info["city"],
            "error": str(e)
        })
        state["errors"].extend(errors)
    
    # Write finds
    filename = None
    if finds:
        filename = write_finds(finds, city_info["city"], city_info["state"], source)
        print(f"✅ Found {len(finds)} results, saved to {filename}")
    else:
        print(f"⚠️  No results found")
    
    # Update state
    state["batch_count"] += 1
    state["last_run"] = datetime.now().isoformat()
    
    if source in ["yellowpages", "yelp"]:
        state["current_keyword_idx"] += 1
    else:
        # Non-keyword sources: move to next source
        state["current_source_idx"] += 1
        if state["current_source_idx"] >= len(sources):
            state["current_city_idx"] += 1
            state["current_source_idx"] = 0
    
    save_state(state)
    
    # Log batch
    append_log({
        "timestamp": datetime.now().isoformat(),
        "batch": state["batch_count"],
        "city": city_info["city"],
        "state": city_info["state"],
        "source": source,
        "keyword": keyword,
        "finds": len(finds),
        "output_file": filename,
        "errors": errors
    })
    
    print(f"\n📊 Batch #{state['batch_count']} complete\n")


if __name__ == "__main__":
    if "--batch" in sys.argv:
        run_batch()
    else:
        print("Usage: python3 scanner.py --batch")
        sys.exit(1)
