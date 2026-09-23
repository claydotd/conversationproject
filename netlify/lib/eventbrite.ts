import {
  DEFAULT_EVENTBRITE_ORGANIZER_ID,
  mapEventbriteEvent,
  sortUpcomingEvents,
  type EventsListing,
  type SiteEvent,
} from "../../shared/events";
import { getEnv } from "./env";

const EVENTBRITE_API = "https://www.eventbriteapi.com/v3";
const MAX_PAGES = 20;

interface EventbriteError extends Error {
  status?: number;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function getEventbriteConfig(): {
  token: string;
  organizerId: string;
} | null {
  const token = getEnv("EVENTBRITE_API_KEY")?.trim();
  if (!token) return null;
  return {
    token,
    organizerId:
      getEnv("EVENTBRITE_ORGANIZER_ID")?.trim() ||
      DEFAULT_EVENTBRITE_ORGANIZER_ID,
  };
}

async function eventbriteGet(
  token: string,
  path: string,
  params: Record<string, string> = {},
): Promise<Record<string, unknown>> {
  const url = new URL(
    `${EVENTBRITE_API}${path.startsWith("/") ? path : `/${path}`}`,
  );
  if (!url.pathname.endsWith("/")) {
    url.pathname = `${url.pathname}/`;
  }
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    const body = asRecord(payload);
    const error = new Error(
      asString(body?.error_description) ||
        asString(body?.error) ||
        `Eventbrite request failed (${response.status})`,
    ) as EventbriteError;
    error.status = response.status;
    throw error;
  }
  return asRecord(payload) ?? {};
}

async function fetchPagedEvents(
  token: string,
  path: string,
  extra: Record<string, string> = {},
): Promise<unknown[]> {
  const events: unknown[] = [];
  let continuation = "";
  let page = 1;
  // /organizers/:id/events rejects time_filter; /organizations/:id/events accepts it.
  const supportsTimeFilter = path.includes("/organizations/");

  for (let i = 0; i < MAX_PAGES; i++) {
    const data = await eventbriteGet(token, path, {
      expand: "venue",
      order_by: "start_asc",
      ...(supportsTimeFilter ? { time_filter: "all" } : {}),
      ...(continuation ? { continuation } : { page: String(page) }),
      ...extra,
    });
    events.push(...(Array.isArray(data.events) ? data.events : []));

    const pagination = asRecord(data.pagination);
    continuation = asString(pagination?.continuation);
    const hasMore = pagination?.has_more_items === true || Boolean(continuation);
    if (!hasMore) break;
    if (!continuation) page += 1;
  }

  return events;
}

function matchesOrganizer(raw: unknown, organizerId: string): boolean {
  const record = asRecord(raw);
  const id = asString(record?.organizer_id);
  return !id || id === organizerId;
}

async function listOrganizationIds(token: string): Promise<string[]> {
  const data = await eventbriteGet(token, "/users/me/organizations/");
  const organizations = Array.isArray(data.organizations)
    ? data.organizations
    : [];
  return organizations
    .map((item) => asString(asRecord(item)?.id))
    .filter(Boolean);
}

async function collectRawEvents(
  token: string,
  organizerId: string,
): Promise<unknown[]> {
  try {
    return await fetchPagedEvents(
      token,
      `/organizers/${organizerId}/events/`,
    );
  } catch (error) {
    const status = (error as EventbriteError).status;
    if (status === 401 || status === 403) throw error;
  }

  try {
    return await fetchPagedEvents(
      token,
      `/organizations/${organizerId}/events/`,
    );
  } catch (error) {
    const status = (error as EventbriteError).status;
    if (status === 401 || status === 403) throw error;
  }

  const organizationIds = await listOrganizationIds(token);
  if (organizationIds.length === 0) {
    throw new Error("No Eventbrite organization was found for this API key.");
  }

  const batches = await Promise.all(
    organizationIds.map((id) =>
      fetchPagedEvents(token, `/organizations/${id}/events/`),
    ),
  );
  const all = batches.flat();
  const matching = all.filter((item) => matchesOrganizer(item, organizerId));
  return matching.length > 0 ? matching : all;
}

export async function fetchEventbriteListing(): Promise<EventsListing> {
  const config = getEventbriteConfig();
  if (!config) {
    throw new Error("Missing required environment variable: EVENTBRITE_API_KEY");
  }

  const events = (await collectRawEvents(config.token, config.organizerId))
    .map(mapEventbriteEvent)
    .filter((item): item is SiteEvent => item !== null);

  return {
    events: sortUpcomingEvents(events),
    fetchedAt: new Date().toISOString(),
  };
}
