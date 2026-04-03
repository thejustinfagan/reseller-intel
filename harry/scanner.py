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

from sources import google_maps

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
    with open(HARRY_DIR / "hubs.json") as f:
        hubs = json.load(f)
    
    with open(HARRY_DIR / "keywords.json") as f:
        keywords = json.load(f)
    
    # Use only core keywords for Google search
    search_keywords = keywords.get("core", []) + keywords.get("specialty", [])
    
    return {
        "current_hub_idx": 0,
        "current_keyword_idx": 0,
        "hubs": hubs,
        "keywords": search_keywords,
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
    hub_idx = state.get("current_hub_idx", 0)
    keyword_idx = state.get("current_keyword_idx", 0)
    
    hubs = state["hubs"]
    keywords = state["keywords"]
    
    # Check if done
    if hub_idx >= len(hubs):
        print("✅ All hubs completed!")
        return
    
    if keyword_idx >= len(keywords):
        # Move to next hub
        state["current_hub_idx"] += 1
        state["current_keyword_idx"] = 0
        save_state(state)
        if state["current_hub_idx"] >= len(hubs):
            print("✅ All hubs completed!")
            return
        print(f"⏭ Finished keywords for hub {hub_idx}, moving to next hub...")
        return run_batch()
    
    hub = hubs[hub_idx]
    keyword = keywords[keyword_idx]
    
    print(f"🔍 Scanning: {hub['name']}, {hub['state']} ({hub['radius_miles']}mi radius) | Keyword: {keyword}")
    
    # Run Google search scraper
    finds = []
    errors = []
    
    try:
        finds = google_maps.scrape(hub, keyword, hub['radius_miles'])
    except Exception as e:
        error_msg = f"Error searching '{keyword}' for {hub['name']}: {str(e)}"
        print(f"❌ {error_msg}")
        errors.append({
            "timestamp": datetime.now().isoformat(),
            "hub": hub["name"],
            "keyword": keyword,
            "error": str(e)
        })
        state["errors"].extend(errors)
    
    # Write finds
    filename = None
    if finds:
        filename = write_finds(finds, hub["name"], hub["state"], "google")
        print(f"✅ Found {len(finds)} results, saved to {filename}")
    else:
        print(f"⚠️  No results found")
    
    # Update state
    state["batch_count"] += 1
    state["last_run"] = datetime.now().isoformat()
    state["current_keyword_idx"] += 1
    
    save_state(state)
    
    # Log batch
    append_log({
        "timestamp": datetime.now().isoformat(),
        "batch": state["batch_count"],
        "hub": hub["name"],
        "state": hub["state"],
        "radius_miles": hub["radius_miles"],
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
