export interface GooglePlaceReview {
  author: string;
  rating: number;
  text: string;
  publishedAt?: string;
}

export interface GoogleBusinessDetails {
  placeId: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount: number;
  reviews: GooglePlaceReview[];
  lat?: number;
  lng?: number;
}

export type SentimentDirection = "positive" | "neutral" | "negative";

export interface SentimentTrendPoint {
  label: string;
  score: number;
  rating?: number;
  timestamp?: string;
}

export interface SentimentAnalysisResult {
  sentimentScore: number;
  direction: SentimentDirection;
  positiveReviews: number;
  neutralReviews: number;
  negativeReviews: number;
  trendPoints: SentimentTrendPoint[];
}

export interface SatelliteImageryMetadata {
  imageUrl: string;
  streetViewUrl: string;
  interactiveUrl: string;
  lat?: number;
  lng?: number;
  usesApiKey: boolean;
  generatedAt: string;
}

export interface FacilityAnalysisData {
  facilityType: string | null;
  yardSize: string | null;
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

export interface EnrichmentRecord {
  id: string;
  serviceCenterId: number;
  googlePlaceId: string | null;
  googleBusinessName: string | null;
  googleBusinessAddress: string | null;
  googleBusinessPhone: string | null;
  googleBusinessWebsite: string | null;
  googleRating: number | null;
  sentimentScore: number | null;
  imageUrl: string | null;
  reviewCount: number | null;
  facilityType: string | null;
  yardSize: string | null;
  estimatedBays: number | null;
  trucksVisible: number | null;
  trailersVisible: number | null;
  equipmentSummary: string | null;
  activityLevel: string | null;
  confidence: string | null;
  salesIntel: string | null;
  surroundingArea: string | null;
  facilityAnalysisRaw: string | null;
  lastEnriched: string;
  analysisError: string | null;
}

export interface ServiceCenterSnapshot {
  id: number;
  companyName: string;
  fullAddress: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
}

export interface ServiceCenterEnrichmentData {
  serviceCenter: ServiceCenterSnapshot;
  enrichment: EnrichmentRecord | null;
}

export interface BatchEnrichmentItem {
  serviceCenterId: number;
  success: boolean;
  error?: string;
  enrichment?: EnrichmentRecord;
}
