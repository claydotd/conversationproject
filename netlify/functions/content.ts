import type { Config, Context } from "@netlify/functions";
import { defaultContent } from "../../shared/default-content";
import { readPublishedContent } from "../lib/blobs";
import { json } from "../lib/http";

export default async (_req: Request, _context: Context) => {
  const published = await readPublishedContent();
  const body = published ?? defaultContent;

  return json(body, 200, {
    "Cache-Control": "public, max-age=60, stale-while-revalidate=86400",
    "Netlify-CDN-Cache-Control":
      "public, durable, s-maxage=60, stale-while-revalidate=86400",
  });
};

export const config: Config = {
  path: "/api/content",
};
