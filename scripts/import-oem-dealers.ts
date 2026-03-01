import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { PrismaClient } from "@prisma/client";
import type { ScrapedDealerRecord } from "./oem-scrapers/types.ts";
import {
  cleanString,
  ensureDirectory,
  logError,
  logInfo,
  normalizeCompanyName,
  normalizePhone,
  normalizeState,
  normalizeZip,
  nowIso,
  readJsonFile,
  toPositiveInt,
  writeJsonFile,
} from "./oem-scrapers/utils.ts";

type DealerImportRecord = {
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
};

type ImportState = {
  startedAt: string;
  updatedAt: string;
  totalInput: number;
  deduped: number;
  processed: number;
  oemCreated: number;
  oemUpdated: number;
  serviceCentersCreated: number;
  serviceCentersUpdated: number;
  skipped: number;
  errors: string[];
};

type ImportOptions = {
  dryRun: boolean;
  resume: boolean;
  reset: boolean;
  inputDir: string;
  stateFile: string;
  progressEvery: number;
};

type ImportSummary = {
  dryRun: boolean;
  inputFiles: string[];
  totalInput: number;
  deduped: number;
  processed: number;
  oemCreated: number;
  oemUpdated: number;
  serviceCentersCreated: number;
  serviceCentersUpdated: number;
  skipped: number;
  errors: string[];
  stateFile: string;
};

const scope = "import-oem-dealers";

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

function parseOptions(): ImportOptions {
  return {
    dryRun: hasFlag("dry-run"),
    resume: !hasFlag("no-resume"),
    reset: hasFlag("reset"),
    inputDir: getArg("input-dir", "data/oem-dealers/raw"),
    stateFile: getArg("state-file", "data/oem-dealers/import-state.json"),
    progressEvery: toPositiveInt(getArg("progress-every", "25"), 25),
  };
}

function initialState(totalInput: number, deduped: number): ImportState {
  return {
    startedAt: nowIso(),
    updatedAt: nowIso(),
    totalInput,
    deduped,
    processed: 0,
    oemCreated: 0,
    oemUpdated: 0,
    serviceCentersCreated: 0,
    serviceCentersUpdated: 0,
    skipped: 0,
    errors: [],
  };
}

function mergeCsvValues(a: string, b: string): string {
  const values = new Set<string>();

  for (const raw of `${a},${b}`.split(",")) {
    const clean = cleanString(raw);
    if (clean) {
      values.add(clean);
    }
  }

  return [...values].sort((left, right) => left.localeCompare(right)).join(", ");
}

function normalizeIncomingRecord(raw: ScrapedDealerRecord): DealerImportRecord | null {
  const companyName = cleanString(raw.companyName);
  const city = cleanString(raw.city);
  const state = normalizeState(raw.state);

  if (!companyName || !city || !state) {
    return null;
  }

  return {
    companyName,
    address: cleanString(raw.address),
    city,
    state,
    zip: normalizeZip(raw.zip ?? ""),
    phone: normalizePhone(raw.phone ?? ""),
    website: cleanString(raw.website),
    dealerType: cleanString(raw.dealerType),
    brand: cleanString(raw.brand),
    latitude: typeof raw.latitude === "number" ? raw.latitude : null,
    longitude: typeof raw.longitude === "number" ? raw.longitude : null,
    scrapedAt: cleanString(raw.scrapedAt) || nowIso(),
  };
}

function readInputFiles(inputDir: string): { files: string[]; records: DealerImportRecord[] } {
  const absoluteDir = path.resolve(process.cwd(), inputDir);
  if (!fs.existsSync(absoluteDir)) {
    return { files: [], records: [] };
  }

  const files = fs
    .readdirSync(absoluteDir)
    .filter((name) => name.endsWith(".json"))
    .sort();

  const records: DealerImportRecord[] = [];

  for (const fileName of files) {
    const fullPath = path.join(absoluteDir, fileName);
    const parsed = readJsonFile<unknown>(fullPath);

    if (!Array.isArray(parsed)) {
      continue;
    }

    for (const row of parsed) {
      if (typeof row !== "object" || row === null) {
        continue;
      }

      const normalized = normalizeIncomingRecord(row as ScrapedDealerRecord);
      if (normalized) {
        records.push(normalized);
      }
    }
  }

  return {
    files: files.map((name) => path.join(absoluteDir, name)),
    records,
  };
}

function dedupeRecords(records: DealerImportRecord[]): DealerImportRecord[] {
  const deduped = new Map<string, DealerImportRecord>();

  for (const record of records) {
    const key = `${normalizeCompanyName(record.companyName)}|${normalizeZip(record.zip)}`;
    const existing = deduped.get(key);

    if (!existing) {
      deduped.set(key, { ...record });
      continue;
    }

    deduped.set(key, {
      ...existing,
      address: existing.address || record.address,
      city: existing.city || record.city,
      state: existing.state || record.state,
      zip: existing.zip || record.zip,
      phone: existing.phone || record.phone,
      website: existing.website || record.website,
      dealerType: mergeCsvValues(existing.dealerType, record.dealerType),
      brand: mergeCsvValues(existing.brand, record.brand),
      latitude: existing.latitude ?? record.latitude,
      longitude: existing.longitude ?? record.longitude,
      scrapedAt: existing.scrapedAt > record.scrapedAt ? existing.scrapedAt : record.scrapedAt,
    });
  }

  return [...deduped.values()].sort((a, b) => {
    const byCompany = a.companyName.localeCompare(b.companyName);
    if (byCompany !== 0) {
      return byCompany;
    }

    return a.zip.localeCompare(b.zip);
  });
}

async function processRecord(
  prisma: PrismaClient,
  record: DealerImportRecord,
  state: ImportState,
  dryRun: boolean
): Promise<void> {
  const normalizedName = normalizeCompanyName(record.companyName);
  if (!normalizedName) {
    state.skipped += 1;
    return;
  }

  if (dryRun) {
    state.oemCreated += 1;
    state.serviceCentersCreated += 1;
    return;
  }

  const existingOem = await prisma.oemDealer.findFirst({
    where: {
      companyName: record.companyName,
      zip: record.zip || null,
    },
  });

  if (existingOem) {
    await prisma.oemDealer.update({
      where: {
        id: existingOem.id,
      },
      data: {
        address: record.address || null,
        city: record.city,
        state: record.state,
        zip: record.zip || null,
        phone: record.phone || null,
        website: record.website || null,
        dealerType: record.dealerType || null,
        brand: record.brand,
        latitude: record.latitude,
        longitude: record.longitude,
        scrapedAt: new Date(record.scrapedAt),
      },
    });
    state.oemUpdated += 1;
  } else {
    await prisma.oemDealer.create({
      data: {
        companyName: record.companyName,
        address: record.address || null,
        city: record.city,
        state: record.state,
        zip: record.zip || null,
        phone: record.phone || null,
        website: record.website || null,
        dealerType: record.dealerType || null,
        brand: record.brand,
        latitude: record.latitude,
        longitude: record.longitude,
        scrapedAt: new Date(record.scrapedAt),
      },
    });
    state.oemCreated += 1;
  }

  let existingServiceCenter = await prisma.serviceCenter.findFirst({
    where: {
      normalizedName,
      zipCode: record.zip || null,
    },
  });

  if (!existingServiceCenter) {
    existingServiceCenter = await prisma.serviceCenter.findFirst({
      where: {
        normalizedName,
        city: record.city,
        state: record.state,
      },
    });
  }

  if (existingServiceCenter) {
    await prisma.serviceCenter.update({
      where: {
        id: existingServiceCenter.id,
      },
      data: {
        fullAddress: existingServiceCenter.fullAddress || record.address || null,
        city: existingServiceCenter.city || record.city,
        state: existingServiceCenter.state || record.state,
        zipCode: existingServiceCenter.zipCode || record.zip || null,
        primaryPhone: existingServiceCenter.primaryPhone || record.phone || null,
        companyDetailUrl: existingServiceCenter.companyDetailUrl || record.website || null,
        inputServiceType: mergeCsvValues(existingServiceCenter.inputServiceType ?? "", "OEM Dealer") || null,
        inputSubServiceType:
          mergeCsvValues(existingServiceCenter.inputSubServiceType ?? "", record.brand) || null,
      },
    });
    state.serviceCentersUpdated += 1;
  } else {
    await prisma.serviceCenter.create({
      data: {
        companyName: record.companyName,
        normalizedName,
        fullAddress: record.address || null,
        city: record.city,
        state: record.state,
        zipCode: record.zip || null,
        primaryPhone: record.phone || null,
        companyDetailUrl: record.website || null,
        inputServiceType: "OEM Dealer",
        inputSubServiceType: record.brand,
      },
    });
    state.serviceCentersCreated += 1;
  }
}

async function importOemDealers(options: ImportOptions): Promise<ImportSummary> {
  const { files, records } = readInputFiles(options.inputDir);
  const dedupedRecords = dedupeRecords(records);

  ensureDirectory(path.dirname(path.resolve(process.cwd(), options.stateFile)));

  const absoluteStateFile = path.resolve(process.cwd(), options.stateFile);
  const loadedState =
    options.resume && !options.reset
      ? readJsonFile<ImportState>(absoluteStateFile)
      : null;

  const state = loadedState ?? initialState(records.length, dedupedRecords.length);
  state.totalInput = records.length;
  state.deduped = dedupedRecords.length;
  state.updatedAt = nowIso();

  const startIndex = options.resume && !options.reset ? state.processed : 0;
  let prisma: PrismaClient | null = null;

  if (!options.dryRun) {
    prisma = new PrismaClient();
  }

  try {
    for (let index = startIndex; index < dedupedRecords.length; index += 1) {
      const record = dedupedRecords[index];
      if (!record) {
        continue;
      }

      try {
        if (prisma) {
          await processRecord(prisma, record, state, options.dryRun);
        } else {
          state.oemCreated += 1;
          state.serviceCentersCreated += 1;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        state.errors.push(`${record.companyName} (${record.zip}) :: ${message}`);
        state.skipped += 1;
      } finally {
        state.processed = index + 1;
        state.updatedAt = nowIso();

        if (!options.dryRun) {
          writeJsonFile(absoluteStateFile, state);
        }

        if (state.processed % options.progressEvery === 0 || state.processed === dedupedRecords.length) {
          logInfo(
            scope,
            `progress ${state.processed}/${dedupedRecords.length} oem(created=${state.oemCreated}, updated=${state.oemUpdated}) service_centers(created=${state.serviceCentersCreated}, updated=${state.serviceCentersUpdated}) skipped=${state.skipped}`
          );
        }
      }
    }
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }

  const summary: ImportSummary = {
    dryRun: options.dryRun,
    inputFiles: files,
    totalInput: records.length,
    deduped: dedupedRecords.length,
    processed: state.processed,
    oemCreated: state.oemCreated,
    oemUpdated: state.oemUpdated,
    serviceCentersCreated: state.serviceCentersCreated,
    serviceCentersUpdated: state.serviceCentersUpdated,
    skipped: state.skipped,
    errors: state.errors.slice(-20),
    stateFile: absoluteStateFile,
  };

  if (!options.dryRun) {
    writeJsonFile(absoluteStateFile, state);
  }

  return summary;
}

export async function runOemDealerImport(
  overrideOptions: Partial<ImportOptions> = {}
): Promise<ImportSummary> {
  const options = { ...parseOptions(), ...overrideOptions };

  logInfo(
    scope,
    `start dryRun=${options.dryRun} resume=${options.resume} reset=${options.reset} inputDir=${options.inputDir}`
  );

  const summary = await importOemDealers(options);
  logInfo(
    scope,
    `complete processed=${summary.processed}/${summary.deduped} oemCreated=${summary.oemCreated} oemUpdated=${summary.oemUpdated} serviceCentersCreated=${summary.serviceCentersCreated} serviceCentersUpdated=${summary.serviceCentersUpdated} skipped=${summary.skipped}`
  );

  if (summary.errors.length > 0) {
    logError(scope, `recent errors:\n- ${summary.errors.join("\n- ")}`);
  }

  return summary;
}

async function main(): Promise<void> {
  const summary = await runOemDealerImport();
  console.log(JSON.stringify(summary, null, 2));
}

function isDirectRun(): boolean {
  const scriptArg = process.argv[1];
  if (!scriptArg) {
    return false;
  }

  return import.meta.url === pathToFileURL(scriptArg).href;
}

if (isDirectRun()) {
  main().catch((error) => {
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    console.error(`[${scope}] fatal: ${message}`);
    process.exit(1);
  });
}
