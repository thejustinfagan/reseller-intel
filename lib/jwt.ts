import { createHmac, timingSafeEqual } from "crypto";

export type JwtPayload = {
  sub?: string;
  exp?: number;
  nbf?: number;
  iat?: number;
  [key: string]: unknown;
};

export type JwtValidationResult =
  | { ok: true; payload: JwtPayload }
  | { ok: false; status: number; error: string };

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim() ?? "";
  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return secret;
}

function decodeBase64Url(segment: string): string {
  try {
    return Buffer.from(segment, "base64url").toString("utf8");
  } catch {
    throw new Error("Invalid JWT encoding.");
  }
}

function safeCompare(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return timingSafeEqual(aBuffer, bBuffer);
}

export function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization") ?? "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme?.toLowerCase() === "bearer" && token?.trim()) {
    return token.trim();
  }

  const fallback = request.headers.get("x-access-token")?.trim();
  return fallback || null;
}

export function verifyJwt(token: string): JwtPayload {
  const secret = getJwtSecret();
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new Error("Malformed JWT.");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  const headerJson = decodeBase64Url(encodedHeader);
  const payloadJson = decodeBase64Url(encodedPayload);

  let header: Record<string, unknown>;
  let payload: JwtPayload;

  try {
    header = JSON.parse(headerJson) as Record<string, unknown>;
    payload = JSON.parse(payloadJson) as JwtPayload;
  } catch {
    throw new Error("JWT payload is not valid JSON.");
  }

  if (header.alg !== "HS256") {
    throw new Error("Unsupported JWT algorithm.");
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");

  if (!safeCompare(expectedSignature, encodedSignature)) {
    throw new Error("JWT signature validation failed.");
  }

  const nowSeconds = Math.floor(Date.now() / 1000);

  if (typeof payload.nbf === "number" && nowSeconds < payload.nbf) {
    throw new Error("JWT is not active yet.");
  }

  if (typeof payload.exp === "number" && nowSeconds >= payload.exp) {
    throw new Error("JWT has expired.");
  }

  return payload;
}

export function requireJwtAuth(request: Request): JwtValidationResult {
  const token = getBearerToken(request);
  if (!token) {
    return { ok: false, status: 401, error: "Missing bearer token." };
  }

  try {
    const payload = verifyJwt(token);
    return { ok: true, payload };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JWT.";
    return { ok: false, status: 401, error: message };
  }
}
