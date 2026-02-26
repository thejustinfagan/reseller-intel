CREATE TABLE IF NOT EXISTS "service_center_enrichment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "service_center_id" INTEGER NOT NULL,
    "google_place_id" TEXT,
    "google_business_name" TEXT,
    "google_business_address" TEXT,
    "google_business_phone" TEXT,
    "google_business_website" TEXT,
    "google_rating" REAL,
    "sentiment_score" REAL,
    "image_url" TEXT,
    "review_count" INTEGER,
    "facility_type" TEXT,
    "yard_size" TEXT,
    "estimated_bays" INTEGER,
    "trucks_visible" INTEGER,
    "trailers_visible" INTEGER,
    "equipment_summary" TEXT,
    "activity_level" TEXT,
    "confidence" TEXT,
    "sales_intel" TEXT,
    "surrounding_area" TEXT,
    "facility_analysis_raw" TEXT,
    "last_enriched" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "analysis_error" TEXT,
    CONSTRAINT "service_center_enrichment_service_center_id_fkey"
      FOREIGN KEY ("service_center_id") REFERENCES "companies" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_service_center_enrichment_center_id_unique"
  ON "service_center_enrichment"("service_center_id");

CREATE INDEX IF NOT EXISTS "idx_service_center_enrichment_last_enriched"
  ON "service_center_enrichment"("last_enriched");
