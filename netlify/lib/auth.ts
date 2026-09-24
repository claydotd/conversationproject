import { createHmac, timingSafeEqual } from "node:crypto";
import { cookieHeader, parseCookies } from "./http";
import { getEnv } from "./env";

const COOKIE = "admin_session";
const WEEK_SECONDS = 60 * 60 * 24 * 7;

function secret(): string | undefined {
  return getEnv("ADMIN_SESSION_SECRET") || getEnv("ADMIN_PASSWORD");
}

function sign(payload: string): string {
  const key = secret();
  if (!key) throw new Error("Admin session secret is not configured.");
  return createHmac("sha256", key).update(payload).digest("base64url");
}

export function createSessionCookie(req: Request): string {
  const exp = Date.now() + WEEK_SECONDS * 1000;
  const payload = Buffer.from(JSON.stringify({ exp }), "utf8").toString(
    "base64url",
  );
  const token = `${payload}.${sign(payload)}`;
  return cookieHeader(COOKIE, token, req, { maxAge: WEEK_SECONDS });
}

export function clearSessionCookie(req: Request): string {
  return cookieHeader(COOKIE, "", req, { clear: true });
}

export function isAuthenticated(req: Request): boolean {
  const key = secret();
  if (!key) return false;
  const token = parseCookies(req)[COOKIE];
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = sign(payload);
  const given = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) {
    return false;
  }

  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { exp?: number };
    return typeof data.exp === "number" && data.exp > Date.now();
  } catch {
    return false;
  }
}

export function passwordConfigured(): boolean {
  return Boolean(
    getEnv("ADMIN_USERNAME") &&
      getEnv("ADMIN_PASSWORD") &&
      getEnv("ADMIN_SESSION_SECRET"),
  );
}

function safeEqual(candidate: string, expected: string | undefined): boolean {
  if (!expected) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function usernameMatches(candidate: string): boolean {
  return safeEqual(candidate, getEnv("ADMIN_USERNAME"));
}

export function passwordMatches(candidate: string): boolean {
  return safeEqual(candidate, getEnv("ADMIN_PASSWORD"));
}
