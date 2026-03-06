import type { BrandScraperConfig, BrandSlug } from "./types.ts";

export const OEM_BRAND_CONFIGS: Record<BrandSlug, BrandScraperConfig> = {
  peterbilt: {
    slug: "peterbilt",
    brand: "Peterbilt",
    locatorUrl: "https://www.peterbilt.com/locate-dealer",
    defaultDealerType: "Sales & Service",
    seedUrls: ["https://www.peterbilt.com/"],
  },
  freightliner: {
    slug: "freightliner",
    brand: "Freightliner",
    locatorUrl: "https://www.freightlinertrucks.com/dealers",
    defaultDealerType: "Sales & Service",
    seedUrls: ["https://www.freightlinertrucks.com/"],
  },
  kenworth: {
    slug: "kenworth",
    brand: "Kenworth",
    locatorUrl: "https://www.kenworth.com/dealers",
    defaultDealerType: "Sales & Service",
    seedUrls: ["https://www.kenworth.com/"],
  },
  international: {
    slug: "international",
    brand: "International",
    locatorUrl: "https://www.internationaltrucks.com/dealers",
    defaultDealerType: "Sales & Service",
    seedUrls: ["https://www.internationaltrucks.com/"],
  },
  mack: {
    slug: "mack",
    brand: "Mack Trucks",
    locatorUrl: "https://www.macktrucks.com/dealers",
    defaultDealerType: "Sales & Service",
    seedUrls: ["https://www.macktrucks.com/"],
  },
  volvo: {
    slug: "volvo",
    brand: "Volvo Trucks",
    locatorUrl: "https://www.volvotrucks.us/dealers",
    defaultDealerType: "Sales & Service",
    seedUrls: ["https://www.volvotrucks.us/"],
  },
};

export const OEM_BRANDS = Object.values(OEM_BRAND_CONFIGS);
