#!/bin/bash

# Synchronization Script for Reseller Intel and Fleet Intel

FLEET_INTEL_DIR="/Users/justinfagan/projects/fleet-intel"
RESELLER_INTEL_DIR="/Users/justinfagan/projects/reseller-intel"

# Shared Components to Sync
SHARED_COMPONENTS=(
    "tailwind.config.ts"
    "next.config.mjs"
    "postcss.config.js"
    "tsconfig.json"
    "lib/database_utils.ts"
    "lib/api_helpers.ts"
    "components/ui/base_table.tsx"
    "components/map/base_map.tsx"
    "styles/globals.css"
)

# Perform Sync
for component in "${SHARED_COMPONENTS[@]}"; do
    if [ -f "$FLEET_INTEL_DIR/$component" ]; then
        mkdir -p "$(dirname "$RESELLER_INTEL_DIR/$component")"
        cp "$FLEET_INTEL_DIR/$component" "$RESELLER_INTEL_DIR/$component"
        echo "Synced: $component"
    fi
done

# Update package.json dependencies
FLEET_DEPS=$(jq '.dependencies' "$FLEET_INTEL_DIR/package.json")
jq --argjson deps "$FLEET_DEPS" '.dependencies = $deps' "$RESELLER_INTEL_DIR/package.json" > temp.json && 
    mv temp.json "$RESELLER_INTEL_DIR/package.json"

# Version tracking
CURRENT_VERSION=$(git -C "$FLEET_INTEL_DIR" describe --tags)
echo "$CURRENT_VERSION" > "$RESELLER_INTEL_DIR/FLEET_INTEL_SYNC_VERSION"

# Reinstall dependencies
cd "$RESELLER_INTEL_DIR" && npm install

echo "Synchronization complete with Fleet Intel version: $CURRENT_VERSION"