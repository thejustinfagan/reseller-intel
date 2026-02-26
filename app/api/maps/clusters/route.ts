import { NextResponse } from "next/server";
import { searchNearbyResellers } from "@/services/maps";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get("location")?.trim() ?? "";
  const radiusStr = searchParams.get("radius") ?? "1600";
  const radius = parseInt(radiusStr, 10);

  if (!location) {
    return NextResponse.json({ error: "location query parameter is required." }, { status: 400 });
  }

  if (isNaN(radius) || radius <= 0) {
    return NextResponse.json({ error: "Invalid radius parameter." }, { status: 400 });
  }

  try {
    const result = await searchNearbyResellers(location, radius);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Cluster analysis error:", error);
    return NextResponse.json({ error: error.message || "Failed to perform cluster analysis." }, { status: 500 });
  }
}
