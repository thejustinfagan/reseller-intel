import fs from 'fs';
import path from 'path';

export type ZipCoordMap = Record<string, [number, number]>;

const ZIP_COORDS_PATH = path.join(process.cwd(), 'data', 'zip-coords.json');
const EARTH_RADIUS_MILES = 3959;
const ZIP_IN_CLAUSE_CHUNK_SIZE = 900;

let zipCoordsCache: ZipCoordMap | null = null;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function haversineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_MILES * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function normalizeZip(zipValue: string | null | undefined): string | null {
  if (!zipValue) {
    return null;
  }

  const zip = zipValue.trim();
  return /^\d{5}$/.test(zip) ? zip : null;
}

export function getZipCoordsMap(): ZipCoordMap {
  if (zipCoordsCache) {
    return zipCoordsCache;
  }

  if (!fs.existsSync(ZIP_COORDS_PATH)) {
    throw new Error(`ZIP_COORDS_FILE_MISSING:${ZIP_COORDS_PATH}`);
  }

  const raw = fs.readFileSync(ZIP_COORDS_PATH, 'utf8');
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const normalized: ZipCoordMap = {};

  for (const [zip, coords] of Object.entries(parsed)) {
    if (!/^\d{5}$/.test(zip)) {
      continue;
    }

    if (!Array.isArray(coords) || coords.length < 2) {
      continue;
    }

    const lat = Number(coords[0]);
    const lng = Number(coords[1]);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      continue;
    }

    normalized[zip] = [lat, lng];
  }

  if (Object.keys(normalized).length === 0) {
    throw new Error('ZIP_COORDS_EMPTY');
  }

  zipCoordsCache = normalized;
  return zipCoordsCache;
}

export function getZipCodesWithinRadius(nearZip: string, radiusMiles: number): string[] {
  const zipCoords = getZipCoordsMap();
  const center = zipCoords[nearZip];

  if (!center) {
    throw new Error(`ZIP_NOT_FOUND:${nearZip}`);
  }

  const [centerLat, centerLng] = center;
  const nearbyZips: string[] = [];

  for (const [zip, [lat, lng]] of Object.entries(zipCoords)) {
    if (haversineMiles(centerLat, centerLng, lat, lng) <= radiusMiles) {
      nearbyZips.push(zip);
    }
  }

  return nearbyZips;
}

export function buildChunkedInClause(
  columnExpression: string,
  values: string[]
): { clause: string; params: string[] } {
  if (values.length === 0) {
    return { clause: '1 = 0', params: [] };
  }

  const params: string[] = [];
  const clauses: string[] = [];

  for (let i = 0; i < values.length; i += ZIP_IN_CLAUSE_CHUNK_SIZE) {
    const chunk = values.slice(i, i + ZIP_IN_CLAUSE_CHUNK_SIZE);
    const placeholders = chunk.map(() => '?').join(',');
    clauses.push(`${columnExpression} IN (${placeholders})`);
    params.push(...chunk);
  }

  return {
    clause: clauses.length === 1 ? clauses[0] : `(${clauses.join(' OR ')})`,
    params,
  };
}
