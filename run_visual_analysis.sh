#!/bin/bash
# Quick start script for visual facility analysis

set -euo pipefail

echo "🛰️  Visual Facility Analysis Pipeline"
echo "===================================="
echo ""

# Check for API keys
if [ -z "${GOOGLE_MAPS_API_KEY:-}" ]; then
    echo "⚠️  WARNING: GOOGLE_MAPS_API_KEY not set"
    echo "   Running in MOCK mode (no actual satellite images)"
    echo "   To use real API: export GOOGLE_MAPS_API_KEY='your-key'"
    echo ""
fi

if [ -z "${GEMINI_API_KEY:-}" ]; then
    echo "⚠️  WARNING: GEMINI_API_KEY not set"
    echo "   Running in MOCK mode (no actual AI analysis)"
    echo "   To use real API: export GEMINI_API_KEY='your-key'"
    echo ""
fi

# Check dependencies
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: python3 not found"
    exit 1
fi

# Run pipeline
echo "🚀 Starting pipeline..."
echo ""

cd "$(dirname "$0")"
python3 visual_facility_analysis.py

echo ""
echo "✅ Pipeline complete!"
echo ""
echo "📊 Results saved to:"
echo "   ~/dev/reseller-intel/visual-analysis-results/"
echo ""
echo "🖼️  Images saved to:"
echo "   ~/dev/reseller-intel/facility-images/"
