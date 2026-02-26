import { env, requireEnvValue } from "../lib/env.ts";
import { buildSatelliteImagery } from "./satelliteImagery.ts";
import type { FacilityAnalysisData } from "../types/enrichment.ts";

type FacilityAnalysisContext = {
  serviceCenterId: number;
  companyName: string;
  address: string;
  lat?: number;
  lng?: number;
};

type PartialFacilityResponse = {
  facilityType?: unknown;
  yardSize?: unknown;
  estimatedBays?: unknown;
  trucksVisible?: unknown;
  trailersVisible?: unknown;
  equipmentSummary?: unknown;
  activityLevel?: unknown;
  confidence?: unknown;
  salesIntel?: unknown;
  surroundingArea?: unknown;
};

function toNullableString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized || null;
}

function toNullableInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.round(parsed));
    }
  }

  return null;
}

function sanitizeFacilityPayload(payload: PartialFacilityResponse, rawText: string): FacilityAnalysisData {
  const confidence = toNullableString(payload.confidence)?.toLowerCase();
  const yardSizeValue = toNullableString(payload.yardSize);
  const activityLevelValue = toNullableString(payload.activityLevel);
  const yardSize = yardSizeValue ? yardSizeValue.toLowerCase() : null;
  const activityLevel = activityLevelValue ? activityLevelValue.toLowerCase() : null;

  return {
    facilityType: toNullableString(payload.facilityType),
    yardSize,
    estimatedBays: toNullableInteger(payload.estimatedBays),
    trucksVisible: toNullableInteger(payload.trucksVisible),
    trailersVisible: toNullableInteger(payload.trailersVisible),
    equipmentSummary: toNullableString(payload.equipmentSummary),
    activityLevel,
    confidence: confidence && ["high", "medium", "low"].includes(confidence) ? confidence : confidence ?? null,
    salesIntel: toNullableString(payload.salesIntel),
    surroundingArea: toNullableString(payload.surroundingArea),
    rawText: rawText.trim() || null,
  };
}

function extractJsonObject(text: string): PartialFacilityResponse | null {
  const normalized = text.trim();
  if (!normalized) {
    return null;
  }

  const codeBlockMatch = normalized.match(/```json\s*([\s\S]*?)```/i);
  const candidate = codeBlockMatch ? codeBlockMatch[1] : normalized;

  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  const jsonText = candidate.slice(firstBrace, lastBrace + 1);
  try {
    const parsed = JSON.parse(jsonText) as PartialFacilityResponse;
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

function parseFallbackText(rawText: string): PartialFacilityResponse {
  const text = rawText.toLowerCase();

  const extract = (pattern: RegExp): string | undefined => {
    const match = rawText.match(pattern);
    return match?.[1]?.trim();
  };
  const extractNumber = (pattern: RegExp): number | undefined => {
    const value = extract(pattern);
    if (!value) {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const confidenceMatch =
    /\bconfidence\b/.test(text) && /\bhigh\b/.test(text)
      ? "high"
      : /\bconfidence\b/.test(text) && /\bmedium\b/.test(text)
      ? "medium"
      : /\bconfidence\b/.test(text) && /\blow\b/.test(text)
      ? "low"
      : undefined;

  return {
    facilityType: extract(/facility type[:\s-]+(.+?)(?:\n|$)/i),
    yardSize: extract(/yard size[:\s-]+(.+?)(?:\n|$)/i),
    estimatedBays: extractNumber(/(?:estimated\s+)?bays?[:\s-]+(\d+)/i),
    trucksVisible: extractNumber(/trucks?(?:\s+visible)?[:\s-]+(\d+)/i),
    trailersVisible: extractNumber(/trailers?(?:\s+visible)?[:\s-]+(\d+)/i),
    equipmentSummary: extract(/equipment(?: summary)?[:\s-]+(.+?)(?:\n|$)/i),
    activityLevel: extract(/activity(?: level)?[:\s-]+(.+?)(?:\n|$)/i),
    confidence: confidenceMatch,
    salesIntel: extract(/sales intel(?:ligence)?[:\s-]+(.+?)(?:\n|$)/i),
    surroundingArea: extract(/surrounding area[:\s-]+(.+?)(?:\n|$)/i),
  };
}

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) {
      return null;
    }

    const bytes = await response.arrayBuffer();
    return Buffer.from(bytes).toString("base64");
  } catch {
    return null;
  }
}

function buildPrompt(context: FacilityAnalysisContext): string {
  return `
You are analyzing a heavy-duty service center for sales intelligence.

Service center: ${context.companyName}
Address: ${context.address}
Record ID: ${context.serviceCenterId}

Use the provided satellite and street-view images and return STRICT JSON only:
{
  "facilityType": "string",
  "yardSize": "small|medium|large",
  "estimatedBays": number,
  "trucksVisible": number,
  "trailersVisible": number,
  "equipmentSummary": "string",
  "activityLevel": "low|moderate|high|dormant",
  "confidence": "low|medium|high",
  "salesIntel": "string",
  "surroundingArea": "string"
}
`.trim();
}

async function callGemini(prompt: string, satelliteBase64: string | null, streetBase64: string | null): Promise<string> {
  const geminiKey = requireEnvValue(env.geminiApiKey, "GEMINI_API_KEY");

  const parts: Array<Record<string, unknown>> = [{ text: prompt }];
  if (satelliteBase64) {
    parts.push({
      inlineData: {
        mimeType: "image/png",
        data: satelliteBase64,
      },
    });
  }

  if (streetBase64) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: streetBase64,
      },
    });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(
      geminiKey
    )}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(60_000),
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.4,
          topP: 0.9,
        },
      }),
    }
  );

  const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;

  if (!response.ok) {
    const errorMessage =
      payload && typeof payload.error === "object" && payload.error
        ? ((payload.error as Record<string, unknown>).message as string | undefined)
        : undefined;
    throw new Error(errorMessage || `Gemini API failed with status ${response.status}`);
  }

  const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
  const firstCandidate =
    candidates[0] && typeof candidates[0] === "object" ? (candidates[0] as Record<string, unknown>) : null;
  const content =
    firstCandidate?.content && typeof firstCandidate.content === "object"
      ? (firstCandidate.content as Record<string, unknown>)
      : null;
  const responseParts = Array.isArray(content?.parts) ? content?.parts : [];
  const firstPart =
    responseParts[0] && typeof responseParts[0] === "object"
      ? (responseParts[0] as Record<string, unknown>)
      : null;
  const text = firstPart?.text;

  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Gemini returned an empty response.");
  }

  return text;
}

export async function analyzeFacility(context: FacilityAnalysisContext): Promise<FacilityAnalysisData> {
  const normalizedAddress = context.address.trim();
  if (!normalizedAddress) {
    throw new Error("Address is required for facility analysis.");
  }

  const imagery = await buildSatelliteImagery({
    address: normalizedAddress,
    lat: context.lat,
    lng: context.lng,
    cacheKey: String(context.serviceCenterId),
  });

  const [satelliteBase64, streetBase64] = await Promise.all([
    fetchImageAsBase64(imagery.imageUrl),
    fetchImageAsBase64(imagery.streetViewUrl),
  ]);

  const rawText = await callGemini(buildPrompt(context), satelliteBase64, streetBase64);
  const parsedJson = extractJsonObject(rawText);
  const fallback = parsedJson ?? parseFallbackText(rawText);

  return sanitizeFacilityPayload(fallback, rawText);
}
