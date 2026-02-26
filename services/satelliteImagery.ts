import { env, requireEnvValue } from "../lib/env.ts";
import type { SatelliteImageryMetadata } from "../types/enrichment.ts";

const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

type ImageryCacheEntry = {
  value: SatelliteImageryMetadata;
  expiresAt: number;
};

const imageryCache = new Map<string, ImageryCacheEntry>();

function toNumberSafe(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function cacheKeyFromInput(input: {
  cacheKey?: string;
  address?: string;
  lat?: number;
  lng?: number;
}): string {
  if (input.cacheKey?.trim()) {
    return `cache:${input.cacheKey.trim().toLowerCase()}`;
  }

  if (typeof input.lat === "number" && typeof input.lng === "number") {
    return `coords:${input.lat.toFixed(6)},${input.lng.toFixed(6)}`;
  }

  return `address:${(input.address ?? "").trim().toLowerCase()}`;
}

function getCachedMetadata(key: string): SatelliteImageryMetadata | null {
  const cached = imageryCache.get(key);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    imageryCache.delete(key);
    return null;
  }

  return cached.value;
}

function setCachedMetadata(key: string, value: SatelliteImageryMetadata): void {
  imageryCache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

async function geocodeAddress(address: string, apiKey: string): Promise<{ lat: number; lng: number }> {
  const response = await fetch(
    `${GEOCODE_URL}?address=${encodeURIComponent(address)}&key=${encodeURIComponent(apiKey)}`
  );

  const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;

  if (!response.ok) {
    const errorMessage =
      payload && typeof payload.error_message === "string"
        ? payload.error_message
        : `Google Geocoding API failed (${response.status})`;
    throw new Error(errorMessage);
  }

  const results = Array.isArray(payload?.results) ? payload.results : [];
  const first = results[0] && typeof results[0] === "object" ? (results[0] as Record<string, unknown>) : null;
  const geometry =
    first?.geometry && typeof first.geometry === "object" ? (first.geometry as Record<string, unknown>) : null;
  const location =
    geometry?.location && typeof geometry.location === "object"
      ? (geometry.location as Record<string, unknown>)
      : null;

  const lat = toNumberSafe(location?.lat);
  const lng = toNumberSafe(location?.lng);

  if (lat === undefined || lng === undefined) {
    throw new Error("Unable to geocode address for imagery generation.");
  }

  return { lat, lng };
}

export async function buildSatelliteImagery(input: {
  address: string;
  lat?: number;
  lng?: number;
  cacheKey?: string;
}): Promise<SatelliteImageryMetadata> {
  const address = input.address.trim();
  if (!address) {
    throw new Error("Address is required for imagery generation.");
  }

  const key = cacheKeyFromInput({
    cacheKey: input.cacheKey,
    address,
    lat: input.lat,
    lng: input.lng,
  });

  const cached = getCachedMetadata(key);
  if (cached) {
    return cached;
  }

  const apiKey = requireEnvValue(env.googleMapsApiKey, "GOOGLE_MAPS_API_KEY");

  let lat = input.lat;
  let lng = input.lng;

  if (typeof lat !== "number" || typeof lng !== "number") {
    const geocoded = await geocodeAddress(address, apiKey);
    lat = geocoded.lat;
    lng = geocoded.lng;
  }

  const imageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=19&size=1280x720&maptype=satellite&key=${encodeURIComponent(
    apiKey
  )}`;
  const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=1280x720&location=${lat},${lng}&fov=90&key=${encodeURIComponent(
    apiKey
  )}`;

  const metadata: SatelliteImageryMetadata = {
    imageUrl,
    streetViewUrl,
    interactiveUrl: `https://www.google.com/maps/@?api=1&map_action=map&center=${lat},${lng}&zoom=19&basemap=satellite`,
    lat,
    lng,
    usesApiKey: true,
    generatedAt: new Date().toISOString(),
  };

  setCachedMetadata(key, metadata);
  return metadata;
}
