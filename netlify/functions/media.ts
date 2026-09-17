import type { Config, Context } from "@netlify/functions";
import { mediaStore } from "../lib/blobs";
import { errorJson } from "../lib/http";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
};

export default async (req: Request, _context: Context) => {
  if (req.method !== "GET") {
    return errorJson("Method not allowed", 405);
  }

  const url = new URL(req.url);
  const key = decodeURIComponent(url.pathname.replace(/^\/api\/media\//, ""));
  if (!key) {
    return errorJson("Missing media key", 400);
  }

  const store = mediaStore();
  const file = await store.get(key, { type: "arrayBuffer" });
  if (!file) {
    return errorJson("Not found", 404);
  }

  const extension = key.split(".").pop()?.toLowerCase() ?? "";
  const contentType = MIME[extension] ?? "application/octet-stream";

  return new Response(file, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};

export const config: Config = {
  path: "/api/media/*",
};
