import { NextResponse } from "next/server";
import { requireJwtAuth } from "@/lib/jwt";
import { EnrichmentServiceError, fetchServiceCenterEnrichment } from "@/services/enrichment";

type RouteContext = {
  params: {
    id: string;
  };
};

function parseServiceCenterId(rawId: string): number {
  const value = Number.parseInt(rawId, 10);
  if (!Number.isFinite(value) || value <= 0) {
    throw new EnrichmentServiceError("service center id must be a positive integer", 400, "INVALID_ID");
  }
  return value;
}

export async function GET(request: Request, context: RouteContext): Promise<NextResponse> {
  const auth = requireJwtAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const serviceCenterId = parseServiceCenterId(decodeURIComponent(context.params.id ?? "").trim());
    const data = await fetchServiceCenterEnrichment(serviceCenterId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof EnrichmentServiceError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Unable to fetch enrichment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
