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
  url: string;
  venue?: EventbriteVenue;
  imageUrl?: string;
}
