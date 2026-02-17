# Reseller Intel

## Overview
Comprehensive database and intelligence platform for truck parts resellers, supporting Autocar Parts LLC's sales team.

## Features
- Nationwide reseller mapping
- Google Places API integration
- VIN compatibility tracking
- Advanced search and filtering

## Tech Stack
- Next.js
- Tailwind CSS
- PostgreSQL
- SQLAlchemy
- Railway Deployment

## Local Setup
1. Clone repository
2. `npm install`
3. Copy `.env.local.example` to `.env.local`
4. Fill in API keys and database credentials
5. `npm run dev`

## Data Pipeline
- Google Places API crawler
- FMCSA data integration
- Automated deduplication
- Regular data refreshes

## Synchronization
Synchronized with Fleet Intel via `sync_with_fleet_intel.sh`

## License
(Proprietary - Autocar Parts LLC)