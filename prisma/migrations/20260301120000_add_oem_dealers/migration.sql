CREATE TABLE IF NOT EXISTS "oem_dealers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "company_name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "dealer_type" TEXT,
    "brand" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "scraped_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_oem_dealers_company_zip"
  ON "oem_dealers"("company_name", "zip");

CREATE INDEX IF NOT EXISTS "idx_oem_dealers_brand"
  ON "oem_dealers"("brand");

CREATE INDEX IF NOT EXISTS "idx_oem_dealers_state_city"
  ON "oem_dealers"("state", "city");
