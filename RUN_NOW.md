# Run Visual Facility Analysis - NOW

## Execute These Commands:

```bash
cd ~/dev/reseller-intel

# Set your Gemini API key (paste your actual key)
export GEMINI_API_KEY='paste-your-key-here'

# Load API keys (Google Maps + Gemini)
source setup_api_keys.sh

# Should show both keys as ✅ set

# Run the pipeline
./run_visual_analysis.sh
```

## What to Expect:

**Runtime:** 2-3 hours for ~680 facilities

**Console output:**
- Live progress per facility
- Satellite image download confirmations
- Gemini AI analysis results
- Database updates
- Checkpoints every 10 facilities

**Can run in background:**
```bash
nohup ./run_visual_analysis.sh > visual_analysis.log 2>&1 &

# Watch progress:
tail -f visual_analysis.log
```

## While It Runs:

You can monitor progress with:
```bash
# Count images downloaded
ls ~/dev/reseller-intel/facility-images/ | wc -l

# Check database updates
sqlite3 ~/dev/reseller-intel/data/reseller-intel.db \
  "SELECT COUNT(*) FROM companies WHERE visual_analyzed_at IS NOT NULL"
```

## After Completion:

Results will be in:
- `~/dev/reseller-intel/visual-analysis-results/` (JSON + CSV)
- `~/dev/reseller-intel/facility-images/` (satellite imagery)
- Database: `companies` table with 14 new columns

---

**Ready? Paste your Gemini key and run those commands! 🚀**
