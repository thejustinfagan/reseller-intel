export type BrandSlug =
  | "peterbilt"
  | "freightliner"
  | "kenworth"
  | "international"
  | "mack"
  | "volvo";

export type OemBrandName =
  | "Peterbilt"
  | "Freightliner"
  | "Kenworth"
  | "International"
  | "Mack Trucks"
  | "Volvo Trucks";

export type ExtractionStrategy = "generic" | "nestedCountryStateDealersJson";

export interface BrandDataSource {
  url: string;
  extractionStrategy?: ExtractionStrategy;
  headers?: Record<string, string>;
}

export interface BrandScraperConfig {
  slug: BrandSlug;
  brand: OemBrandName;
  locatorUrl: string;
  seedUrls?: string[];
  dataSources?: BrandDataSource[];
  extractionStrategy?: ExtractionStrategy;
  defaultDealerType: string;
  headers?: Record<string, string>;
}

export interface ScrapedDealerRecord {
  companyName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  website: string;
  dealerType: string;
  brand: string;
  latitude: number | null;
  longitude: number | null;
  scrapedAt: string;
  sourceUrl: string;
}

export interface ScraperState {
  brand: BrandSlug;
  queue: string[];
  seen: string[];
  nextIndex: number;
  processed: number;
  fetched: number;
  failed: number;
  discovered: number;
  startedAt: string;
  updatedAt: string;
  errors: Array<{
    url: string;
    message: string;
    at: string;
  }>;
}

export interface ScraperRunOptions {
  dryRun: boolean;
  resume: boolean;
  reset: boolean;
  rateLimitPerMinute: number;
  outputDir: string;
  stateDir: string;
  maxSources: number;
  timeoutMs: number;
  verbose: boolean;
}

export interface ScraperRunSummary {
  slug: BrandSlug;
  brand: OemBrandName;
  locatorUrl: string;
  outputPath: string;
  statePath: string;
  dryRun: boolean;
  startedAt: string;
  finishedAt: string;
  sourcesProcessed: number;
  sourcesTotal: number;
  fetchedSources: number;
  failedSources: number;
  discoveredSources: number;
  dealerCount: number;
  errors: string[];
}

export interface ParsedArguments {
  dryRun: boolean;
  resume: boolean;
  reset: boolean;
  outputDir: string;
  stateDir: string;
  rateLimitPerMinute: number;
  maxSources: number;
  timeoutMs: number;
  verbose: boolean;
}
