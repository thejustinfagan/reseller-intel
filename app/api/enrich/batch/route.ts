import { NextResponse } from "next/server";
import { requireJwtAuth } from "@/lib/jwt";
import { enrichBatch } from "@/services/enrichment";

type BatchBody = {
  serviceCenterIds?: unknown;
  limit?: unknown;
  includeFacility?: unknown;
};

const MAX_BATCH_SIZE = 50;

function toIdArray(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => (typeof entry === "number" ? entry : Number.parseInt(String(entry), 10)))
    .filter((entry) => Number.isFinite(entry) && entry > 0)
    .map((entry) => Math.floor(entry));
}

export async function POST(request: Request): Promise<NextResponse> {
  const auth = requireJwtAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => null)) as BatchBody | null;
  const ids = toIdArray(body?.serviceCenterIds);

  if (ids.length === 0) {
    return NextResponse.json(
      { error: "serviceCenterIds must be a non-empty array of positive integers." },
      { status: 400 }
    );
  }

  const requestedLimit =
    typeof body?.limit === "number" && Number.isFinite(body.limit)
      ? Math.max(1, Math.floor(body.limit))
      : ids.length;
  const finalLimit = Math.min(requestedLimit, MAX_BATCH_SIZE);
  const batchIds = ids.slice(0, finalLimit);

  const includeFacility = body?.includeFacility !== false;

  try {
    const results = await enrichBatch(batchIds, includeFacility);
    const successCount = results.filter((entry) => entry.success).length;

    return NextResponse.json({
      success: true,
      requested: ids.length,
      processed: batchIds.length,
      includeFacility,
      successCount,
      failureCount: batchIds.length - successCount,
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Batch enrichment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
