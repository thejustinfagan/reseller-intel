#!/bin/bash
# API Key Setup for Visual Facility Analysis

echo "🔑 Setting up API keys..."

# Google Maps API key (from openclaw credentials)
if [ -f ~/.openclaw/credentials/google-places.env ]; then
    source ~/.openclaw/credentials/google-places.env
    # Google Maps Static API uses the same key as Places API
    export GOOGLE_MAPS_API_KEY="$GOOGLE_PLACES_API_KEY"
    echo "✅ Google Maps API key loaded from openclaw credentials"
else
    echo "⚠️  Google Places credentials not found"
    echo "   Looking in shell config..."
    # Try from shell config
    if grep -q "GOOGLE_API_KEY" ~/.zshrc 2>/dev/null; then
        export GOOGLE_MAPS_API_KEY=$(grep "GOOGLE_API_KEY" ~/.zshrc | grep -v "^#" | cut -d= -f2 | tr -d '"' | tr -d "'")
        echo "✅ Google Maps API key loaded from .zshrc"
    fi
fi

# Gemini API key
if grep -q "GEMINI_API_KEY" ~/.zshrc 2>/dev/null; then
    export GEMINI_API_KEY=$(grep "GEMINI_API_KEY" ~/.zshrc | grep -v "^#" | cut -d= -f2 | tr -d '"' | tr -d "'")
    
    # Check if it's a placeholder
    if [[ "$GEMINI_API_KEY" == *"your-real-key"* ]]; then
        echo "⚠️  GEMINI_API_KEY is a placeholder in .zshrc"
        echo "   Get real key from: https://makersuite.google.com/app/apikey"
        echo "   Then update ~/.zshrc with: export GEMINI_API_KEY='your-actual-key'"
        unset GEMINI_API_KEY
    else
        echo "✅ Gemini API key loaded from .zshrc"
    fi
else
    echo "⚠️  GEMINI_API_KEY not found in .zshrc"
    echo "   Get key from: https://makersuite.google.com/app/apikey"
    echo "   Add to ~/.zshrc: export GEMINI_API_KEY='your-key'"
fi

echo ""
echo "📊 API Key Status:"
echo "-------------------"

if [ -n "$GOOGLE_MAPS_API_KEY" ]; then
    echo "✅ GOOGLE_MAPS_API_KEY: ${GOOGLE_MAPS_API_KEY:0:20}... (set)"
else
    echo "❌ GOOGLE_MAPS_API_KEY: Not set"
fi

if [ -n "$GEMINI_API_KEY" ]; then
    echo "✅ GEMINI_API_KEY: ${GEMINI_API_KEY:0:20}... (set)"
else
    echo "❌ GEMINI_API_KEY: Not set (will run in mock mode)"
fi

echo ""
echo "💡 To run visual analysis pipeline:"
echo "   source setup_api_keys.sh"
echo "   ./run_visual_analysis.sh"
