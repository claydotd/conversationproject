/**
 * Smoke-test the Eventbrite → events list pipeline.
 *
 * Usage:
 *   npm run test:eventbrite
 *
 * Reads EVENTBRITE_API_KEY and EVENTBRITE_ORGANIZER_ID from .env and
 * follows the same fetch path as netlify/lib/eventbrite.ts.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const EVENTBRITE_API = "https://www.eventbriteapi.com/v3";
const PUBLIC_STATUSES = new Set(["live", "started"]);
const MAX_PAGES = 20;

function loadEnvFile() {
  const path = resolve(root, ".env");
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    throw new Error(`Missing .env at ${path}`);
  }
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : null;
}

function asString(value) {
  return typeof value === "string" ? value : "";
}

function datetimeFrom(value) {
  const record = asRecord(value);
  if (record) return asString(record.utc) || asString(record.local);
  return asString(value);
}

function mapEvent(rawValue) {
  const raw = asRecord(rawValue);
  if (!raw) return null;
  const status = asString(raw.status).toLowerCase();
  if (status && !PUBLIC_STATUSES.has(status)) return null;
  if (raw.listed === false) return null;

  const id = asString(raw.id);
  const name = asString(asRecord(raw.name)?.text) || asString(raw.name);
  const url = asString(raw.url);
  const start = datetimeFrom(raw.start);
  if (!id || !name || !url || !start) return null;

  return {
    id,
    name,
    url,
    start,
    end: datetimeFrom(raw.end) || undefined,
    summary: asString(raw.summary),
  };
}

async function eventbriteGet(token, path, params = {}) {
  const url = new URL(
    `${EVENTBRITE_API}${path.startsWith("/") ? path : `/${path}`}`,
  );
  if (!url.pathname.endsWith("/")) url.pathname = `${url.pathname}/`;
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const body = asRecord(payload);
    const message =
      asString(body?.error_description) ||
      asString(body?.error) ||
      `Eventbrite request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return asRecord(payload) ?? {};
}

async function fetchPagedEvents(token, path) {
  const events = [];
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

function matchesOrganizer(raw, organizerId) {
  const id = asString(asRecord(raw)?.organizer_id);
  return !id || id === organizerId;
}

async function listOrganizationIds(token) {
  const data = await eventbriteGet(token, "/users/me/organizations/");
  const organizations = Array.isArray(data.organizations)
    ? data.organizations
    : [];
  return organizations.map((item) => asString(asRecord(item)?.id)).filter(Boolean);
}

async function collectRawEvents(token, organizerId) {
  try {
    const events = await fetchPagedEvents(
      token,
      `/organizers/${organizerId}/events/`,
    );
    return { source: `organizers/${organizerId}`, events };
  } catch (error) {
    if (error.status === 401 || error.status === 403) throw error;
  }

  try {
    const events = await fetchPagedEvents(
      token,
      `/organizations/${organizerId}/events/`,
    );
    return { source: `organizations/${organizerId}`, events };
  } catch (error) {
    if (error.status === 401 || error.status === 403) throw error;
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
  return {
    source: `users/me/organizations fallback (${organizationIds.join(", ")})`,
    events: matching.length > 0 ? matching : all,
  };
}

function sortUpcoming(events) {
  const now = Date.now();
  return events
    .filter((event) => {
      const end = Date.parse(event.end || event.start);
      return !Number.isFinite(end) || end >= now;
    })
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
}

function printEvents(events) {
  console.log(`\nUpcoming events (${events.length})`);
  if (events.length === 0) {
    console.log("  (none)");
    return;
  }
  for (const event of events.slice(0, 10)) {
    const when = new Date(event.start).toISOString().slice(0, 16).replace("T", " ");
    console.log(`  • ${when}  ${event.name}`);
    console.log(`    ${event.url}`);
  }
  if (events.length > 10) {
    console.log(`  … and ${events.length - 10} more`);
  }
}

async function main() {
  loadEnvFile();

  const token = process.env.EVENTBRITE_API_KEY?.trim();
  const organizerId = process.env.EVENTBRITE_ORGANIZER_ID?.trim();

  if (!token) {
    throw new Error("EVENTBRITE_API_KEY is missing in .env");
  }
  if (!organizerId) {
    throw new Error("EVENTBRITE_ORGANIZER_ID is missing in .env");
  }

  console.log("Eventbrite smoke test");
  console.log(`  Organizer ID: ${organizerId}`);
  console.log(`  Token: ${token.slice(0, 4)}…${token.slice(-4)}`);

  const { source, events: raw } = await collectRawEvents(token, organizerId);
  const mapped = raw.map(mapEvent).filter(Boolean);
  const events = sortUpcoming(mapped);

  console.log(`\nAPI OK via ${source}`);
  console.log(`  ${raw.length} raw event(s), ${events.length} upcoming after filter`);
  printEvents(events);

  if (events.length === 0) {
    console.log(
      "\nConnection works, but this organizer has no upcoming public events to list yet.",
    );
  } else {
    console.log(
      "\nSuccess — /api/events should populate the events list with these.",
    );
  }
}

main().catch((error) => {
  console.error("\nEventbrite test failed:");
  console.error(`  ${error.message}`);
  process.exitCode = 1;
});
