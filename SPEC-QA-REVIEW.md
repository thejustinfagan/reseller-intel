# SPEC: Prospect Intel Card — Swipe QA Review
**Model: claude-sonnet-4-5**

## Concept
Tinder for truck parts prospects. A sales rep has 30 seconds to decide if this company is worth a call. The card gives them everything they need to make that call — visual, dense, no fluff. Swipe right (approve) or left (flag).

## Route
New page at `/review` in the existing Next.js app.

---

## Card Layout (Mobile-first, full viewport)

### 1. VISUAL HEADER (top 35% of card)
- **Satellite image** full-width — pulled from satellite_image_url in DB
- If no satellite image: Google Maps Static API embed using lat/lon
- If no lat/lon: street view placeholder with address
- Overlaid bottom-left: facility_type badge (e.g. "SERVICE CENTER", "DEALER LOT", "RURAL SHOP")
- Overlaid bottom-right: lot_organized + has_fencing indicators as small icons

### 2. IDENTITY BLOCK
- Company name (large, bold)
- City, State — with highway/urban/rural/suburban tag derived from location data
- Primary entity type as colored badge (dealer=blue, repair=orange, parts=purple, unknown=gray)
- One-liner AI verdict: pulled from deep_analysis, the single most important thing a sales rep needs to know. Max 2 sentences.

### 3. OPPORTUNITY SCORE
- Large number 0-100 with color ring (red/yellow/green)
- Confidence label underneath (strong / weak / irrelevant)
- is_target_account: YES / NO in bold

### 4. PROPERTY INTEL (icon grid, 2 columns)
- Acreage: facility_size_acres
- Bays: bay_count
- Trucks visible: trucks_visible
- Trailers visible: trailers_visible
- Building condition: building_condition (1-5 stars)
- Cleanliness: cleanliness_score (1-5 stars)
- Signage: has_signage (yes/no)
- Fenced: has_fencing (yes/no)
- Building count: building_count
- If any field is null: show "—" not blank

### 5. DIGITAL PRESENCE (horizontal scorecard)
Five columns, each with an icon and status dot (green=active, yellow=weak, red=dead/none):
- Website (globe icon) — link to company website, quality inferred from deep_analysis
- Google (G icon) — rating + review_count
- Facebook (F icon) — active / none (infer from deep_analysis or features)
- Instagram (camera icon) — active / none
- LinkedIn (in icon) — active / none

### 6. WHAT THEY DO (two pill rows)
Row 1 — Brands: brands_served as colored pills
Row 2 — Services: parts_capabilities + service_capabilities combined

### 7. CAPABILITY FLAGS (icon strip)
Small icon badges, only show TRUE ones:
- 🚚 Mobile service
- 🏢 Fleet focus
- 🔍 DOT inspection
- 🛣 Roadside service
- 📋 Leasing/rental
- 🔄 Used truck sales
- ✨ New truck sales

### 8. EVIDENCE (collapsible)
- "Why this score?" toggle
- Shows evidence_snippets list
- Collapsed by default

### 9. QUICK ACTIONS (sticky bottom bar)
- 📞 Call button (tap to call primary_phone)
- 🌐 Website button (opens company_detail_url)
- 📍 Maps button (opens Google Maps with address)

---

## SWIPE ACTIONS

Large buttons above the action bar:

- **✓ APPROVE** (green, right) — marks qa_approved = true, loads next card
- **✗ FLAG** (red, left) — opens a bottom sheet with:
  - Pre-set flag reasons: "Wrong business type" / "Closed/moved" / "Bad data" / "Not a prospect"
  - Optional free text note
  - Submit → marks qa_flagged = true, saves note, loads next card
- **→ SKIP** (gray, center small) — no action, loads next

Card transition: slide out left (flag) or right (approve), next card slides in.

---

## CARD ORDER

Default: confidence_score ASC (lowest first — most likely to have errors, needs most QA)
Toggle to sort by: highest score, most recent enrichment, alphabetical

---

## PROGRESS BAR
Sticky top: "47 / 350 reviewed" with a thin progress bar

---

## DATABASE CHANGES

```sql
ALTER TABLE companies ADD COLUMN qa_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE companies ADD COLUMN qa_flagged BOOLEAN DEFAULT FALSE;
ALTER TABLE companies ADD COLUMN qa_flag_note TEXT;
ALTER TABLE companies ADD COLUMN qa_reviewed_at TIMESTAMP;
```

Run this as a migration script before the app starts.

---

## API ENDPOINTS

### GET /api/qa/next?sort=asc
Returns next unreviewed enriched record
Only records where: ai_analyzed_at IS NOT NULL AND qa_reviewed_at IS NULL
Returns full company record including all enrichment fields

### GET /api/qa/stats
Returns: { total_enriched, total_reviewed, total_approved, total_flagged, remaining }

### POST /api/qa/approve
Body: { id: number }
Sets qa_approved = true, qa_reviewed_at = now

### POST /api/qa/flag
Body: { id: number, reason: string, note?: string }
Sets qa_flagged = true, qa_flag_note = reason + note, qa_reviewed_at = now

### POST /api/qa/skip
Body: { id: number }
No DB change, returns next record

---

## DESIGN DIRECTION

- Dark background (#0f0f0f or deep navy)
- Cards feel like a premium intel briefing — not a form
- Satellite image is the hero, takes up real estate
- Data is dense but scannable — icons + numbers, not labels + text fields
- Green/yellow/red color system throughout for instant signal
- Mobile viewport primary (390px wide)
- Swipe gestures if feasible (react-swipeable or framer-motion), fallback to buttons
- Typography: large for key numbers, small tight for detail rows
- Tailwind CSS — already in project

---

## TECH NOTES

- Use existing SQLite DB at data/reseller-intel.db
- Use existing Prisma setup if schema supports it, otherwise raw better-sqlite3
- Do NOT modify existing pages or routes
- Google Maps Static API for satellite fallback — use free tier, no key needed for low volume
- Keep bundle small — no heavy chart libraries needed

---

## DELIVERABLES

1. /app/review/page.tsx — main review page
2. /app/review/components/ProspectCard.tsx — the card component
3. /app/review/components/FlagSheet.tsx — flag bottom sheet
4. /app/api/qa/next/route.ts
5. /app/api/qa/stats/route.ts
6. /app/api/qa/approve/route.ts
7. /app/api/qa/flag/route.ts
8. /app/api/qa/skip/route.ts
9. /scripts/migrate-qa-columns.ts — run once to add columns
10. Brief testing notes in TESTING-QA.md

---

## ACCEPTANCE CRITERIA

- /review loads, shows first unreviewed enriched company
- Satellite image or map renders at top
- All data blocks visible and populated (nulls show "—")
- Approve slides card out right, loads next
- Flag opens bottom sheet, saves reason, slides card out left, loads next
- Skip loads next with no DB change
- Progress bar updates correctly
- Works on 390px mobile viewport
- Looks like a war room intel card, not a form
