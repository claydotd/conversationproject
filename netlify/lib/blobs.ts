import { getStore } from "@netlify/blobs";
import type { EventsListing } from "../../shared/events";
import type { SiteContent } from "../../shared/types";

const CONTENT_KEY = "published";
const EVENTS_KEY = "listing";

export function contentStore() {
  return getStore("site-content");
}

export function mediaStore() {
  return getStore("site-media");
}

export function eventsStore() {
  return getStore("events-cache");
}

export async function readPublishedContent(): Promise<SiteContent | null> {
  const store = contentStore();
  return (await store.get(CONTENT_KEY, { type: "json" })) as SiteContent | null;
}

export async function writePublishedContent(content: SiteContent): Promise<void> {
  const store = contentStore();
  await store.setJSON(CONTENT_KEY, content);
}

export async function readCachedEvents(): Promise<EventsListing | null> {
  const store = eventsStore();
  return (await store.get(EVENTS_KEY, { type: "json" })) as EventsListing | null;
}

export async function writeCachedEvents(listing: EventsListing): Promise<void> {
  const store = eventsStore();
  await store.setJSON(EVENTS_KEY, listing);
}

export function mediaKey(fileName: string): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
  const unique = crypto.randomUUID();
  return `${unique}-${safe}`;
}

export function publicMediaPath(key: string): string {
  return `/api/media/${encodeURIComponent(key)}`;
}
