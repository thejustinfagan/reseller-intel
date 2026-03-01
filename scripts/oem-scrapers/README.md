# OEM Dealer Scrapers

OEM scraper system for Priority 1 truck brands:
- Peterbilt
- Freightliner
- Kenworth
- International
- Mack Trucks
- Volvo Trucks

## Directory Structure

- `brand-configs.ts`: Brand metadata and locator URLs
- `extract.ts`: JSON/HTML extraction heuristics for dealer data
- `scraper.ts`: Shared scraper runtime (rate limiting, resume, queueing, error handling)
- `types.ts`: Shared TypeScript types
- `utils.ts`: CLI parsing, normalization, file helpers
- `peterbilt.ts`: Brand-specific entrypoint
- `freightliner.ts`: Brand-specific entrypoint
- `kenworth.ts`: Brand-specific entrypoint
- `international.ts`: Brand-specific entrypoint
- `mack.ts`: Brand-specific entrypoint
- `volvo.ts`: Brand-specific entrypoint

## Data Output

Default output paths:
- Raw scraper output: `data/oem-dealers/raw/<brand>.json`
- Scraper state (resume checkpoints): `data/oem-dealers/state/<brand>.state.json`
- Orchestration state: `data/oem-dealers/run-state.json`
- Import state: `data/oem-dealers/import-state.json`
- Run reports: `data/oem-dealers/reports/oem-scrape-report-<timestamp>.json`

## Features

- **Rate limiting**: Enforced per brand via `--rpm` (default `10` requests/minute)
- **Resume capability**: Persists scraper queue/index state and can continue interrupted runs
- **Error handling**: Per-source failure capture; scraper continues after recoverable errors
- **Dry-run mode**: Full extraction/import simulation with no DB writes

## Commands

Run one brand:

```bash
node --experimental-strip-types scripts/oem-scrapers/peterbilt.ts --dry-run --verbose
```

Run all six + import:

```bash
node --experimental-strip-types scripts/scrape-all-oem-dealers.ts --dry-run --verbose
```

Import only (from existing raw JSON):

```bash
node --experimental-strip-types scripts/import-oem-dealers.ts --dry-run
```

## Common Flags

- `--dry-run`: Skip DB writes and output persistence where applicable
- `--reset`: Ignore prior state and start from scratch
- `--no-resume`: Do not read state files
- `--verbose`: Detailed per-source logs
- `--rpm <n>`: Requests per minute (default `10`)
- `--max-sources <n>`: Max sources per brand crawl pass (default `40`)
- `--timeout-ms <n>`: Per-request timeout in milliseconds (default `45000`)
- `--output-dir <path>`: Raw output directory
- `--state-dir <path>`: Scraper state directory

Orchestration flags:
- `--brands peterbilt,freightliner,...`: Run subset (default all)
- `--skip-import`: Scrape only, skip import pipeline
- `--report-file <path>`: Override report output path
