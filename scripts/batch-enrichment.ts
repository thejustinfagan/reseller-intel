#!/usr/bin/env npx tsx
import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { enrichFacilityForServiceCenter, enrichServiceCenter } from "../services/enrichment.ts";

type BatchState = {
  date: string;
  count: number;
  lastServiceCenterId: number;
  processed: number;
  success: number;
  failed: number;
};

const args = process.argv.slice(2);

function hasFlag(flag: string): boolean {
  return args.includes(flag);
}

function getArg(name: string, fallback: string): string {
  const index = args.indexOf(`--${name}`);
  if (index === -1) {
    return fallback;
  }

  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    return fallback;
  }

  return value;
}

function toPositiveInt(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadState(statePath: string): BatchState {
  const initial: BatchState = {
    date: todayISO(),
    count: 0,
    lastServiceCenterId: 0,
    processed: 0,
    success: 0,
    failed: 0,
  };

  if (!fs.existsSync(statePath)) {
    return initial;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(statePath, "utf8")) as Partial<BatchState>;
    if (parsed.date !== initial.date) {
      return initial;
    }

    return {
      date: initial.date,
      count: Number.isFinite(parsed.count) ? Number(parsed.count) : 0,
      lastServiceCenterId: Number.isFinite(parsed.lastServiceCenterId)
        ? Number(parsed.lastServiceCenterId)
        : 0,
      processed: Number.isFinite(parsed.processed) ? Number(parsed.processed) : 0,
      success: Number.isFinite(parsed.success) ? Number(parsed.success) : 0,
      failed: Number.isFinite(parsed.failed) ? Number(parsed.failed) : 0,
    };
  } catch {
    return initial;
  }
}

function saveState(statePath: string, state: BatchState): void {
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
}

async function main(): Promise<void> {
  const rpm = toPositiveInt(getArg("rpm", "10"), 10);
  const dailyCap = toPositiveInt(getArg("daily-cap", "750"), 750);
  const limitRaw = getArg("limit", "0");
  const limit = toPositiveInt(limitRaw, 0);
  const dryRun = hasFlag("--dry-run");
  const includeFacility = !hasFlag("--google-only");
  const delayMs = Math.ceil(60_000 / rpm);

  const statePath = path.resolve(process.cwd(), getArg("state-file", "data/batch-state.json"));
  const dataDir = path.dirname(statePath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const state = loadState(statePath);
  const maxToProcess = limit > 0 ? limit : Number.POSITIVE_INFINITY;

  console.log(`[batch-enrichment] start date=${state.date} dailyCount=${state.count}/${dailyCap}`);
  console.log(
    `[batch-enrichment] config rpm=${rpm} delayMs=${delayMs} limit=${limit || "none"} dryRun=${dryRun} includeFacility=${includeFacility}`
  );

  if (state.count >= dailyCap) {
    console.log(`[batch-enrichment] daily cap already reached (${state.count}/${dailyCap}).`);
    return;
  }

  const db = new Database(path.resolve(process.cwd(), "data/reseller-intel.db"), {
    readonly: true,
  });
  let keepGoing = true;

  try {
    while (keepGoing && state.count < dailyCap && state.processed < maxToProcess) {
      const remainingByLimit = Number.isFinite(maxToProcess)
        ? Math.max(0, Math.floor(maxToProcess - state.processed))
        : 100;
      const fetchSize = Math.max(1, Math.min(100, remainingByLimit));

      const serviceCenters = db
        .prepare(
          `
          SELECT id, company_name
          FROM companies
          WHERE id > ?
          ORDER BY id ASC
          LIMIT ?
          `
        )
        .all(state.lastServiceCenterId, fetchSize) as Array<{ id: number; company_name: string }>;

      if (serviceCenters.length === 0) {
        console.log("[batch-enrichment] no more service centers to process.");
        break;
      }

      for (const serviceCenter of serviceCenters) {
        if (state.count >= dailyCap || state.processed >= maxToProcess) {
          keepGoing = false;
          break;
        }

        const prefix = `[${state.processed + 1}] center=${serviceCenter.id} "${serviceCenter.company_name}"`;
        try {
          if (dryRun) {
            console.log(`${prefix} dry-run`);
          } else {
            await enrichServiceCenter(serviceCenter.id);
            if (includeFacility) {
              await enrichFacilityForServiceCenter(serviceCenter.id);
            }
            console.log(`${prefix} success`);
          }

          state.success += 1;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`${prefix} failed: ${message}`);
          state.failed += 1;
        } finally {
          state.lastServiceCenterId = serviceCenter.id;
          state.count += 1;
          state.processed += 1;
          saveState(statePath, state);
        }

        if (!dryRun && state.count < dailyCap && state.processed < maxToProcess) {
          await sleep(delayMs);
        }
      }
    }
  } finally {
    db.close();
  }

  console.log(
    `[batch-enrichment] complete processed=${state.processed} success=${state.success} failed=${state.failed} dailyCount=${state.count}/${dailyCap}`
  );
  console.log(`[batch-enrichment] state saved to ${statePath}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`[batch-enrichment] fatal: ${message}`);
  process.exit(1);
});
