# GAMEPLAN FOR GEMMA (Harry's Scanner)

**Goal:** Run Google Maps scraper every 30 minutes to find truck parts/repair businesses near Harrisburg PA and Sparks NV (300mi radius each). Build a massive database of leads.

---

## Phase 1: Fix & Test (NOW - Barry's doing this)
1. Fix company name extraction in google_maps.py
2. Test 3-5 batches to verify data quality
3. Commit working version

## Phase 2: Full Scan (Harry runs this)
```bash
# Run scanner in loop until all keywords × hubs are done
while true; do
  python3 ~/dev/reseller-intel/harry/scanner.py --batch
  sleep 10  # Brief pause between batches
done
```

**What this does:**
- Runs through all keywords (truck parts, semi truck repair, trailer repair, diesel repair, etc.)
- For both hubs (Harrisburg PA, Sparks NV)
- Each batch = 1 keyword × 1 hub
- Saves results to `harry/finds-raw/*.json`
- Updates `scan-state.json` to track progress

**Expected output:**
- ~15 keywords × 2 hubs = **30 batches**
- ~10-50 results per batch
- **Total: 300-1500 new companies** in finds-raw/

**Runtime:** ~2-3 hours (Google Maps loads slowly, need delays)

## Phase 3: Ingest to Database
```bash
python3 ~/dev/reseller-intel/harry/ingest.py
```

**What this does:**
- Reads all `finds-raw/*.json` files
- Deduplicates against existing database (phone, name+city, website domain)
- Inserts new companies into `reseller-intel.db`
- Moves processed files to `finds-raw/processed/`
- Writes summary to `nightly-summary.md`

## Phase 4: Cron Automation (after Phase 2 completes)
Add to crontab:
```cron
# Run scanner every 30 minutes
*/30 * * * * cd ~/dev/reseller-intel && python3 harry/scanner.py --batch >> harry/cron.log 2>&1

# Ingest new finds nightly at 2 AM
0 2 * * * cd ~/dev/reseller-intel && python3 harry/ingest.py >> harry/ingest.log 2>&1
```

**What this does:**
- Scanner runs continuously, cycling through keywords/hubs
- When it finishes all combos, it loops back to start (re-scrapes to find new businesses)
- Ingest runs nightly to add new companies to DB

---

## Key Files Harry Will Monitor

1. **`scan-state.json`** - Current position (which hub, which keyword)
2. **`scan-log.json`** - History of every batch (finds count, errors)
3. **`finds-raw/*.json`** - Raw scraped data waiting to be ingested
4. **`nightly-summary.md`** - Daily report (new vs duplicate counts)
5. **`larry-feedback.md`** - Instructions from Larry (if scanner needs tweaking)

---

## Success Metrics

**After Phase 2:**
- ✅ 300+ companies in finds-raw/
- ✅ No major errors in scan-log.json
- ✅ scan-state shows completion

**After Phase 3:**
- ✅ 100+ NEW companies added to database (rest are duplicates)
- ✅ nightly-summary.md shows insert stats

**Ongoing (with cron):**
- ✅ 10-20 new companies per day
- ✅ Database grows to 1000+ over 2-3 weeks
- ✅ No crashes or stalls

---

## Troubleshooting (for Harry)

**If scanner fails:**
1. Check `scan-log.json` → last entry shows error
2. Check `larry-feedback.md` for instructions
3. If Google blocks: increase delays in google_maps.py (change sleep times)
4. If Playwright crashes: restart, it resumes from scan-state.json

**If ingest fails:**
1. Check database exists: `ls -lh data/reseller-intel.db`
2. Check for duplicate/corrupt JSON files in finds-raw/
3. Run manually to see error: `python3 harry/ingest.py`

---

## Next Steps After Initial Scan

1. **Expand hubs:** Add more 300mi radius hubs (Chicago, Dallas, Atlanta, LA, Seattle)
2. **Add keywords:** OEM dealers, refrigeration, fleet maintenance
3. **Enable AI enrichment:** Feed new companies through enrichment pipeline
4. **Visual analysis:** Run satellite imagery on new high-confidence targets

---

**Start command for Harry:**
```bash
cd ~/dev/reseller-intel
# Clear state to start fresh
rm -f harry/scan-state.json harry/scan-log.json

# Run full scan (will take 2-3 hours)
while python3 harry/scanner.py --batch; do sleep 10; done

# Then ingest
python3 harry/ingest.py
```

That's it! Harry runs this, goes to bed, wakes up with hundreds of new leads in the database. 🚀
