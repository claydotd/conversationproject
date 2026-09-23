import { useEffect, useState } from "react";
import {
  formatEventPlace,
  formatEventSchedule,
  type EventsListing,
  type SiteEvent,
} from "@shared/events";
import type { SectionBackground } from "@shared/types";
import { sectionSurfaceClass } from "@shared/page-sections";
import { fetchEvents } from "../lib/api";

function EventCard({ event }: { event: SiteEvent }) {
  const place = formatEventPlace(event);
  const date = formatEventSchedule(event);

  return (
    <a
      className="event-card"
      href={event.url}
      target="_blank"
      rel="noreferrer"
    >
      {event.imageUrl ? (
        <img src={event.imageUrl} alt="" />
      ) : (
        <div className="event-card__placeholder" aria-hidden="true" />
      )}
      <div className="event-card__body">
        {date ? <p className="event-card__date">{date}</p> : null}
        <h3>{event.name}</h3>
        {place ? <p className="event-card__place">{place}</p> : null}
        {event.summary ? (
          <p className="event-card__summary">{event.summary}</p>
        ) : null}
        <p className="event-card__cta">View on Eventbrite</p>
      </div>
    </a>
  );
}

export function EventList({
  background = "default",
}: {
  background?: SectionBackground;
}) {
  const [listing, setListing] = useState<EventsListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const surface = sectionSurfaceClass(background);

  useEffect(() => {
    let cancelled = false;
    fetchEvents()
      .then((next) => {
        if (!cancelled) setListing(next);
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load events right now.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const events = listing?.events ?? [];

  return (
    <section
      className={["section", "page", "events-section", surface]
        .filter(Boolean)
        .join(" ")}
    >
      <div aria-live="polite">
        {loading ? <p className="muted">Loading events…</p> : null}
        {!loading && error ? <p className="muted">{error}</p> : null}
        {!loading && !error && events.length === 0 ? (
          <p className="muted">No upcoming events</p>
        ) : null}
        {!loading && !error && events.length > 0 ? (
          <div className="event-grid">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
