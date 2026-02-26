import { NextResponse } from "next/server";
import { buildMapsImagery } from "@/services/maps";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get("location")?.trim() ?? "";

  if (!location) {
    return NextResponse.json({ error: "location query parameter is required." }, { status: 400 });
  }

  const imagery = buildMapsImagery(location);
  return NextResponse.json(imagery);
}
