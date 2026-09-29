import type { SocialPlatform } from "./social";

export const PAGE_SLUGS = ["home", "about", "events", "contact", "terms"] as const;
export type PageSlug = (typeof PAGE_SLUGS)[number];

export const SECTION_TYPES = [
  "hero",
  "text",
  "image",
  "gallery",
  "testimonial",
  "social-links",
  "events-list",
  "contact-form",
] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

/** Section types editors can add; permanent page blocks are excluded. */
export const ADDABLE_SECTION_TYPES = [
  "hero",
  "text",
  "image",
  "gallery",
  "testimonial",
  "social-links",
] as const;
export type AddableSectionType = (typeof ADDABLE_SECTION_TYPES)[number];

export const PERMANENT_SECTION_TYPES = [
  "events-list",
  "contact-form",
] as const;
export type PermanentSectionType = (typeof PERMANENT_SECTION_TYPES)[number];

export const TEXT_ALIGNS = ["left", "center", "right"] as const;
export type TextAlign = (typeof TEXT_ALIGNS)[number];

export const IMAGE_SIZES = ["small", "medium", "large", "full-width"] as const;
export type ImageSize = (typeof IMAGE_SIZES)[number];

export const IMAGE_DIMENSIONS = [
  "square",
  "landscape",
  "portrait",
  "uncropped",
] as const;
export type ImageDimension = (typeof IMAGE_DIMENSIONS)[number];

export const HERO_LINK_MODES = ["none", "social", "custom"] as const;
export type HeroLinkMode = (typeof HERO_LINK_MODES)[number];

export const COMBINE_SIDES = ["left", "right"] as const;
export type CombineSide = (typeof COMBINE_SIDES)[number];

export const SECTION_BACKGROUNDS = [
  "default",
  "dark-background",
  "mid-background",
  "light-background",
  "paper",
  "paper-deep",
  "ink",
  "ink-soft",
  "accent",
  "accent-deep",
  "sage",
] as const;
export type SectionBackground = (typeof SECTION_BACKGROUNDS)[number];

interface PageSectionBase {
  id: string;
  background: SectionBackground;
}

export interface SocialLink {
  platform: SocialPlatform;
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
  newsletterHeading: string;
  newsletterParagraph: string;
  newsletterConsentLabel: string;
  social: SocialLink[];
}

export interface HeroSection extends PageSectionBase {
  type: "hero";
  eyebrow: string;
  heading: string;
  subheading: string;
  eyebrowColor: SectionBackground;
  headingColor: SectionBackground;
  subheadingColor: SectionBackground;
  imageUrl: string;
  imageAlt: string;
  imageDimension: ImageDimension;
  imageOverlay: boolean;
  linkMode: HeroLinkMode;
  customLinkLabel: string;
  customLinkUrl: string;
}

export interface TextSection extends PageSectionBase {
  type: "text";
  heading: string;
  body: string;
  headingAlign: TextAlign;
  bodyAlign: TextAlign;
}

export interface EventsListSection extends PageSectionBase {
  type: "events-list";
}

export interface ContactFormSection extends PageSectionBase {
  type: "contact-form";
}

export interface SocialLinksSection extends PageSectionBase {
  type: "social-links";
  heading: string;
  headingAlign: TextAlign;
}

export interface ImageSection extends PageSectionBase {
  type: "image";
  heading: string;
  imageUrl: string;
  alt: string;
  caption: string;
  size: ImageSize;
  dimension: ImageDimension;
  combineWithAbove: boolean;
  combineSide: CombineSide;
}

export interface GalleryImage {
  id: string;
  imageUrl: string;
  alt: string;
  caption: string;
}

export interface GallerySection extends PageSectionBase {
  type: "gallery";
  heading: string;
  images: GalleryImage[];
}

export interface TestimonialSection extends PageSectionBase {
  type: "testimonial";
  quote: string;
  authorName: string;
  authorRole: string;
  imageUrl: string;
}

export type PageSection =
  | HeroSection
  | TextSection
  | ImageSection
  | GallerySection
  | TestimonialSection
  | SocialLinksSection
  | EventsListSection
  | ContactFormSection;

export interface PageContent {
  slug: PageSlug;
  title: string;
  sections: PageSection[];
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

export const SITE_FEATURES = {
  shop: {
    path: "/shop",
    provider: "sumup",
    envVars: [
      "SUMUP_API_KEY",
      "SUMUP_MERCHANT_CODE",
      "SUMUP_PAY_TO_EMAIL",
      "RESEND_API_KEY",
      "RESEND_FROM_EMAIL",
      "PUBLIC_SITE_URL",
    ],
  },
  events: {
    path: "/events",
    provider: "eventbrite",
    envVars: ["EVENTBRITE_API_KEY", "EVENTBRITE_ORGANIZER_ID"],
  },
} as const;
