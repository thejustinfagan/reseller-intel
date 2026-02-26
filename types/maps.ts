export interface MapsImageryResponse {
  location: string;
  interactiveSatelliteUrl: string;
  interactiveStreetViewUrl: string;
  satelliteStaticUrl?: string;
  streetViewStaticUrl?: string;
  // FREE iframe embed URLs (no API key required)
  satelliteEmbedUrl?: string;
  streetViewEmbedUrl?: string;
  openStreetMapUrl?: string;
  usesApiKey: boolean;
}

export interface NearbyPlace {
  name: string;
  address: string;
  lat: number;
  lng: number;
  types: string[];
  matchScore?: number;
}

export interface ClusterAnalysisResponse {
  center: { lat: number; lng: number };
  results: NearbyPlace[];
}
