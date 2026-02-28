import Database from "better-sqlite3";
import path from "path";
import { randomUUID } from "crypto";
import { fetchGoogleBusinessDetails, GooglePlacesServiceError } from "./googlePlaces.ts";
import { analyzeReviewSentiment } from "./sentimentAnalysis.ts";
import { buildSatelliteImagery } from "./satelliteImagery.ts";
import { analyzeFacility } from "./facilityAnalysis.ts";
import type {
  BatchEnrichmentItem,
  EnrichmentRecord,
  GoogleBusinessDetails,
  SentimentAnalysisResult,
  ServiceCenterEnrichmentData,
  ServiceCenterSnapshot,
} from "../types/enrichment.ts";

const DB_PATH = path.join(process.cwd(), "data", "reseller-intel.db");

export class EnrichmentServiceError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "EnrichmentServiceError";
    this.status = status;
    this.code = code;
  }
}

type ServiceCenterRow = {
  id: number;
  company_name: string;
  full_address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
};

type EnrichmentRow = {
  id: string;
  service_center_id: number;
  google_place_id: string | null;
  google_business_name: string | null;
  google_business_address: string | null;
  google_business_phone: string | null;
  google_business_website: string | null;
  google_rating: number | null;
  sentiment_score: number | null;
  image_url: string | null;
  review_count: number | null;
  facility_type: string | null;
  yard_size: string | null;
  estimated_acreage: number | null;
  estimated_bays: number | null;
  trucks_visible: number | null;
  trailers_visible: number | null;
  equipment_summary: string | null;
  activity_level: string | null;
  confidence: string | null;
  sales_intel: string | null;
  surrounding_area: string | null;
  facility_analysis_raw: string | null;
  last_enriched: string;
  analysis_error: string | null;
};

function openDatabase(): Database.Database {
  return new Database(DB_PATH);
}

function ensureEnrichmentTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS service_center_enrichment (
      id TEXT NOT NULL PRIMARY KEY,
      service_center_id INTEGER NOT NULL,
      google_place_id TEXT,
      google_business_name TEXT,
      google_business_address TEXT,
      google_business_phone TEXT,
      google_business_website TEXT,
      google_rating REAL,
      sentiment_score REAL,
      image_url TEXT,
      review_count INTEGER,
      facility_type TEXT,
      yard_size TEXT,
      estimated_acreage REAL,
      estimated_bays INTEGER,
      trucks_visible INTEGER,
      trailers_visible INTEGER,
      equipment_summary TEXT,
      activity_level TEXT,
      confidence TEXT,
      sales_intel TEXT,
      surrounding_area TEXT,
      facility_analysis_raw TEXT,
      last_enriched DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      analysis_error TEXT,
      FOREIGN KEY (service_center_id) REFERENCES companies(id) ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_service_center_enrichment_center_id_unique
      ON service_center_enrichment(service_center_id);
    CREATE INDEX IF NOT EXISTS idx_service_center_enrichment_last_enriched
      ON service_center_enrichment(last_enriched);
  `);
}

function compactAddress(center: ServiceCenterSnapshot): string {
  const explicit = center.fullAddress?.trim() ?? "";
  if (explicit) {
    return explicit;
  }

  return [center.city, center.state, center.zipCode]
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(", ");
}

function toSnapshot(row: ServiceCenterRow): ServiceCenterSnapshot {
  return {
    id: row.id,
    companyName: row.company_name,
    fullAddress: row.full_address,
    city: row.city,
    state: row.state,
    zipCode: row.zip_code,
  };
}

function mapEnrichmentRecord(row: EnrichmentRow): EnrichmentRecord {
  return {
    id: row.id,
    serviceCenterId: row.service_center_id,
    googlePlaceId: row.google_place_id,
    googleBusinessName: row.google_business_name,
    googleBusinessAddress: row.google_business_address,
    googleBusinessPhone: row.google_business_phone,
    googleBusinessWebsite: row.google_business_website,
    googleRating: row.google_rating,
    sentimentScore: row.sentiment_score,
    imageUrl: row.image_url,
    reviewCount: row.review_count,
    facilityType: row.facility_type,
    yardSize: row.yard_size,
    estimatedAcreage: row.estimated_acreage,
    estimatedBays: row.estimated_bays,
    trucksVisible: row.trucks_visible,
    trailersVisible: row.trailers_visible,
    equipmentSummary: row.equipment_summary,
    activityLevel: row.activity_level,
    confidence: row.confidence,
    salesIntel: row.sales_intel,
    surroundingArea: row.surrounding_area,
    facilityAnalysisRaw: row.facility_analysis_raw,
    lastEnriched: new Date(row.last_enriched).toISOString(),
    analysisError: row.analysis_error,
  };
}

function resolveServiceCenter(serviceCenterId: number): ServiceCenterSnapshot {
  if (!Number.isFinite(serviceCenterId) || serviceCenterId <= 0) {
    throw new EnrichmentServiceError("service center id must be a positive integer", 400, "INVALID_ID");
  }

  const db = openDatabase();
  try {
    const row = db
      .prepare(
        `SELECT id, company_name, full_address, city, state, zip_code
         FROM companies
         WHERE id = ?`
      )
      .get(serviceCenterId) as ServiceCenterRow | undefined;

    if (!row) {
      throw new EnrichmentServiceError("Service center not found.", 400, "SERVICE_CENTER_NOT_FOUND");
    }

    return toSnapshot(row);
  } finally {
    db.close();
  }
}

function getGoogleSearchQuery(serviceCenter: ServiceCenterSnapshot): string {
  const address = compactAddress(serviceCenter);
  return [serviceCenter.companyName, address].filter(Boolean).join(" ").trim();
}

function mapGoogleError(error: unknown): never {
  if (error instanceof GooglePlacesServiceError) {
    throw new EnrichmentServiceError(error.message, error.status, error.code);
  }

  if (error instanceof Error) {
    throw new EnrichmentServiceError(error.message, 500, "GOOGLE_PLACES_FAILED");
  }

  throw new EnrichmentServiceError("Google Places lookup failed.", 500, "GOOGLE_PLACES_FAILED");
}

async function getGoogleDetails(serviceCenter: ServiceCenterSnapshot): Promise<GoogleBusinessDetails> {
  const query = getGoogleSearchQuery(serviceCenter);
  if (!query) {
    throw new EnrichmentServiceError("Service center address is required for Google enrichment.", 400, "INVALID_ADDRESS");
  }

  try {
    const details = await fetchGoogleBusinessDetails(query);
    if (!details) {
      throw new EnrichmentServiceError("No Google Places match found.", 400, "PLACE_NOT_FOUND");
    }

    return details;
  } catch (error) {
    mapGoogleError(error);
  }
}

function readEnrichmentRow(serviceCenterId: number): EnrichmentRow | null {
  const db = openDatabase();
  try {
    ensureEnrichmentTable(db);
    const row = db
      .prepare(
        `SELECT
          id,
          service_center_id,
          google_place_id,
          google_business_name,
          google_business_address,
          google_business_phone,
          google_business_website,
          google_rating,
          sentiment_score,
          image_url,
          review_count,
          facility_type,
          yard_size,
          estimated_bays,
          trucks_visible,
          trailers_visible,
          equipment_summary,
          activity_level,
          confidence,
          sales_intel,
          surrounding_area,
          facility_analysis_raw,
          last_enriched,
          analysis_error
         FROM service_center_enrichment
         WHERE service_center_id = ?`
      )
      .get(serviceCenterId) as EnrichmentRow | undefined;

    return row ?? null;
  } finally {
    db.close();
  }
}

function upsertGoogleEnrichment(
  serviceCenterId: number,
  details: GoogleBusinessDetails,
  sentiment: SentimentAnalysisResult,
  imageUrl: string | null
): EnrichmentRecord {
  const db = openDatabase();
  const now = new Date().toISOString();

  try {
    ensureEnrichmentTable(db);

    db.prepare(
      `
      INSERT INTO service_center_enrichment (
        id,
        service_center_id,
        google_place_id,
        google_business_name,
        google_business_address,
        google_business_phone,
        google_business_website,
        google_rating,
        sentiment_score,
        image_url,
        review_count,
        last_enriched,
        analysis_error
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(service_center_id) DO UPDATE SET
        google_place_id = excluded.google_place_id,
        google_business_name = excluded.google_business_name,
        google_business_address = excluded.google_business_address,
        google_business_phone = excluded.google_business_phone,
        google_business_website = excluded.google_business_website,
        google_rating = excluded.google_rating,
        sentiment_score = excluded.sentiment_score,
        image_url = excluded.image_url,
        review_count = excluded.review_count,
        last_enriched = excluded.last_enriched,
        analysis_error = excluded.analysis_error
      `
    ).run(
      randomUUID(),
      serviceCenterId,
      details.placeId,
      details.name,
      details.address,
      details.phone ?? null,
      details.website ?? null,
      details.rating ?? null,
      sentiment.sentimentScore,
      imageUrl,
      details.reviewCount,
      now,
      null
    );

    const row = readEnrichmentRow(serviceCenterId);
    if (!row) {
      throw new EnrichmentServiceError("Failed to store Google enrichment.", 500, "STORE_FAILED");
    }

    return mapEnrichmentRecord(row);
  } finally {
    db.close();
  }
}

function upsertFacilityEnrichment(
  serviceCenterId: number,
  data: {
    facilityType: string | null;
    yardSize: string | null;
    estimatedAcreage: number | null;
    estimatedBays: number | null;
    trucksVisible: number | null;
    trailersVisible: number | null;
    equipmentSummary: string | null;
    activityLevel: string | null;
    confidence: string | null;
    salesIntel: string | null;
    surroundingArea: string | null;
    rawText: string | null;
  }
): EnrichmentRecord {
  const db = openDatabase();
  const now = new Date().toISOString();

  try {
    ensureEnrichmentTable(db);

    db.prepare(
      `
      INSERT INTO service_center_enrichment (
        id,
        service_center_id,
        facility_type,
        yard_size,
        estimated_acreage,
        estimated_bays,
        trucks_visible,
        trailers_visible,
        equipment_summary,
        activity_level,
        confidence,
        sales_intel,
        surrounding_area,
        facility_analysis_raw,
        last_enriched,
        analysis_error
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(service_center_id) DO UPDATE SET
        facility_type = excluded.facility_type,
        yard_size = excluded.yard_size,
        estimated_acreage = excluded.estimated_acreage,
        estimated_bays = excluded.estimated_bays,
        trucks_visible = excluded.trucks_visible,
        trailers_visible = excluded.trailers_visible,
        equipment_summary = excluded.equipment_summary,
        activity_level = excluded.activity_level,
        confidence = excluded.confidence,
        sales_intel = excluded.sales_intel,
        surrounding_area = excluded.surrounding_area,
        facility_analysis_raw = excluded.facility_analysis_raw,
        last_enriched = excluded.last_enriched,
        analysis_error = excluded.analysis_error
      `
    ).run(
      randomUUID(),
      serviceCenterId,
      data.facilityType,
      data.yardSize,
      data.estimatedAcreage,
      data.estimatedBays,
      data.trucksVisible,
      data.trailersVisible,
      data.equipmentSummary,
      data.activityLevel,
      data.confidence,
      data.salesIntel,
      data.surroundingArea,
      data.rawText,
      now,
      null
    );

    const row = readEnrichmentRow(serviceCenterId);
    if (!row) {
      throw new EnrichmentServiceError("Failed to store facility enrichment.", 500, "STORE_FAILED");
    }

    return mapEnrichmentRecord(row);
  } finally {
    db.close();
  }
}

export async function enrichServiceCenter(serviceCenterId: number): Promise<{
  serviceCenter: ServiceCenterSnapshot;
  enrichment: EnrichmentRecord;
  sentiment: SentimentAnalysisResult;
}> {
  const serviceCenter = resolveServiceCenter(serviceCenterId);
  const details = await getGoogleDetails(serviceCenter);
  const sentiment = analyzeReviewSentiment(details.reviews);

  let imageUrl: string | null = null;
  try {
    const imagery = await buildSatelliteImagery({
      address: details.address || compactAddress(serviceCenter),
      lat: details.lat,
      lng: details.lng,
      cacheKey: details.placeId,
    });
    imageUrl = imagery.imageUrl;
  } catch {
    imageUrl = null;
  }

  const enrichment = upsertGoogleEnrichment(serviceCenter.id, details, sentiment, imageUrl);
  return { serviceCenter, enrichment, sentiment };
}

export async function enrichFacilityForServiceCenter(serviceCenterId: number): Promise<{
  serviceCenter: ServiceCenterSnapshot;
  enrichment: EnrichmentRecord;
}> {
  const serviceCenter = resolveServiceCenter(serviceCenterId);
  const existing = readEnrichmentRow(serviceCenter.id);
  const address = existing?.google_business_address || compactAddress(serviceCenter);

  if (!address.trim()) {
    throw new EnrichmentServiceError("Service center address is required for facility analysis.", 400, "INVALID_ADDRESS");
  }

  const facility = await analyzeFacility({
    serviceCenterId: serviceCenter.id,
    companyName: serviceCenter.companyName,
    address,
  });

  const enrichment = upsertFacilityEnrichment(serviceCenter.id, facility);
  return { serviceCenter, enrichment };
}

export async function fetchServiceCenterEnrichment(serviceCenterId: number): Promise<ServiceCenterEnrichmentData> {
  const serviceCenter = resolveServiceCenter(serviceCenterId);
  const row = readEnrichmentRow(serviceCenter.id);

  return {
    serviceCenter,
    enrichment: row ? mapEnrichmentRecord(row) : null,
  };
}

export async function enrichBatch(serviceCenterIds: number[], includeFacility = true): Promise<BatchEnrichmentItem[]> {
  const results: BatchEnrichmentItem[] = [];

  for (const serviceCenterId of serviceCenterIds) {
    try {
      const google = await enrichServiceCenter(serviceCenterId);
      let enrichment = google.enrichment;

      if (includeFacility) {
        const facility = await enrichFacilityForServiceCenter(serviceCenterId);
        enrichment = facility.enrichment;
      }

      results.push({
        serviceCenterId,
        success: true,
        enrichment,
      });
    } catch (error) {
      results.push({
        serviceCenterId,
        success: false,
        error: error instanceof Error ? error.message : "Unknown enrichment error.",
      });
    }
  }

  return results;
}
