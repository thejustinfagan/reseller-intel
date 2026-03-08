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
    locatorUrl: "https://www.freightliner.com/dealer-search/",
    defaultDealerType: "Sales & Service",
    seedUrls: ["https://www.freightliner.com/"],
    dataSources: [
      {
        url: "https://www.freightliner.com/umbraco/backoffice/dealers/geo-search",
      },
      {
        url: "https://www.freightliner.com/umbraco/backoffice/dealers/geo-search?lat=39.8283&lng=-98.5795&radius=5000",
      },
      {
        url: "https://www.freightliner.com/umbraco/backoffice/dealers/geo-search?latitude=39.8283&longitude=-98.5795&distance=5000",
      },
    ],
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
    locatorUrl: "https://dealerlocator.macktrucks.com/Mack_DealerJson.ashx",
    extractionStrategy: "nestedCountryStateDealersJson",
    defaultDealerType: "Sales & Service",
    dataSources: [
      {
        url: "https://dealerlocator.macktrucks.com/Mack_DealerJson.ashx",
        extractionStrategy: "nestedCountryStateDealersJson",
      },
    ],
  },
  volvo: {
    slug: "volvo",
    brand: "Volvo Trucks",
    locatorUrl: "https://dealerlocator.volvotrucks.us/Volvo_DealerJson.ashx",
    extractionStrategy: "nestedCountryStateDealersJson",
    defaultDealerType: "Sales & Service",
    dataSources: [
      {
        url: "https://dealerlocator.volvotrucks.us/Volvo_DealerJson.ashx",
        extractionStrategy: "nestedCountryStateDealersJson",
      },
    ],
  },
};

export const OEM_BRANDS = Object.values(OEM_BRAND_CONFIGS);
