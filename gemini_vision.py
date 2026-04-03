#!/usr/bin/env python3
"""
Gemini 2.0 Flash Vision integration for facility analysis
"""

import os
import json
import requests
import base64
from pathlib import Path

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

def encode_image_to_base64(image_path):
    """Encode image file to base64 string"""
    with open(image_path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')

def analyze_facility_image(image_path, facility_name, facility_address):
    """
    Analyze facility satellite image with Gemini 2.0 Flash Vision
    
    Returns dict with facility intelligence:
    - facility_size_acres
    - building_count
    - bay_count
    - trucks_visible
    - trailers_visible
    - cleanliness_score (1-10)
    - building_condition (1-10)
    - has_signage (boolean)
    - has_fencing (boolean)
    - lot_organized (boolean)
    - facility_type
    - analysis_notes
    """
    
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY environment variable not set")
    
    # Encode image
    image_base64 = encode_image_to_base64(image_path)
    
    # Construct prompt
    prompt = f"""Analyze this commercial truck facility from satellite imagery.

Facility: {facility_name}
Address: {facility_address}

Provide a detailed JSON analysis with these exact fields:

{{
  "facility_size_acres": <estimate facility size in acres, can be decimal like 1.5>,
  "building_count": <count distinct buildings, include all structures>,
  "bay_count": <count service bays/loading docks - look for doors on buildings>,
  "trucks_visible": <count large trucks/semi trucks/tractor-trailers in lot>,
  "trailers_visible": <count trailers (without tractors) parked in lot>,
  "cleanliness_score": <1-10, how clean and organized is the lot?>,
  "building_condition": <1-10, assess building condition from roof/structure>,
  "has_signage": <true/false, can you see professional business signage?>,
  "has_fencing": <true/false, is there security fencing around property?>,
  "lot_organized": <true/false, is parking organized or chaotic?>,
  "facility_type": <choose: "dealer", "repair_shop", "parts_warehouse", "service_center", "storage_yard", "other">,
  "analysis_notes": "<2-3 sentence summary of notable features, facility quality, any red flags>"
}}

Rules:
- Be specific and objective
- Use satellite view scale to estimate sizes
- For facility_size_acres: 1 acre ≈ 200ft × 200ft square
- For bay_count: Look for garage doors, loading docks, service bays
- For cleanliness_score: 10 = pristine, 1 = cluttered/dirty
- For building_condition: 10 = excellent, 1 = dilapidated
- Facility type should match the actual use you observe

Return ONLY valid JSON, no other text."""
    
    # Gemini API request
    headers = {
        'Content-Type': 'application/json'
    }
    
    payload = {
        "contents": [{
            "parts": [
                {
                    "text": prompt
                },
                {
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": image_base64
                    }
                }
            ]
        }],
        "generationConfig": {
            "temperature": 0.1,  # Low temperature for consistent analysis
            "topK": 1,
            "topP": 1,
            "maxOutputTokens": 1024,
        }
    }
    
    # Make request
    response = requests.post(
        f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
        headers=headers,
        json=payload,
        timeout=30
    )
    
    response.raise_for_status()
    result = response.json()
    
    # Extract JSON from response
    if 'candidates' in result and len(result['candidates']) > 0:
        candidate = result['candidates'][0]
        if 'content' in candidate and 'parts' in candidate['content']:
            text = candidate['content']['parts'][0]['text']
            
            # Parse JSON from response
            # Sometimes Gemini wraps JSON in markdown code blocks
            if '```json' in text:
                text = text.split('```json')[1].split('```')[0]
            elif '```' in text:
                text = text.split('```')[1].split('```')[0]
            
            text = text.strip()
            
            try:
                analysis = json.loads(text)
                
                # Validate required fields
                required_fields = [
                    'facility_size_acres', 'building_count', 'bay_count',
                    'trucks_visible', 'trailers_visible', 'cleanliness_score',
                    'building_condition', 'has_signage', 'has_fencing',
                    'lot_organized', 'facility_type', 'analysis_notes'
                ]
                
                for field in required_fields:
                    if field not in analysis:
                        raise ValueError(f"Missing required field: {field}")
                
                return analysis
            
            except json.JSONDecodeError as e:
                raise ValueError(f"Failed to parse Gemini response as JSON: {e}\nResponse: {text}")
    
    raise ValueError(f"Unexpected Gemini API response format: {result}")

# Test function
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python3 gemini_vision.py <image_path> [facility_name] [address]")
        sys.exit(1)
    
    image_path = sys.argv[1]
    facility_name = sys.argv[2] if len(sys.argv) > 2 else "Test Facility"
    address = sys.argv[3] if len(sys.argv) > 3 else "Unknown Address"
    
    if not GEMINI_API_KEY:
        print("Error: GEMINI_API_KEY environment variable not set")
        print("Set with: export GEMINI_API_KEY='your-key-here'")
        sys.exit(1)
    
    print(f"Analyzing: {facility_name}")
    print(f"Address: {address}")
    print(f"Image: {image_path}\n")
    
    try:
        result = analyze_facility_image(image_path, facility_name, address)
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
