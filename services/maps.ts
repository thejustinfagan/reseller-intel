import type { MapsImageryResponse } from "@/types/maps";

function getStaticImageUrl(location: string, mapType: "satellite" | "roadmap"): string | undefined {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return undefined;
  }

  const encodedLocation = encodeURIComponent(location);
  return `https://maps.googleapis.com/maps/api/staticmap?center=${encodedLocation}&zoom=19&size=1280x720&maptype=${mapType}&key=${encodeURIComponent(
    apiKey
  )}`;
}

function getStreetViewImageUrl(location: string): string | undefined {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return undefined;
  }

  const encodedLocation = encodeURIComponent(location);
  return `https://maps.googleapis.com/maps/api/streetview?size=1280x720&location=${encodedLocation}&key=${encodeURIComponent(
    apiKey
  )}`;
}

// FREE iframe embed URLs (no API key required)
function getSatelliteEmbedUrl(location: string): string {
  const encodedLocation = encodeURIComponent(location);
  return `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d500!2d0!3d0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sen!2sus!4v1234567890&q=${encodedLocation}`;
}

function getStreetViewEmbedUrl(location: string): string {
  const encodedLocation = encodeURIComponent(location);
  return `https://www.google.com/maps/embed/v1/streetview?key=FREE&location=${encodedLocation}`;
}

// OpenStreetMap as fallback (always free, no key needed)
function getOpenStreetMapUrl(location: string): string {
  const encodedLocation = encodeURIComponent(location);
  return `https://www.openstreetmap.org/search?query=${encodedLocation}`;
}

export function buildMapsImagery(location: string): MapsImageryResponse {
  const normalizedLocation = location.trim();
  const encodedLocation = encodeURIComponent(normalizedLocation);

  // Build Google Maps embed URL (FREE, no billing required)
  const embedMapUrl = `https://maps.google.com/maps?q=${encodedLocation}&t=k&z=18&output=embed`;
  const embedStreetViewUrl = `https://maps.google.com/maps?q=${encodedLocation}&layer=c&z=18&output=embed`;

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  return {
    location: normalizedLocation,
    interactiveSatelliteUrl: `https://www.google.com/maps/@?api=1&map_action=map&center=${encodedLocation}&zoom=18&basemap=satellite`,
    interactiveStreetViewUrl: `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${encodedLocation}`,
    satelliteStaticUrl: getStaticImageUrl(normalizedLocation, "satellite"),
    streetViewStaticUrl: getStreetViewImageUrl(normalizedLocation),
    satelliteEmbedUrl: embedMapUrl,
    streetViewEmbedUrl: embedStreetViewUrl,
    openStreetMapUrl: getOpenStreetMapUrl(normalizedLocation),
    usesApiKey: Boolean(apiKey)
  };
}

export async function searchNearbyResellers(location: string, radius: number = 1600): Promise<{ center: { lat: number; lng: number }; results: any[] }> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("Google Maps API key is required for cluster analysis.");
  }

  // 1. Geocode the location
  const geocodeRes = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${apiKey}`
  );
  const geocodeData = await geocodeRes.json();
  
  if (!geocodeData.results?.length) {
    throw new Error("Could not find coordinates for this location.");
  }
  
  const center = geocodeData.results[0].geometry.location;

  // 2. Search for resellers/wholesalers/distributors nearby
  const keywords = ["wholesale", "distributor", "supplier", "reseller", "vendor"];
  const allResults: any[] = [];
  
  const nearbyRes = await fetch(
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${center.lat},${center.lng}&radius=${radius}&keyword=${keywords.join("|")}&key=${apiKey}`
  );
  const nearbyData = await nearbyRes.json();
  
  if (nearbyData.results) {
    allResults.push(...nearbyData.results);
  }

  return {
    center,
    results: allResults.map(p => ({
      name: p.name,
      address: p.vicinity,
      lat: p.geometry.location.lat,
      lng: p.geometry.location.lng,
      types: p.types
    }))
  };
}

export async function optimizeRoute(stops: string[]): Promise<any> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("Google Maps API key is required for route planning.");
  }

  if (stops.length < 2) {
    throw new Error("At least 2 stops are required to plan a route.");
  }

  const origin = stops[0];
  const destination = stops[stops.length - 1];
  const waypoints = stops.slice(1, -1);

  const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
  url.searchParams.append("origin", origin);
  url.searchParams.append("destination", destination);
  if (waypoints.length > 0) {
    url.searchParams.append("waypoints", `optimize:true|${waypoints.join("|")}`);
  }
  url.searchParams.append("key", apiKey);

  const res = await fetch(url.toString());
  const data = await res.json();

  if (data.status !== "OK") {
    throw new Error(`Directions API error: ${data.status} - ${data.error_message || "Unknown error"}`);
  }

  return data;
}
