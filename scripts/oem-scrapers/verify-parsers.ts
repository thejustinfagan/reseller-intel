import { extractFromResponse } from "./extract.ts";

type VerificationCase = {
  slug: string;
  brand: string;
  sourceUrl: string;
  payload: unknown;
};

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function runCase(testCase: VerificationCase): number {
  const extracted = extractFromResponse({
    body: JSON.stringify(testCase.payload),
    contentType: "application/json",
    sourceUrl: testCase.sourceUrl,
    brand: testCase.brand,
    defaultDealerType: "Sales & Service",
    scrapedAt: "2026-03-08T00:00:00.000Z",
    extractionStrategy: "nestedCountryStateDealersJson",
  });

  assert(extracted.dealers.length > 0, `${testCase.slug}: expected non-zero dealers`);

  for (const dealer of extracted.dealers) {
    assert(dealer.companyName.length > 0, `${testCase.slug}: missing companyName`);
    assert(dealer.city.length > 0, `${testCase.slug}: missing city`);
    assert(dealer.state.length > 0, `${testCase.slug}: missing state`);
    assert(dealer.brand === testCase.brand, `${testCase.slug}: unexpected brand value`);
  }

  return extracted.dealers.length;
}

function main(): void {
  const sampleHierarchy = [
    {
      CountryName: "United States",
      States: [
        {
          StateCode: "NC",
          Dealers: [
            {
              DealerName: "Charlotte Truck Center",
              Address1: "123 Diesel Way",
              City: "Charlotte",
              ZipCode: "28202",
              Phone: "704-555-0100",
              WebsiteUrl: "https://dealer.example.com",
              Latitude: 35.2271,
              Longitude: -80.8431,
            },
          ],
        },
        {
          StateName: "Virginia",
          Dealers: [
            {
              DealerName: "Richmond Heavy Duty",
              Address1: "500 Fleet Ave",
              Address2: "Suite 100",
              City: "Richmond",
              PostalCode: "23219",
              Telephone: "804-555-0199",
              Url: "https://richmond.example.com",
              Lat: "37.5407",
              Lng: "-77.4360",
            },
          ],
        },
      ],
    },
  ];

  const checks: VerificationCase[] = [
    {
      slug: "mack",
      brand: "Mack Trucks",
      sourceUrl: "https://dealerlocator.macktrucks.com/Mack_DealerJson.ashx",
      payload: sampleHierarchy,
    },
    {
      slug: "volvo",
      brand: "Volvo Trucks",
      sourceUrl: "https://dealerlocator.volvotrucks.us/Volvo_DealerJson.ashx",
      payload: sampleHierarchy,
    },
  ];

  const counts = checks.map((testCase) => ({
    slug: testCase.slug,
    count: runCase(testCase),
  }));

  console.log(JSON.stringify({ status: "ok", counts }, null, 2));
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`[oem-scraper:verify-parsers] ${message}`);
  process.exit(1);
}
