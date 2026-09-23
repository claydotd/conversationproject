export const DEFAULT_EVENTBRITE_ORGANIZER_ID = "114391829571";

/** Only current/upcoming statuses — past Eventbrite events are not listed on the site. */
export const PUBLIC_EVENT_STATUSES = ["live", "started"] as const;

export interface EventbriteVenue {
  name: string;
  address?: string;
}

export interface SiteEvent {
  id: string;
  name: string;
  summary: string;
  start: string;
  end?: string;
  timezone?: string;
  url: string;
  venue?: EventbriteVenue;
  imageUrl?: string;
  online?: boolean;
}

export interface EventsListing {
  events: SiteEvent[];
  fetchedAt: string | null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function datetimeFrom(value: unknown): string {
  const record = asRecord(value);
  if (record) {
    return asString(record.utc) || asString(record.local);
  }
  return asString(value);
}

function timezoneFrom(value: unknown): string | undefined {
  const record = asRecord(value);
  const timezone = asString(record?.timezone);
  return timezone || undefined;
}

export function mapEventbriteEvent(value: unknown): SiteEvent | null {
  const raw = asRecord(value);
  if (!raw) return null;

  const status = asString(raw.status).toLowerCase();
  if (
    status &&
    !(PUBLIC_EVENT_STATUSES as readonly string[]).includes(status)
  ) {
    return null;
  }
  if (raw.listed === false) return null;

  const id = asString(raw.id);
  const name = asString(asRecord(raw.name)?.text) || asString(raw.name);
  const url = asString(raw.url);
  const start = datetimeFrom(raw.start);
  if (!id || !name || !url || !start) return null;

  const end = datetimeFrom(raw.end) || undefined;
  const venueRaw = asRecord(raw.venue);
  const address = asRecord(venueRaw?.address);
  const logo = asRecord(raw.logo);
  const original = asRecord(logo?.original);
  const online = raw.online_event === true;
  const venueName = asString(venueRaw?.name) || (online ? "Online" : "");
  const venueAddress =
    asString(address?.localized_address_display) ||
    asString(address?.localized_area_display) ||
    undefined;

  return {
    id,
    name,
    summary: asString(raw.summary),
    start,
    end,
    timezone: timezoneFrom(raw.start),
    url,
    imageUrl: asString(original?.url) || asString(logo?.url) || undefined,
    online,
    venue: venueName
      ? { name: venueName, address: venueAddress }
      : undefined,
  };
}

/** Keep events that have not ended yet, sorted soonest first. */
export function sortUpcomingEvents(
  events: SiteEvent[],
  now = Date.now(),
): SiteEvent[] {
  return events
    .filter((event) => {
      const end = Date.parse(event.end || event.start);
      return !Number.isFinite(end) || end >= now;
    })
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
}

export function formatEventSchedule(event: SiteEvent): string {
  const start = new Date(event.start);
  if (Number.isNaN(start.getTime())) return "";

  const timeZone = event.timezone || "Europe/London";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(start);
}

export function formatEventPlace(event: SiteEvent): string {
  if (event.venue?.name) {
    return [event.venue.name, event.venue.address].filter(Boolean).join(" · ");
  }
  return event.online ? "Online" : "";
}
