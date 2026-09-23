import { createHmac, timingSafeEqual } from "node:crypto";
import { getEnv } from "./env";

const TOKEN_TTL_MS = 60 * 60 * 1000;

function secret(): string {
  return (
    getEnv("ADMIN_SESSION_SECRET") ||
    getEnv("ADMIN_PASSWORD") ||
    getEnv("SUMUP_API_KEY") ||
    "download-dev-secret"
  );
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createDownloadToken(input: {
  email: string;
  productId: string;
}): string {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = Buffer.from(
    JSON.stringify({
      email: input.email.trim().toLowerCase(),
      productId: input.productId,
      exp,
    }),
    "utf8",
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyDownloadToken(token: string): {
  email: string;
  productId: string;
} | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const given = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) {
    return null;
  }
  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { email?: string; productId?: string; exp?: number };
    if (
      typeof data.email !== "string" ||
      typeof data.productId !== "string" ||
      typeof data.exp !== "number" ||
      data.exp < Date.now()
    ) {
      return null;
    }
    return { email: data.email, productId: data.productId };
  } catch {
    return null;
  }
}

export function publicDownloadPath(token: string): string {
  return `/api/downloads/file?token=${encodeURIComponent(token)}`;
}
