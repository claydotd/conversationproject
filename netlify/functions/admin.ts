import type { Config, Context } from "@netlify/functions";
import type { SiteContent } from "../../shared/types";
import { PAGE_SLUGS } from "../../shared/types";
import {
  clearSessionCookie,
  createSessionCookie,
  isAuthenticated,
  passwordConfigured,
  passwordMatches,
} from "../lib/auth";
import { mediaKey, mediaStore, publicMediaPath } from "../lib/blobs";
import { loadContentFromDatabase, saveContentToDatabase } from "../lib/content";
import { errorJson, json } from "../lib/http";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function unauthorized() {
  return errorJson("Sign in required.", 401);
}

function requireAuth(req: Request) {
  return isAuthenticated(req);
}

async function handleLogin(req: Request) {
  if (!passwordConfigured()) {
    return errorJson(
      "Set ADMIN_PASSWORD (and ADMIN_SESSION_SECRET) in the Netlify environment before using the admin portal.",
      503,
    );
  }

  const body = (await req.json()) as { password?: string };
  if (!body.password || !passwordMatches(body.password)) {
    return errorJson("That password is not correct.", 401);
  }

  return json(
    { ok: true },
    200,
    { "Set-Cookie": createSessionCookie(req) },
  );
}

async function handleLogout(req: Request) {
  return json({ ok: true }, 200, { "Set-Cookie": clearSessionCookie(req) });
}

async function handleSession(req: Request) {
  return json({
    authenticated: isAuthenticated(req),
    passwordConfigured: passwordConfigured(),
  });
}

async function handleGetContent() {
  const content = await loadContentFromDatabase();
  return json(content);
}

function isSiteContent(value: unknown): value is SiteContent {
  if (!value || typeof value !== "object") return false;
  const candidate = value as SiteContent;
  return (
    Boolean(candidate.site) &&
    Boolean(candidate.pages) &&
    PAGE_SLUGS.every((slug) => candidate.pages?.[slug]) &&
    Array.isArray(candidate.testimonials)
  );
}

async function handleSaveContent(req: Request) {
  const body = (await req.json()) as unknown;
  if (!isSiteContent(body)) {
    return errorJson("The content payload is missing required page data.");
  }
  const saved = await saveContentToDatabase(body);
  return json(saved);
}

async function handleUpload(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return errorJson("Choose an image to upload.");
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return errorJson("Please upload a JPEG, PNG, WebP, or GIF image.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return errorJson("Images need to be 4MB or smaller.");
  }

  const key = mediaKey(file.name);
  const store = mediaStore();
  await store.set(key, await file.arrayBuffer());
  return json({ key, url: publicMediaPath(key) });
}

export default async (req: Request, _context: Context) => {
  const { pathname } = new URL(req.url);

  try {
    if (pathname === "/api/admin/login" && req.method === "POST") {
      return await handleLogin(req);
    }
    if (pathname === "/api/admin/logout" && req.method === "POST") {
      return await handleLogout(req);
    }
    if (pathname === "/api/admin/session" && req.method === "GET") {
      return await handleSession(req);
    }

    if (!requireAuth(req)) {
      return unauthorized();
    }

    if (pathname === "/api/admin/content" && req.method === "GET") {
      return await handleGetContent();
    }
    if (pathname === "/api/admin/content" && req.method === "PUT") {
      return await handleSaveContent(req);
    }
    if (pathname === "/api/admin/media" && req.method === "POST") {
      return await handleUpload(req);
    }

    return errorJson("Not found", 404);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";
    console.error(error);
    return errorJson(message, 500);
  }
};

export const config: Config = {
  path: ["/api/admin/*"],
};
