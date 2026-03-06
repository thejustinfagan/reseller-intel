import path from "path";
import { OEM_BRAND_CONFIGS, OEM_BRANDS } from "./oem-scrapers/brand-configs.ts";
import { runBrandScraper } from "./oem-scrapers/scraper.ts";
import type { BrandSlug, ScraperRunSummary } from "./oem-scrapers/types.ts";
import {
  ensureDirectory,
  logInfo,
  nowIso,
  parseScraperArgs,
  readJsonFile,
  writeJsonFile,
} from "./oem-scrapers/utils.ts";
import { runOemDealerImport } from "./import-oem-dealers.ts";

type OrchestrationState = {
  startedAt: string;
  updatedAt: string;
  completedBrands: BrandSlug[];
  summaries: ScraperRunSummary[];
  importDone: boolean;
};

type OrchestrationReport = {
  startedAt: string;
  finishedAt: string;
  dryRun: boolean;
  brands: string[];
  scraperSummaries: ScraperRunSummary[];
  totals: {
    sourcesProcessed: number;
    failedSources: number;
    discoveredSources: number;
    dealersExtracted: number;
  };
  importSummary: unknown;
  reportPath: string;
};

function hasFlag(flag: string): boolean {
  return process.argv.includes(`--${flag}`);
}

function getArg(flag: string, fallback: string): string {
  const idx = process.argv.indexOf(`--${flag}`);
  if (idx === -1) {
    return fallback;
  }

  const value = process.argv[idx + 1];
  if (!value || value.startsWith("--")) {
    return fallback;
  }

  return value;
}

function parseBrandSelection(): BrandSlug[] {
  const value = getArg("brands", "all").trim();
  if (!value || value === "all") {
    return OEM_BRANDS.map((entry) => entry.slug);
  }

  const requested = new Set(
    value
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter((item) => item.length > 0)
  );

  const selected = OEM_BRANDS.map((entry) => entry.slug).filter((slug) => requested.has(slug));
  return selected.length > 0 ? selected : OEM_BRANDS.map((entry) => entry.slug);
}

function createStateFilePath(): string {
  return path.resolve(process.cwd(), getArg("state-file", "data/oem-dealers/run-state.json"));
}

function createReportPath(): string {
  const override = getArg("report-file", "").trim();
  if (override) {
    return path.resolve(process.cwd(), override);
  }

  const timestamp = nowIso().replace(/[:.]/g, "-");
  return path.resolve(process.cwd(), "data/oem-dealers/reports", `oem-scrape-report-${timestamp}.json`);
}

function loadOrInitState(statePath: string, selectedBrands: BrandSlug[]): OrchestrationState {
  const loaded = readJsonFile<OrchestrationState>(statePath);
  if (!loaded || !Array.isArray(loaded.completedBrands) || !Array.isArray(loaded.summaries)) {
    return {
      startedAt: nowIso(),
      updatedAt: nowIso(),
      completedBrands: [],
      summaries: [],
      importDone: false,
    };
  }

  // Remove brands that are not part of current run selection.
  const allowed = new Set(selectedBrands);
  loaded.completedBrands = loaded.completedBrands.filter((slug) => allowed.has(slug));
  loaded.summaries = loaded.summaries.filter((summary) => allowed.has(summary.slug));
  loaded.updatedAt = nowIso();
  return loaded;
}

function sumBy(items: ScraperRunSummary[], pick: (item: ScraperRunSummary) => number): number {
  return items.reduce((total, item) => total + pick(item), 0);
}

async function main(): Promise<void> {
  const scraperArgs = parseScraperArgs();
  const selectedBrands = parseBrandSelection();
  const skipImport = hasFlag("skip-import");

  const statePath = createStateFilePath();
  const reportPath = createReportPath();

  ensureDirectory(path.dirname(statePath));
  ensureDirectory(path.dirname(reportPath));

  const state = loadOrInitState(statePath, selectedBrands);

  logInfo(
    "scrape-all-oem-dealers",
    `start dryRun=${scraperArgs.dryRun} brands=${selectedBrands.join(",")} skipImport=${skipImport}`
  );

  for (const slug of selectedBrands) {
    if (state.completedBrands.includes(slug) && scraperArgs.resume && !scraperArgs.reset) {
      logInfo("scrape-all-oem-dealers", `skipping ${slug}; already completed in state file`);
      continue;
    }

    const config = OEM_BRAND_CONFIGS[slug];
    if (!config) {
      continue;
    }

    const summary = await runBrandScraper(config, scraperArgs);

    state.completedBrands = [...new Set([...state.completedBrands, slug])];
    state.summaries = [...state.summaries.filter((item) => item.slug !== slug), summary];
    state.updatedAt = nowIso();

    if (!scraperArgs.dryRun) {
      writeJsonFile(statePath, state);
    }
  }

  let importSummary: unknown = null;
  if (!skipImport) {
    importSummary = await runOemDealerImport({
      dryRun: scraperArgs.dryRun,
      resume: scraperArgs.resume,
      reset: scraperArgs.reset,
      inputDir: scraperArgs.outputDir,
      stateFile: "data/oem-dealers/import-state.json",
      progressEvery: 25,
    });

    state.importDone = true;
    state.updatedAt = nowIso();

    if (!scraperArgs.dryRun) {
      writeJsonFile(statePath, state);
    }
  }

  const summaries = state.summaries.sort((a, b) => a.slug.localeCompare(b.slug));

  const report: OrchestrationReport = {
    startedAt: state.startedAt,
    finishedAt: nowIso(),
    dryRun: scraperArgs.dryRun,
    brands: selectedBrands,
    scraperSummaries: summaries,
    totals: {
      sourcesProcessed: sumBy(summaries, (item) => item.sourcesProcessed),
      failedSources: sumBy(summaries, (item) => item.failedSources),
      discoveredSources: sumBy(summaries, (item) => item.discoveredSources),
      dealersExtracted: sumBy(summaries, (item) => item.dealerCount),
    },
    importSummary,
    reportPath,
  };

  if (!scraperArgs.dryRun) {
    writeJsonFile(reportPath, report);
  }

  logInfo(
    "scrape-all-oem-dealers",
    `complete dealers=${report.totals.dealersExtracted} failedSources=${report.totals.failedSources} report=${reportPath}`
  );
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`[scrape-all-oem-dealers] fatal: ${message}`);
  process.exit(1);
});
