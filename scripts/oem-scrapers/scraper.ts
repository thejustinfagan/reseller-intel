import path from "path";
import { extractFromResponse } from "./extract.ts";
import {
  createRateLimitedRequester,
  ensureDirectory,
  logError,
  logInfo,
  logWarn,
  makeDealerDedupeKey,
  nowIso,
  normalizeState,
  normalizeZip,
  readJsonFile,
  writeJsonFile,
} from "./utils.ts";
import type {
  BrandScraperConfig,
  ParsedArguments,
  ScrapedDealerRecord,
  ScraperRunOptions,
  ScraperRunSummary,
  ScraperState,
} from "./types.ts";

const DEFAULT_OPTIONS: ScraperRunOptions = {
  dryRun: false,
  resume: true,
  reset: false,
  rateLimitPerMinute: 10,
  outputDir: "data/oem-dealers/raw",
  stateDir: "data/oem-dealers/state",
  maxSources: 40,
  timeoutMs: 45_000,
  verbose: false,
};

function optionsFromArgs(args: ParsedArguments): ScraperRunOptions {
  return {
    dryRun: args.dryRun,
    resume: args.resume,
    reset: args.reset,
    rateLimitPerMinute: args.rateLimitPerMinute,
    outputDir: args.outputDir,
    stateDir: args.stateDir,
    maxSources: args.maxSources,
    timeoutMs: args.timeoutMs,
    verbose: args.verbose,
  };
}

function withDefaultOptions(overrides?: Partial<ScraperRunOptions>): ScraperRunOptions {
  return {
    ...DEFAULT_OPTIONS,
    ...(overrides ?? {}),
  };
}

function initialState(config: BrandScraperConfig): ScraperState {
  return {
    brand: config.slug,
    queue: [config.locatorUrl, ...(config.seedUrls ?? [])],
    seen: [],
    nextIndex: 0,
    processed: 0,
    fetched: 0,
    failed: 0,
    discovered: 0,
    startedAt: nowIso(),
    updatedAt: nowIso(),
    errors: [],
  };
}

function sanitizeDealer(record: ScrapedDealerRecord, config: BrandScraperConfig): ScrapedDealerRecord | null {
  const companyName = record.companyName.trim();
  const city = record.city.trim();
  const state = normalizeState(record.state);

  if (!companyName || !city || !state) {
    return null;
  }

  const zip = normalizeZip(record.zip);

  return {
    companyName,
    address: record.address.trim(),
    city,
    state,
    zip,
    phone: record.phone.trim(),
    website: record.website.trim(),
    dealerType: record.dealerType.trim() || config.defaultDealerType,
    brand: config.brand,
    latitude: record.latitude,
    longitude: record.longitude,
    scrapedAt: record.scrapedAt,
    sourceUrl: record.sourceUrl,
  };
}

function dedupeDealers(
  map: Map<string, ScrapedDealerRecord>,
  records: ScrapedDealerRecord[],
  config: BrandScraperConfig
): number {
  let inserted = 0;

  for (const record of records) {
    const sanitized = sanitizeDealer(record, config);
    if (!sanitized) {
      continue;
    }

    const key = makeDealerDedupeKey(
      sanitized.companyName,
      sanitized.zip,
      sanitized.city,
      sanitized.state
    );

    const existing = map.get(key);
    if (!existing) {
      map.set(key, sanitized);
      inserted += 1;
      continue;
    }

    // Keep the richer record if duplicate data is discovered from another endpoint.
    map.set(key, {
      ...existing,
      address: existing.address || sanitized.address,
      phone: existing.phone || sanitized.phone,
      website: existing.website || sanitized.website,
      dealerType: existing.dealerType || sanitized.dealerType,
      latitude: existing.latitude ?? sanitized.latitude,
      longitude: existing.longitude ?? sanitized.longitude,
      sourceUrl: existing.sourceUrl || sanitized.sourceUrl,
      scrapedAt: existing.scrapedAt || sanitized.scrapedAt,
    });
  }

  return inserted;
}

function loadExistingDealers(outputPath: string, enabled: boolean): ScrapedDealerRecord[] {
  if (!enabled) {
    return [];
  }

  const parsed = readJsonFile<unknown>(outputPath);
  if (!Array.isArray(parsed)) {
    return [];
  }

  const result: ScrapedDealerRecord[] = [];
  for (const item of parsed) {
    if (typeof item === "object" && item !== null) {
      const record = item as Partial<ScrapedDealerRecord>;
      if (typeof record.companyName === "string" && typeof record.city === "string" && typeof record.state === "string") {
        result.push({
          companyName: record.companyName,
          address: record.address ?? "",
          city: record.city,
          state: record.state,
          zip: record.zip ?? "",
          phone: record.phone ?? "",
          website: record.website ?? "",
          dealerType: record.dealerType ?? "",
          brand: record.brand ?? "",
          latitude: typeof record.latitude === "number" ? record.latitude : null,
          longitude: typeof record.longitude === "number" ? record.longitude : null,
          scrapedAt: record.scrapedAt ?? nowIso(),
          sourceUrl: record.sourceUrl ?? "",
        });
      }
    }
  }

  return result;
}

function normalizeDiscoveredUrl(candidate: string, locatorUrl: string): string | null {
  let resolved: URL;
  try {
    resolved = new URL(candidate);
  } catch {
    return null;
  }

  const locatorHost = new URL(locatorUrl).hostname.replace(/^www\./, "");
  const candidateHost = resolved.hostname.replace(/^www\./, "");

  if (candidateHost !== locatorHost) {
    return null;
  }

  if (!["http:", "https:"].includes(resolved.protocol)) {
    return null;
  }

  return resolved.toString();
}

async function fetchText(params: {
  url: string;
  timeoutMs: number;
  headers?: Record<string, string>;
}): Promise<{ body: string; contentType: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), params.timeoutMs);

  try {
    const response = await fetch(params.url, {
      method: "GET",
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; reseller-intel-oem-scraper/1.0; +https://example.com/bot)",
        accept: "text/html,application/json;q=0.9,*/*;q=0.8",
        ...(params.headers ?? {}),
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    const body = await response.text();
    return { body, contentType: contentType.toLowerCase() };
  } finally {
    clearTimeout(timeout);
  }
}

export async function runBrandScraper(
  config: BrandScraperConfig,
  argOptions?: ParsedArguments,
  overrideOptions?: Partial<ScraperRunOptions>
): Promise<ScraperRunSummary> {
  const fromArgs = argOptions ? optionsFromArgs(argOptions) : DEFAULT_OPTIONS;
  const options = withDefaultOptions({ ...fromArgs, ...(overrideOptions ?? {}) });
  const scope = `oem-scraper:${config.slug}`;

  const outputPath = path.resolve(process.cwd(), options.outputDir, `${config.slug}.json`);
  const statePath = path.resolve(process.cwd(), options.stateDir, `${config.slug}.state.json`);

  ensureDirectory(path.dirname(outputPath));
  ensureDirectory(path.dirname(statePath));

  const startedAt = nowIso();
  logInfo(
    scope,
    `start dryRun=${options.dryRun} resume=${options.resume} reset=${options.reset} rpm=${options.rateLimitPerMinute}`
  );

  const loadedState =
    options.resume && !options.reset && !options.dryRun
      ? readJsonFile<ScraperState>(statePath)
      : null;

  const state = loadedState && loadedState.brand === config.slug ? loadedState : initialState(config);

  if (!state.queue.includes(config.locatorUrl)) {
    state.queue.unshift(config.locatorUrl);
  }

  state.updatedAt = nowIso();

  const existingDealers = loadExistingDealers(outputPath, options.resume && !options.reset && !options.dryRun);
  const dealerMap = new Map<string, ScrapedDealerRecord>();
  dedupeDealers(dealerMap, existingDealers, config);

  const limitRequest = createRateLimitedRequester(options.rateLimitPerMinute);
  const maxQueueSize = Math.max(options.maxSources, state.queue.length);

  while (state.nextIndex < state.queue.length && state.processed < options.maxSources) {
    const sourceUrl = state.queue[state.nextIndex];
    state.nextIndex += 1;

    if (!sourceUrl) {
      continue;
    }

    if (state.seen.includes(sourceUrl)) {
      continue;
    }

    if (options.verbose) {
      logInfo(scope, `fetching ${sourceUrl}`);
    }

    try {
      const fetched = await limitRequest(() =>
        fetchText({
          url: sourceUrl,
          timeoutMs: options.timeoutMs,
          headers: config.headers,
        })
      );

      state.fetched += 1;

      const scrapedAt = nowIso();
      const extracted = extractFromResponse({
        body: fetched.body,
        contentType: fetched.contentType,
        sourceUrl,
        brand: config.brand,
        defaultDealerType: config.defaultDealerType,
        scrapedAt,
      });

      const addedDealers = dedupeDealers(dealerMap, extracted.dealers, config);
      const discoveredUrls: string[] = [];

      for (const candidate of extracted.discoveredUrls) {
        const normalized = normalizeDiscoveredUrl(candidate, config.locatorUrl);
        if (!normalized) {
          continue;
        }

        if (state.seen.includes(normalized) || state.queue.includes(normalized)) {
          continue;
        }

        if (state.queue.length >= maxQueueSize) {
          break;
        }

        state.queue.push(normalized);
        state.discovered += 1;
        discoveredUrls.push(normalized);
      }

      if (options.verbose) {
        logInfo(
          scope,
          `parsed dealers=${extracted.dealers.length} added=${addedDealers} discovered=${discoveredUrls.length}`
        );
      }
    } catch (error) {
      state.failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      logWarn(scope, `failed ${sourceUrl}: ${message}`);
      state.errors.push({
        url: sourceUrl,
        message,
        at: nowIso(),
      });
    } finally {
      state.seen.push(sourceUrl);
      state.processed += 1;
      state.updatedAt = nowIso();

      if (!options.dryRun) {
        writeJsonFile(statePath, state);
      }
    }
  }

  const dealers = [...dealerMap.values()].sort((a, b) => {
    const byState = a.state.localeCompare(b.state);
    if (byState !== 0) {
      return byState;
    }

    const byCity = a.city.localeCompare(b.city);
    if (byCity !== 0) {
      return byCity;
    }

    return a.companyName.localeCompare(b.companyName);
  });

  if (!options.dryRun) {
    writeJsonFile(outputPath, dealers);
  }

  const finishedAt = nowIso();
  const summary: ScraperRunSummary = {
    slug: config.slug,
    brand: config.brand,
    locatorUrl: config.locatorUrl,
    outputPath,
    statePath,
    dryRun: options.dryRun,
    startedAt,
    finishedAt,
    sourcesProcessed: state.processed,
    sourcesTotal: state.queue.length,
    fetchedSources: state.fetched,
    failedSources: state.failed,
    discoveredSources: state.discovered,
    dealerCount: dealers.length,
    errors: state.errors.slice(-10).map((entry) => `${entry.url} :: ${entry.message}`),
  };

  logInfo(
    scope,
    `complete dealers=${summary.dealerCount} processedSources=${summary.sourcesProcessed}/${summary.sourcesTotal} failures=${summary.failedSources}`
  );

  if (summary.failedSources > 0 && options.verbose) {
    logError(scope, `recent errors:\n- ${summary.errors.join("\n- ")}`);
  }

  return summary;
}
