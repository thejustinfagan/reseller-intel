import type {
  GooglePlaceReview,
  SentimentAnalysisResult,
  SentimentDirection,
  SentimentTrendPoint,
} from "../types/enrichment.ts";

const POSITIVE_TERMS = new Set([
  "excellent",
  "great",
  "friendly",
  "quick",
  "helpful",
  "professional",
  "clean",
  "reliable",
  "smooth",
  "honest",
  "solid",
  "recommend",
  "amazing",
  "awesome",
]);

const NEGATIVE_TERMS = new Set([
  "bad",
  "poor",
  "slow",
  "rude",
  "dirty",
  "unprofessional",
  "awful",
  "terrible",
  "late",
  "broken",
  "overpriced",
  "unreliable",
  "never",
  "worst",
]);

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

function toNormalizedScore(value: number): number {
  return Number(clamp(value, 0, 1).toFixed(4));
}

function cleanTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function lexicalPolarity(text: string): number {
  const tokens = cleanTokens(text);
  if (tokens.length === 0) {
    return 0;
  }

  let positiveHits = 0;
  let negativeHits = 0;

  for (const token of tokens) {
    if (POSITIVE_TERMS.has(token)) {
      positiveHits += 1;
    }

    if (NEGATIVE_TERMS.has(token)) {
      negativeHits += 1;
    }
  }

  if (positiveHits === 0 && negativeHits === 0) {
    return 0;
  }

  return (positiveHits - negativeHits) / (positiveHits + negativeHits);
}

function scoreReview(review: GooglePlaceReview): number {
  const ratingNormalized = clamp((review.rating - 1) / 4, 0, 1);
  const ratingSignal = ratingNormalized * 2 - 1;
  const lexicalSignal = lexicalPolarity(review.text);
  const combined = ratingSignal * 0.7 + lexicalSignal * 0.3;
  return toNormalizedScore((combined + 1) / 2);
}

function classifyDirection(score: number): SentimentDirection {
  if (score >= 0.65) {
    return "positive";
  }

  if (score <= 0.35) {
    return "negative";
  }

  return "neutral";
}

function labelFromDate(value?: string): string {
  if (!value) {
    return "Unknown";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function analyzeReviewSentiment(reviews: GooglePlaceReview[]): SentimentAnalysisResult {
  if (reviews.length === 0) {
    return {
      sentimentScore: 0.5,
      direction: "neutral",
      positiveReviews: 0,
      neutralReviews: 0,
      negativeReviews: 0,
      trendPoints: [],
    };
  }

  const scored = reviews.map((review) => {
    const score = scoreReview(review);
    return {
      review,
      score,
      direction: classifyDirection(score),
    };
  });

  const sentimentScore = toNormalizedScore(
    scored.reduce((sum, entry) => sum + entry.score, 0) / Math.max(1, scored.length)
  );
  const direction = classifyDirection(sentimentScore);

  const positiveReviews = scored.filter((entry) => entry.direction === "positive").length;
  const neutralReviews = scored.filter((entry) => entry.direction === "neutral").length;
  const negativeReviews = scored.filter((entry) => entry.direction === "negative").length;

  const sortedByDate = [...scored].sort((a, b) => {
    const aTime = a.review.publishedAt ? new Date(a.review.publishedAt).getTime() : 0;
    const bTime = b.review.publishedAt ? new Date(b.review.publishedAt).getTime() : 0;
    return aTime - bTime;
  });

  const trendPoints: SentimentTrendPoint[] = sortedByDate.map((entry, index) => ({
    label: entry.review.publishedAt ? labelFromDate(entry.review.publishedAt) : `Review ${index + 1}`,
    score: entry.score,
    rating: entry.review.rating,
    timestamp: entry.review.publishedAt,
  }));

  return {
    sentimentScore,
    direction,
    positiveReviews,
    neutralReviews,
    negativeReviews,
    trendPoints,
  };
}
