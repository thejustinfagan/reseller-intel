import {
  cleanString,
  hasLocationKeyword,
  maybeAbsoluteUrl,
  normalizePhone,
  normalizeState,
  normalizeZip,
  normalizeWhitespace,
} from "./utils.ts";
import type { ExtractionStrategy, ScrapedDealerRecord } from "./types.ts";

type JsonValue = Record<string, unknown> | Array<unknown>;

type ExtractContext = {
  brand: string;
  defaultDealerType: string;
  sourceUrl: string;
  scrapedAt: string;
};

const JSON_ASSIGNMENT_MARKERS = [
  "window.__NEXT_DATA__",
  "__NEXT_DATA__",
  "window.__INITIAL_STATE__",
  "window.__PRELOADED_STATE__",
  "window.__NUXT__",
  "__NUXT__",
  "preloadedState",
  "initialState",
  "dealerData",
  "locationData",
];

const DEALER_COLLECTION_KEYS = [
  "dealers",
  "dealer",
  "locations",
  "location",
  "dealerships",
  "results",
  "stores",
  "branches",
  "items",
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeKey(rawKey: string): string {
  return rawKey.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findFieldValue(obj: Record<string, unknown>, keyOptions: string[]): unknown {
  const normalizedOptions = new Set(keyOptions.map((key) => normalizeKey(key)));

  for (const [key, value] of Object.entries(obj)) {
    if (normalizedOptions.has(normalizeKey(key))) {
      return value;
    }
  }

  return undefined;
}

function getStringField(obj: Record<string, unknown>, keyOptions: string[]): string {
  const value = findFieldValue(obj, keyOptions);
  if (typeof value === "string") {
    return cleanString(value);
  }
  if (typeof value === "number") {
    return String(value);
  }
  return "";
}

function getNumberField(obj: Record<string, unknown>, keyOptions: string[]): number | null {
  const value = findFieldValue(obj, keyOptions);
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function mergeAddressLines(parts: string[]): string {
  return normalizeWhitespace(
    parts
      .map((part) => cleanString(part))
      .filter((part) => part.length > 0)
      .join(", ")
  );
}

function getAddressFields(obj: Record<string, unknown>): {
  address: string;
  city: string;
  state: string;
  zip: string;
} {
  const rawAddress = findFieldValue(obj, [
    "address",
    "streetAddress",
    "street",
    "address1",
    "line1",
    "MAIN_ADDRESS_LINE_1_TXT",
  ]);

  if (typeof rawAddress === "string") {
    return {
      address: cleanString(rawAddress),
      city: getStringField(obj, ["city", "town", "locality", "MAIN_CITY_NM"]),
      state: normalizeState(
        getStringField(obj, ["state", "stateCode", "province", "region", "MAIN_STATE_PROV_CD"])
      ),
      zip: normalizeZip(getStringField(obj, ["zip", "postalCode", "postcode", "postal", "MAIN_POSTAL_CD"])),
    };
  }

  if (isPlainObject(rawAddress)) {
    const line1 = getStringField(rawAddress, [
      "line1",
      "address1",
      "street",
      "street1",
      "streetAddress",
      "MAIN_ADDRESS_LINE_1_TXT",
    ]);
    const line2 = getStringField(rawAddress, ["line2", "address2", "suite", "MAIN_ADDRESS_LINE_2_TXT"]);
    const city =
      getStringField(rawAddress, ["city", "town", "locality", "MAIN_CITY_NM"]) ||
      getStringField(obj, ["city", "town", "locality", "MAIN_CITY_NM"]);
    const state =
      normalizeState(getStringField(rawAddress, ["state", "stateCode", "province", "region", "MAIN_STATE_PROV_CD"])) ||
      normalizeState(getStringField(obj, ["state", "stateCode", "province", "region", "MAIN_STATE_PROV_CD"]));
    const zip =
      normalizeZip(getStringField(rawAddress, ["zip", "postalCode", "postcode", "postal", "MAIN_POSTAL_CD"])) ||
      normalizeZip(getStringField(obj, ["zip", "postalCode", "postcode", "postal", "MAIN_POSTAL_CD"]));

    return {
      address: mergeAddressLines([line1, line2]),
      city,
      state,
      zip,
    };
  }

  const address = mergeAddressLines([
    getStringField(obj, ["address1", "line1", "street", "streetAddress", "MAIN_ADDRESS_LINE_1_TXT"]),
    getStringField(obj, ["address2", "line2", "suite", "MAIN_ADDRESS_LINE_2_TXT"]),
  ]);

  return {
    address,
    city: getStringField(obj, ["city", "town", "locality", "MAIN_CITY_NM"]),
    state: normalizeState(getStringField(obj, ["state", "stateCode", "province", "region", "MAIN_STATE_PROV_CD"])),
    zip: normalizeZip(getStringField(obj, ["zip", "postalCode", "postcode", "postal", "MAIN_POSTAL_CD"])),
  };
}

function objectToDealerRecord(obj: Record<string, unknown>, context: ExtractContext): ScrapedDealerRecord | null {
  const companyName = getStringField(obj, [
    "companyName",
    "company",
    "name",
    "dealerName",
    "dealer",
    "title",
    "locationName",
    "branchName",
    "COMPANY_DBA_NAME",
    "COMPANY_NAME",
    "DEALER_NAME",
  ]);

  if (!companyName) {
    return null;
  }

  const addressFields = getAddressFields(obj);

  const coordinatesRaw = findFieldValue(obj, ["coordinates", "geo", "geolocation"]);
  const coordinates = isPlainObject(coordinatesRaw) ? coordinatesRaw : null;

  const latitude =
    getNumberField(obj, ["latitude", "lat", "geoLat", "y", "MAIN_LATITUDE"]) ??
    (coordinates ? getNumberField(coordinates, ["latitude", "lat", "y", "MAIN_LATITUDE"]) : null);
  const longitude =
    getNumberField(obj, ["longitude", "lon", "lng", "geoLng", "x", "MAIN_LONGITUDE"]) ??
    (coordinates ? getNumberField(coordinates, ["longitude", "lon", "lng", "x", "MAIN_LONGITUDE"]) : null);

  const phone = normalizePhone(
    getStringField(obj, ["phone", "phoneNumber", "telephone", "tel", "primaryPhone"]) ||
      getStringField(obj, [
        "contactNumber",
        "REG_PHONE_NUMBER",
        "SLS_PHONE_NUMBER",
        "SVC_PHONE_NUMBER",
        "TF_PHONE_NUMBER",
      ])
  );

  const websiteCandidate =
    getStringField(obj, ["website", "url", "dealerWebsite", "link", "href", "web", "WEB_ADDRESS"]) || "";
  const website = websiteCandidate
    ? maybeAbsoluteUrl(websiteCandidate, context.sourceUrl) ?? websiteCandidate
    : "";

  const dealerType =
    getStringField(obj, ["dealerType", "locationType", "type", "category", "segment", "DEALER_TYPE_DESC"]) ||
    context.defaultDealerType;

  const city = addressFields.city;
  const state = addressFields.state;
  const zip = addressFields.zip;

  if (!city || !state) {
    return null;
  }

  return {
    companyName,
    address: addressFields.address,
    city,
    state,
    zip,
    phone,
    website,
    dealerType,
    brand: context.brand,
    latitude,
    longitude,
    scrapedAt: context.scrapedAt,
    sourceUrl: context.sourceUrl,
  };
}

function collectObjects(value: unknown, target: Record<string, unknown>[], depth = 0): void {
  if (depth > 20 || target.length > 20_000) {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectObjects(item, target, depth + 1);
    }
    return;
  }

  if (isPlainObject(value)) {
    target.push(value);

    for (const child of Object.values(value)) {
      collectObjects(child, target, depth + 1);
    }
  }
}

function safeJsonParse(raw: string): JsonValue | null {
  try {
    const parsed = JSON.parse(raw) as JsonValue;
    if (Array.isArray(parsed) || isPlainObject(parsed)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

type InheritedLocationContext = {
  city: string;
  state: string;
};

function nestedContextFromObject(
  obj: Record<string, unknown>,
  inherited: InheritedLocationContext
): InheritedLocationContext {
  const city = getStringField(obj, ["city", "cityName", "town", "locality"]) || inherited.city;
  const state =
    normalizeState(
      getStringField(obj, [
        "state",
        "stateCode",
        "stateAbbrev",
        "stateAbbreviation",
        "stateName",
        "province",
        "region",
      ])
    ) || inherited.state;

  return {
    city,
    state,
  };
}

function nestedObjectToDealerRecord(
  obj: Record<string, unknown>,
  inherited: InheritedLocationContext,
  context: ExtractContext
): ScrapedDealerRecord | null {
  const companyName = getStringField(obj, [
    "dealerName",
    "companyName",
    "locationName",
    "branchName",
    "dealershipName",
    "COMPANY_DBA_NAME",
    "dealer",
    "name",
    "title",
  ]);
  if (!companyName) {
    return null;
  }

  const addressFields = getAddressFields(obj);
  const city =
    getStringField(obj, ["city", "cityName", "town", "locality", "MAIN_CITY_NM"]) ||
    addressFields.city ||
    inherited.city;
  const state =
    normalizeState(
      getStringField(obj, [
        "state",
        "stateCode",
        "stateAbbrev",
        "stateAbbreviation",
        "stateName",
        "province",
        "region",
        "MAIN_STATE_PROV_CD",
      ])
    ) ||
    addressFields.state ||
    inherited.state;

  if (!city || !state) {
    return null;
  }

  const address =
    addressFields.address ||
    mergeAddressLines([
      getStringField(obj, [
        "address",
        "address1",
        "addressLine1",
        "street",
        "street1",
        "line1",
        "streetAddress",
        "MAIN_ADDRESS_LINE_1_TXT",
        "MAIN_ADDRESS_LINE_2_TXT",
      ]),
      getStringField(obj, ["address2", "addressLine2", "street2", "line2", "suite"]),
    ]);

  const zip = normalizeZip(
    getStringField(obj, [
      "zip",
      "zipCode",
      "postalCode",
      "postal",
      "postCode",
      "postcode",
      "MAIN_POSTAL_CD",
    ]) || addressFields.zip
  );
  const phone = normalizePhone(
    getStringField(obj, [
      "phone",
      "phoneNumber",
      "dealerPhone",
      "telephone",
      "tel",
      "primaryPhone",
      "contactNumber",
      "REG_PHONE_NUMBER",
      "SLS_PHONE_NUMBER",
      "SVC_PHONE_NUMBER",
      "TF_PHONE_NUMBER",
    ])
  );

  const websiteCandidate = getStringField(obj, [
    "website",
    "websiteUrl",
    "dealerWebsite",
    "dealerUrl",
    "WEB_ADDRESS",
    "url",
    "web",
    "link",
    "href",
  ]);
  const website = websiteCandidate
    ? maybeAbsoluteUrl(websiteCandidate, context.sourceUrl) ?? websiteCandidate
    : "";

  const coordinatesRaw = findFieldValue(obj, ["coordinates", "coordinate", "geo", "geolocation", "location"]);
  const coordinates = isPlainObject(coordinatesRaw) ? coordinatesRaw : null;

  const latitude =
    getNumberField(obj, ["latitude", "lat", "geoLat", "y", "MAIN_LATITUDE"]) ??
    (coordinates ? getNumberField(coordinates, ["latitude", "lat", "geoLat", "y", "MAIN_LATITUDE"]) : null);
  const longitude =
    getNumberField(obj, ["longitude", "lon", "lng", "geoLng", "x", "MAIN_LONGITUDE"]) ??
    (coordinates ? getNumberField(coordinates, ["longitude", "lon", "lng", "geoLng", "x", "MAIN_LONGITUDE"]) : null);

  const dealerType =
    getStringField(obj, ["dealerType", "locationType", "type", "category", "segment"]) ||
    context.defaultDealerType;

  return {
    companyName,
    address,
    city,
    state,
    zip,
    phone,
    website,
    dealerType,
    brand: context.brand,
    latitude,
    longitude,
    scrapedAt: context.scrapedAt,
    sourceUrl: context.sourceUrl,
  };
}

function extractNestedCountryStateDealers(body: string, context: ExtractContext): ScrapedDealerRecord[] {
  const trimmedBody = body.trim();
  if (!trimmedBody.startsWith("{") && !trimmedBody.startsWith("[")) {
    return [];
  }

  const parsedRoot = safeJsonParse(trimmedBody);
  if (!parsedRoot) {
    return [];
  }

  const dealers: ScrapedDealerRecord[] = [];

  function walk(node: unknown, inherited: InheritedLocationContext, depth = 0): void {
    if (depth > 25 || dealers.length > 25_000) {
      return;
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        walk(item, inherited, depth + 1);
      }
      return;
    }

    if (!isPlainObject(node)) {
      return;
    }

    const nextContext = nestedContextFromObject(node, inherited);
    const asDealer = nestedObjectToDealerRecord(node, nextContext, context);
    if (asDealer) {
      dealers.push(asDealer);
    }

    for (const child of Object.values(node)) {
      walk(child, nextContext, depth + 1);
    }
  }

  try {
    walk(parsedRoot, { city: "", state: "" });
  } catch {
    return [];
  }

  return dealers;
}

function extractBalancedJson(text: string, startIndex: number): string | null {
  const openChar = text[startIndex];
  if (openChar !== "{" && openChar !== "[") {
    return null;
  }

  const closeChar = openChar === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = startIndex; i < text.length; i += 1) {
    const char = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === openChar) {
      depth += 1;
      continue;
    }

    if (char === closeChar) {
      depth -= 1;
      if (depth === 0) {
        return text.slice(startIndex, i + 1);
      }
    }
  }

  return null;
}

function extractJsonFromAssignments(text: string): JsonValue[] {
  const results: JsonValue[] = [];

  for (const marker of JSON_ASSIGNMENT_MARKERS) {
    let searchStart = 0;

    while (searchStart < text.length) {
      const markerIndex = text.indexOf(marker, searchStart);
      if (markerIndex === -1) {
        break;
      }

      const equalsIndex = text.indexOf("=", markerIndex);
      const colonIndex = text.indexOf(":", markerIndex);
      let valueStart = -1;

      if (equalsIndex !== -1 && equalsIndex - markerIndex < 80) {
        valueStart = equalsIndex + 1;
      } else if (colonIndex !== -1 && colonIndex - markerIndex < 80) {
        valueStart = colonIndex + 1;
      }

      if (valueStart === -1) {
        searchStart = markerIndex + marker.length;
        continue;
      }

      while (valueStart < text.length && /\s/.test(text[valueStart] ?? "")) {
        valueStart += 1;
      }

      const startChar = text[valueStart];
      if (startChar !== "{" && startChar !== "[") {
        searchStart = markerIndex + marker.length;
        continue;
      }

      const block = extractBalancedJson(text, valueStart);
      if (block) {
        const parsed = safeJsonParse(block);
        if (parsed) {
          results.push(parsed);
        }
      }

      searchStart = markerIndex + marker.length;
    }
  }

  return results;
}

function extractJsonByCollectionKeys(text: string): JsonValue[] {
  const results: JsonValue[] = [];
  const pattern = new RegExp(
    `(?:"|')?(${DEALER_COLLECTION_KEYS.join("|")})(?:"|')?\\s*:\\s*([\\[{])`,
    "gi"
  );

  let match: RegExpExecArray | null = pattern.exec(text);
  while (match) {
    const startIndex = (match.index ?? 0) + (match[0]?.length ?? 0) - 1;
    const block = extractBalancedJson(text, startIndex);

    if (block) {
      const parsed = safeJsonParse(block);
      if (parsed) {
        results.push(parsed);
      }
    }

    match = pattern.exec(text);
  }

  return results;
}

function extractJsonFromScriptTags(html: string): JsonValue[] {
  const results: JsonValue[] = [];
  const scriptRegex = /<script[^>]*type=["'](?:application\/ld\+json|application\/json)["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null = scriptRegex.exec(html);

  while (match) {
    const content = (match[1] ?? "").trim();
    if (content) {
      const parsed = safeJsonParse(content);
      if (parsed) {
        results.push(parsed);
      }
    }
    match = scriptRegex.exec(html);
  }

  return results;
}

function findUrlsInText(text: string, baseUrl: string): string[] {
  const urls = new Set<string>();

  const absoluteRegex = /https?:\/\/[^\s"'<>]+/gi;
  let absoluteMatch = absoluteRegex.exec(text);
  while (absoluteMatch) {
    const candidate = cleanString(absoluteMatch[0] ?? "");
    if (candidate && hasLocationKeyword(candidate)) {
      urls.add(candidate);
    }
    absoluteMatch = absoluteRegex.exec(text);
  }

  const relativeRegex = /["'](\/[a-z0-9/_\-.?=&%+]+)["']/gi;
  let relativeMatch = relativeRegex.exec(text);
  while (relativeMatch) {
    const candidate = cleanString(relativeMatch[1] ?? "");
    if (candidate && hasLocationKeyword(candidate)) {
      const absolute = maybeAbsoluteUrl(candidate, baseUrl);
      if (absolute) {
        urls.add(absolute);
      }
    }
    relativeMatch = relativeRegex.exec(text);
  }

  return [...urls];
}

function findUrlsInHtml(html: string, baseUrl: string): string[] {
  const urls = new Set<string>();
  const tagRegex = /<(?:script|a|link)[^>]+(?:src|href)=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null = tagRegex.exec(html);

  while (match) {
    const candidate = cleanString(match[1] ?? "");
    if (candidate && hasLocationKeyword(candidate)) {
      const absolute = maybeAbsoluteUrl(candidate, baseUrl);
      if (absolute) {
        urls.add(absolute);
      }
    }

    match = tagRegex.exec(html);
  }

  return [...urls];
}

export function extractFromResponse(params: {
  body: string;
  contentType: string;
  sourceUrl: string;
  brand: string;
  defaultDealerType: string;
  scrapedAt: string;
  extractionStrategy?: ExtractionStrategy;
}): {
  dealers: ScrapedDealerRecord[];
  discoveredUrls: string[];
} {
  const roots: JsonValue[] = [];
  const trimmedBody = params.body.trim();

  if (trimmedBody.startsWith("{") || trimmedBody.startsWith("[")) {
    const parsed = safeJsonParse(trimmedBody);
    if (parsed) {
      roots.push(parsed);
    }
  }

  roots.push(...extractJsonFromAssignments(params.body));
  roots.push(...extractJsonByCollectionKeys(params.body));

  const isHtml = params.contentType.includes("text/html") || /<html/i.test(params.body);
  if (isHtml) {
    roots.push(...extractJsonFromScriptTags(params.body));
  }

  const objects: Record<string, unknown>[] = [];
  for (const root of roots) {
    collectObjects(root, objects);
  }

  const context: ExtractContext = {
    brand: params.brand,
    defaultDealerType: params.defaultDealerType,
    sourceUrl: params.sourceUrl,
    scrapedAt: params.scrapedAt,
  };

  const dealers: ScrapedDealerRecord[] = [];

  if (params.extractionStrategy === "nestedCountryStateDealersJson") {
    try {
      dealers.push(...extractNestedCountryStateDealers(params.body, context));
    } catch {
      // Keep the generic extraction fallback if strategy-specific parsing fails.
    }
  }

  for (const obj of objects) {
    const dealer = objectToDealerRecord(obj, context);
    if (dealer) {
      dealers.push(dealer);
    }
  }

  const discoveredUrls = new Set<string>();
  for (const url of findUrlsInText(params.body, params.sourceUrl)) {
    discoveredUrls.add(url);
  }

  if (isHtml) {
    for (const url of findUrlsInHtml(params.body, params.sourceUrl)) {
      discoveredUrls.add(url);
    }
  }

  return {
    dealers,
    discoveredUrls: [...discoveredUrls],
  };
}
