export const PAGE_SLUGS = ["home", "about", "contact"] as const;
export type PageSlug = (typeof PAGE_SLUGS)[number];

export interface SocialLink {
  label: string;
  url: string;
}

export interface SiteSettings {
  name: string;
  tagline: string;
  footerText: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  social: SocialLink[];
}

export interface ContentSection {
  id: string;
  heading: string;
  body: string;
}

export interface PageContent {
  slug: PageSlug;
  title: string;
  heroHeading: string;
  heroSubheading: string;
  sections: ContentSection[];
  seoTitle: string;
  seoDescription: string;
}

export interface Testimonial {
  id: string;
  pageSlug: PageSlug;
  quote: string;
  authorName: string;
  authorRole: string;
  imageUrl: string;
  sortOrder: number;
}

export interface SiteContent {
  site: SiteSettings;
  pages: Record<PageSlug, PageContent>;
  testimonials: Testimonial[];
  publishedAt: string | null;
}

export const UPCOMING_FEATURES = {
  shop: {
    path: "/shop",
    provider: "sumup",
    envVars: ["SUMUP_API_KEY", "SUMUP_MERCHANT_CODE", "SUMUP_PAY_TO_EMAIL"],
  },
  events: {
    path: "/events",
    provider: "eventbrite",
    envVars: ["EVENTBRITE_API_KEY", "EVENTBRITE_ORGANIZER_ID"],
  },
} as const;
