import type { Config, Context } from "@netlify/functions";
import type { EventsListing } from "../../shared/events";
import { readCachedEvents, writeCachedEvents } from "../lib/blobs";
import {
  fetchEventbriteListing,
  getEventbriteConfig,
} from "../lib/eventbrite";
import { errorJson, json } from "../lib/http";

const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=60, stale-while-revalidate=86400",
  "Netlify-CDN-Cache-Control":
    "public, durable, s-maxage=60, stale-while-revalidate=86400",
};

function emptyListing(): EventsListing {
  return { upcoming: [], past: [], fetchedAt: null };
}

function isFresh(listing: EventsListing | null): listing is EventsListing {
  if (!listing?.fetchedAt) return false;
  const fetched = Date.parse(listing.fetchedAt);
  return Number.isFinite(fetched) && Date.now() - fetched < CACHE_TTL_MS;
}

export default async (req: Request, _context: Context) => {
  if (req.method !== "GET") {
    return errorJson("Method not allowed", 405);
  }
  const cached = await readCachedEvents().catch(() => null);
  if (isFresh(cached)) {
    return json(cached, 200, CACHE_HEADERS);
  }

  if (!getEventbriteConfig()) {
    return json(cached ?? emptyListing(), 200, CACHE_HEADERS);
  }

  try {
    const listing = await fetchEventbriteListing();
    await writeCachedEvents(listing).catch((error) => {
      console.error("Unable to cache Eventbrite events.", error);
    });
    return json(listing, 200, CACHE_HEADERS);
  } catch (error) {
    console.error(error);
    if (cached) {
      return json(cached, 200, CACHE_HEADERS);
    }
    const message =
      error instanceof Error ? error.message : "Unable to load events.";
    return errorJson(message, 502);
  }
};

export const config: Config = {
  path: "/api/events",
};
