# SPEC: Enrichment QA Review UI
**Model: claude-sonnet-4-5**

## Goal
Add a QA review page to the existing reseller-intel Next.js app that lets Justin review AI-enriched company records one at a time and approve or flag them.

## Route
Add a new page at `/review` in the existing Next.js app.

---

## What the Card Shows

Each company gets a single card with these sections:

### Header
- Company name (large, bold)
- City, State
- Primary entity type (dealer / parts supplier / repair shop / etc)
- Confidence score as a colored badge:
  - 80-100 = green
  - 50-79 = yellow
  - 0-49 = red
- Confidence label (strong / weak / irrelevant)

### Brands Detected
- Horizontal pill list of brands_served array
- If empty: "None detected"

### Services
- Parts capabilities + service capabilities combined
- Pill list same style as brands

### Flags (boolean signals)
- Small icon badges for: mobile_service, fleet_focus, dot_inspection, roadside_service, leasing_rental, used_truck_sales, new_truck_sales
- Only show ones that are TRUE

### Evidence Snippets
- Show the evidence_snippets array as a list
- These explain WHY the score is what it is

### AI Analysis
- Full deep_analysis JSON rendered as readable text (not raw JSON)
- Collapsible section — collapsed by default, tap to expand

### Source
- company_detail_url as a tappable link (opens in new tab)

---

## Actions

Two large buttons at the bottom of the card:

- **Approve** (green) — marks record as qa_approved = true, qa_reviewed_at = now
- **Flag** (red) — marks record as qa_flagged = true, qa_reviewed_at = now, opens a small text input for a note

After either action — immediately load the next unreviewed enriched record.

---

## Navigation

- Show progress: "12 of 350 reviewed"
- Skip button (gray) — skips to next without marking
- Only show records where ai_analyzed_at IS NOT NULL
- Default order: lowest confidence_score first (most likely to have errors)

---

## Database Changes

Add these columns to the companies table:

```sql
ALTER TABLE companies ADD COLUMN qa_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE companies ADD COLUMN qa_flagged BOOLEAN DEFAULT FALSE;
ALTER TABLE companies ADD COLUMN qa_flag_note TEXT;
ALTER TABLE companies ADD COLUMN qa_reviewed_at TIMESTAMP;
```

---

## API Endpoints Needed

### GET /api/qa/next
Returns next unreviewed enriched record (ai_analyzed_at IS NOT NULL AND qa_reviewed_at IS NULL)
Ordered by confidence_score ASC (lowest first)
Returns: full company record

### GET /api/qa/stats
Returns: { total_enriched, total_reviewed, total_approved, total_flagged }

### POST /api/qa/approve
Body: { id: number }
Sets qa_approved = true, qa_reviewed_at = now

### POST /api/qa/flag
Body: { id: number, note: string }
Sets qa_flagged = true, qa_flag_note = note, qa_reviewed_at = now

### POST /api/qa/skip
Body: { id: number }
No DB change — just returns next record

---

## Design

- Mobile-first (Justin reviews on iPhone via Telegram screenshots or browser)
- Dark mode preferred
- Clean, minimal — no clutter
- Tailwind CSS (already in project)
- Single card centered on screen, full viewport height
- Swipe feel — after approve/flag the card transitions out and next one slides in

---

## Constraints

- Do NOT modify existing pages or API routes
- Use the existing SQLite DB at data/reseller-intel.db
- Use the existing Prisma setup if possible, otherwise raw sqlite3
- Keep it simple and shippable — no auth needed

---

## Deliverables

1. /app/review/page.tsx — the review page
2. /app/api/qa/next/route.ts — next record endpoint
3. /app/api/qa/stats/route.ts — stats endpoint
4. /app/api/qa/approve/route.ts
5. /app/api/qa/flag/route.ts
6. /app/api/qa/skip/route.ts
7. Migration SQL or script to add QA columns
8. Brief testing notes

## Acceptance Criteria

- /review loads and shows first unreviewed enriched company
- Card shows all fields listed above
- Approve button marks record and loads next
- Flag button opens note input, saves note, loads next
- Progress counter updates correctly
- Works on mobile viewport
