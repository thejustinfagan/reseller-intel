import fs from "fs";
import path from "path";
import type { ParsedArguments } from "./types.ts";

const STATE_MAP: Record<string, string> = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY",
  "district of columbia": "DC",
};

const args = process.argv.slice(2);

function getArgValue(flagName: string): string | null {
  const flag = `--${flagName}`;
  const idx = args.indexOf(flag);
  if (idx === -1) {
    return null;
  }

  const value = args[idx + 1];
  if (!value || value.startsWith("--")) {
    return null;
  }

  return value;
}

function hasFlag(flagName: string): boolean {
  return args.includes(`--${flagName}`);
}

export function parseScraperArgs(): ParsedArguments {
  const outputDir = getArgValue("output-dir") ?? "data/oem-dealers/raw";
  const stateDir = getArgValue("state-dir") ?? "data/oem-dealers/state";
  const rpm = toPositiveInt(getArgValue("rpm"), 10);
  const maxSources = toPositiveInt(getArgValue("max-sources"), 40);
  const timeoutMs = toPositiveInt(getArgValue("timeout-ms"), 45_000);

  return {
    dryRun: hasFlag("dry-run"),
    resume: !hasFlag("no-resume"),
    reset: hasFlag("reset"),
    outputDir,
    stateDir,
    rateLimitPerMinute: rpm,
    maxSources,
    timeoutMs,
    verbose: hasFlag("verbose"),
  };
}

export function toPositiveInt(rawValue: string | null, fallback: number): number {
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export function logInfo(scope: string, message: string): void {
  console.log(`[${scope}] ${message}`);
}

export function logWarn(scope: string, message: string): void {
  console.warn(`[${scope}] ${message}`);
}

export function logError(scope: string, message: string): void {
  console.error(`[${scope}] ${message}`);
}

export function ensureDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function readJsonFile<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJsonFile(filePath: string, value: unknown): void {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeCompanyName(value: string): string {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeZip(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length >= 5) {
    return digits.slice(0, 5);
  }
  return value.trim();
}

export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return normalizeWhitespace(value);
}

export function normalizeState(value: string): string {
  const clean = normalizeWhitespace(value).toLowerCase();
  if (!clean) {
    return "";
  }

  if (clean.length === 2) {
    return clean.toUpperCase();
  }

  return STATE_MAP[clean] ?? clean.toUpperCase().slice(0, 2);
}

export function cleanString(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  return normalizeWhitespace(value);
}

export function maybeAbsoluteUrl(candidate: string, baseUrl: string): string | null {
  try {
    return new URL(candidate, baseUrl).toString();
  } catch {
    return null;
  }
}

export function makeDealerDedupeKey(companyName: string, zip: string, city: string, state: string): string {
  const company = normalizeCompanyName(companyName);
  const zipPart = normalizeZip(zip);
  const cityPart = normalizeWhitespace(city).toLowerCase();
  const statePart = normalizeState(state);
  return `${company}|${zipPart}|${cityPart}|${statePart}`;
}

export function createRateLimitedRequester(rpm: number): <T>(fn: () => Promise<T>) => Promise<T> {
  const safeRpm = Math.max(1, rpm);
  const minIntervalMs = Math.ceil(60_000 / safeRpm);
  let lastRequestStartedAt = 0;

  return async <T>(fn: () => Promise<T>): Promise<T> => {
    const now = Date.now();
    const elapsed = now - lastRequestStartedAt;
    if (elapsed < minIntervalMs) {
      await sleep(minIntervalMs - elapsed);
    }

    lastRequestStartedAt = Date.now();
    return fn();
  };
}

export function hasLocationKeyword(value: string): boolean {
  const lowered = value.toLowerCase();
  return (
    lowered.includes("dealer") ||
    lowered.includes("dealers") ||
    lowered.includes("locator") ||
    lowered.includes("location") ||
    lowered.includes("locations") ||
    lowered.includes("branch") ||
    lowered.includes("api")
  );
}
