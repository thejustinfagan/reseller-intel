import { env, requireEnvValue } from "../lib/env.ts";
import type { GoogleBusinessDetails, GooglePlaceReview } from "../types/enrichment.ts";

const PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const PLACES_DETAILS_URL = "https://places.googleapis.com/v1/places";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 40;
const CACHE_TTL_MS = 30 * 60 * 1000;

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export class GooglePlacesServiceError extends Error {
  readonly status: number;
  readonly code: string;
  readonly transient: boolean;

  constructor(message: string, status: number, code: string, transient: boolean) {
    super(message);
    this.name = "GooglePlacesServiceError";
    this.status = status;
    this.code = code;
    this.transient = transient;
  }
}

const queryCache = new Map<string, CacheEntry<GoogleBusinessDetails | null>>();
const detailsCache = new Map<string, CacheEntry<GoogleBusinessDetails>>();
const requestTimestamps: number[] = [];

let rateLimitQueue: Promise<void> = Promise.resolve();

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pruneRequestWindow(now: number): void {
  while (requestTimestamps.length > 0 && now - requestTimestamps[0] >= RATE_LIMIT_WINDOW_MS) {
    requestTimestamps.shift();
  }
}

async function waitForRateLimitSlot(): Promise<void> {
  while (true) {
    const now = Date.now();
    pruneRequestWindow(now);

    if (requestTimestamps.length < RATE_LIMIT_MAX_REQUESTS) {
      requestTimestamps.push(now);
      return;
    }

    const oldest = requestTimestamps[0] ?? now;
    const waitMs = Math.max(25, RATE_LIMIT_WINDOW_MS - (now - oldest) + 25);
    await sleep(waitMs);
  }
}

async function runWithRateLimit<T>(operation: () => Promise<T>): Promise<T> {
  const run = async (): Promise<T> => {
    await waitForRateLimitSlot();
    return operation();
  };

  const scheduled = rateLimitQueue.then(run, run);
  rateLimitQueue = scheduled.then(
    () => undefined,
    () => undefined
  );

  return scheduled;
}

function getCached<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const cached = cache.get(key);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }

  return cached.value;
}

function setCached<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T): void {
  cache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

function toStringSafe(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized || undefined;
}

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

function parseReviews(payload: unknown): GooglePlaceReview[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  const parsed: GooglePlaceReview[] = [];

  for (const review of payload) {
    const record = review && typeof review === "object" ? (review as Record<string, unknown>) : null;
    if (!record) {
      continue;
    }

    const authorAttribution =
      record.authorAttribution && typeof record.authorAttribution === "object"
        ? (record.authorAttribution as Record<string, unknown>)
        : null;

    const textPayload =
      record.text && typeof record.text === "object" ? (record.text as Record<string, unknown>) : null;

    const rating = toNumberSafe(record.rating) ?? 0;
    const text = toStringSafe(textPayload?.text) ?? "";

    parsed.push({
      author: toStringSafe(authorAttribution?.displayName) ?? "Unknown reviewer",
      rating,
      text,
      publishedAt: toStringSafe(record.publishTime),
    });
  }

  return parsed;
}

function mapPlaceDetails(place: Record<string, unknown>): GoogleBusinessDetails {
  const displayNamePayload =
    place.displayName && typeof place.displayName === "object"
      ? (place.displayName as Record<string, unknown>)
      : null;
  const locationPayload =
    place.location && typeof place.location === "object"
      ? (place.location as Record<string, unknown>)
      : null;

  const reviewCount = toNumberSafe(place.userRatingCount);

  return {
    placeId: toStringSafe(place.id) ?? "",
    name: toStringSafe(displayNamePayload?.text) ?? "Unknown business",
    address: toStringSafe(place.formattedAddress) ?? "",
    phone: toStringSafe(place.nationalPhoneNumber),
    website: toStringSafe(place.websiteUri),
    rating: toNumberSafe(place.rating),
    reviewCount: Number.isFinite(reviewCount) ? Number(reviewCount) : 0,
    reviews: parseReviews(place.reviews),
    lat: toNumberSafe(locationPayload?.latitude),
    lng: toNumberSafe(locationPayload?.longitude),
  };
}

function mapApiError(
  status: number,
  payload: unknown,
  fallbackMessage: string
): GooglePlacesServiceError {
  const record = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
  const errorPayload =
    record?.error && typeof record.error === "object" ? (record.error as Record<string, unknown>) : null;

  const message = toStringSafe(errorPayload?.message) ?? fallbackMessage;
  const code = toStringSafe(errorPayload?.status) ?? `HTTP_${status}`;
  const transient = status === 429 || status >= 500;

  return new GooglePlacesServiceError(message, status, code, transient);
}

async function fetchPlacesJson(
  url: string,
  init: RequestInit,
  fallbackMessage: string
): Promise<Record<string, unknown>> {
  let response: Response;

  try {
    response = await runWithRateLimit(() => fetch(url, init));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google Places network request failed.";
    throw new GooglePlacesServiceError(message, 503, "NETWORK_ERROR", true);
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw mapApiError(response.status, payload, fallbackMessage);
  }

  if (!payload || typeof payload !== "object") {
    throw new GooglePlacesServiceError(
      "Google Places returned an invalid response payload.",
      502,
      "INVALID_PAYLOAD",
      true
    );
  }

  return payload as Record<string, unknown>;
}

async function searchPlaceId(searchQuery: string, apiKey: string): Promise<string | null> {
  const payload = await fetchPlacesJson(
    PLACES_SEARCH_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id",
      },
      body: JSON.stringify({
        textQuery: searchQuery,
        maxResultCount: 1,
      }),
    },
    "Google Places search failed."
  );

  const places = Array.isArray(payload.places) ? payload.places : [];
  const firstPlace = places[0] && typeof places[0] === "object" ? (places[0] as Record<string, unknown>) : null;

  return toStringSafe(firstPlace?.id) ?? null;
}

async function fetchPlaceDetails(placeId: string, apiKey: string): Promise<GoogleBusinessDetails> {
  const payload = await fetchPlacesJson(
    `${PLACES_DETAILS_URL}/${encodeURIComponent(placeId)}`,
    {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "id,displayName,formattedAddress,nationalPhoneNumber,websiteUri,rating,userRatingCount,reviews,location",
      },
    },
    "Google Places details lookup failed."
  );

  const details = mapPlaceDetails(payload);
  if (!details.placeId) {
    throw new GooglePlacesServiceError(
      "Google Places details were missing a place identifier.",
      502,
      "INVALID_PLACE",
      true
    );
  }

  return details;
}

export async function fetchGoogleBusinessDetails(searchQuery: string): Promise<GoogleBusinessDetails | null> {
  const normalizedQuery = searchQuery.trim();
  if (!normalizedQuery) {
    throw new GooglePlacesServiceError("Search query is required.", 400, "INVALID_QUERY", false);
  }

  const cacheKey = normalizeKey(normalizedQuery);
  const cachedQueryResult = getCached(queryCache, cacheKey);
  if (cachedQueryResult !== null) {
    return cachedQueryResult;
  }

  const apiKey = requireEnvValue(env.googleMapsApiKey, "GOOGLE_MAPS_API_KEY");
  const placeId = await searchPlaceId(normalizedQuery, apiKey);

  if (!placeId) {
    setCached(queryCache, cacheKey, null);
    return null;
  }

  const cachedDetails = getCached(detailsCache, placeId);
  if (cachedDetails) {
    setCached(queryCache, cacheKey, cachedDetails);
    return cachedDetails;
  }

  const details = await fetchPlaceDetails(placeId, apiKey);
  setCached(detailsCache, placeId, details);
  setCached(queryCache, cacheKey, details);

  return details;
}
