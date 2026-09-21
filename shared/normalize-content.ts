import { createSectionId, isSectionBackground } from "./page-sections";
import { defaultContent } from "./default-content";
import {
  PAGE_SLUGS,
  type GalleryImage,
  type PageContent,
  type PageSection,
  type PageSlug,
  type SectionBackground,
  type SiteContent,
  type SiteSettings,
  type Testimonial,
} from "./types";

interface LegacyPage extends Omit<PageContent, "sections"> {
  heroHeading?: string;
  heroSubheading?: string;
  sections?: unknown;
}

interface LegacySiteContent {
  site?: Partial<SiteSettings> | null;
  pages?: Partial<Record<PageSlug, LegacyPage>> | null;
  testimonials?: Testimonial[] | null;
  publishedAt?: string | null;
}

const PAGE_TITLES: Record<PageSlug, string> = {
  home: "Home",
  about: "About",
  events: "Events",
  contact: "Contact",
  terms: "Terms and conditions",
};

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function normalizeBackground(value: unknown): SectionBackground {
  return isSectionBackground(value) ? value : "default";
}

function normalizeGalleryImage(value: unknown): GalleryImage | null {
  const item = asRecord(value);
  if (!item) return null;
  const imageUrl = asString(item.imageUrl);
  if (!imageUrl) return null;
  return {
    id: asString(item.id) || createSectionId(),
    imageUrl,
    alt: asString(item.alt),
    caption: asString(item.caption),
  };
}

function normalizeSection(value: unknown): PageSection | null {
  const item = asRecord(value);
  if (!item) return null;
  const id = asString(item.id) || createSectionId();
  const type = asString(item.type);
  const background = normalizeBackground(item.background);

  if (type === "hero") {
    return {
      id,
      type: "hero",
      background,
      eyebrow: asString(item.eyebrow),
      heading: asString(item.heading),
      subheading: asString(item.subheading),
    };
  }

  if (type === "text" || (!type && ("heading" in item || "body" in item))) {
    return {
      id,
      type: "text",
      background,
      heading: asString(item.heading),
      body: asString(item.body),
    };
  }

  if (type === "image") {
    return {
      id,
      type: "image",
      background,
      heading: asString(item.heading),
      imageUrl: asString(item.imageUrl),
      alt: asString(item.alt),
      caption: asString(item.caption),
    };
  }

  if (type === "gallery") {
    const images = Array.isArray(item.images)
      ? item.images
          .map(normalizeGalleryImage)
          .filter((image): image is GalleryImage => image !== null)
      : [];
    return {
      id,
      type: "gallery",
      background,
      heading: asString(item.heading),
      images,
    };
  }

  if (type === "testimonial") {
    return {
      id,
      type: "testimonial",
      background,
      quote: asString(item.quote),
      authorName: asString(item.authorName),
      authorRole: asString(item.authorRole),
      imageUrl: asString(item.imageUrl),
    };
  }

  return null;
}

function pageTestimonials(
  testimonials: Testimonial[],
  slug: PageSlug,
): Testimonial[] {
  return testimonials
    .filter((item) => item.pageSlug === slug)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function testimonialsFromPages(
  pages: Record<PageSlug, PageContent>,
): Testimonial[] {
  const items: Testimonial[] = [];
  for (const slug of PAGE_SLUGS) {
    let sortOrder = 0;
    for (const section of pages[slug].sections) {
      if (section.type !== "testimonial") continue;
      items.push({
        id: section.id,
        pageSlug: slug,
        quote: section.quote,
        authorName: section.authorName,
        authorRole: section.authorRole,
        imageUrl: section.imageUrl,
        sortOrder: sortOrder++,
      });
    }
  }
  return items;
}

export function heroFieldsFromPage(page: PageContent): {
  heading: string;
  subheading: string;
} {
  const hero = page.sections.find((section) => section.type === "hero");
  return {
    heading: hero?.heading ?? "",
    subheading: hero?.subheading ?? "",
  };
}

function normalizePage(
  slug: PageSlug,
  raw: LegacyPage | undefined,
  testimonials: Testimonial[],
): PageContent {
  const title = asString(raw?.title) || PAGE_TITLES[slug];
  const sections = Array.isArray(raw?.sections)
    ? raw.sections
        .map(normalizeSection)
        .filter((section): section is PageSection => section !== null)
    : [];

  const hasHero = sections.some((section) => section.type === "hero");
  const heading = asString(raw?.heroHeading);
  const subheading = asString(raw?.heroSubheading);
  if (!hasHero && (heading || subheading)) {
    sections.unshift({
      id: `${slug}-hero`,
      type: "hero",
      background: "default",
      eyebrow: title,
      heading,
      subheading,
    });
  }

  const hasTestimonial = sections.some(
    (section) => section.type === "testimonial",
  );
  if (!hasTestimonial) {
    for (const item of pageTestimonials(testimonials, slug)) {
      sections.push({
        id: item.id,
        type: "testimonial",
        background: "default",
        quote: item.quote,
        authorName: item.authorName,
        authorRole: item.authorRole,
        imageUrl: item.imageUrl,
      });
    }
  }

  return {
    slug,
    title,
    sections,
    seoTitle: asString(raw?.seoTitle) || title,
    seoDescription: asString(raw?.seoDescription),
  };
}

export function normalizeSiteContent(
  raw: SiteContent | LegacySiteContent | null | undefined,
): SiteContent {
  const pages = {} as Record<PageSlug, PageContent>;
  const testimonials = Array.isArray(raw?.testimonials)
    ? raw.testimonials
    : [];

  for (const slug of PAGE_SLUGS) {
    pages[slug] = normalizePage(
      slug,
      raw?.pages?.[slug] ?? defaultContent.pages[slug],
      testimonials,
    );
  }

  return {
    site: {
      name: asString(raw?.site?.name),
      tagline: asString(raw?.site?.tagline),
      footerText: asString(raw?.site?.footerText),
      contactEmail: asString(raw?.site?.contactEmail),
      contactPhone: asString(raw?.site?.contactPhone),
      contactAddress: asString(raw?.site?.contactAddress),
      newsletterHeading:
        typeof raw?.site?.newsletterHeading === "string"
          ? raw.site.newsletterHeading
          : defaultContent.site.newsletterHeading,
      newsletterParagraph:
        typeof raw?.site?.newsletterParagraph === "string"
          ? raw.site.newsletterParagraph
          : defaultContent.site.newsletterParagraph,
      newsletterConsentLabel:
        typeof raw?.site?.newsletterConsentLabel === "string"
          ? raw.site.newsletterConsentLabel
          : defaultContent.site.newsletterConsentLabel,
      social: Array.isArray(raw?.site?.social) ? raw.site.social : [],
    },
    pages,
    testimonials: testimonialsFromPages(pages),
    publishedAt:
      typeof raw?.publishedAt === "string" ? raw.publishedAt : null,
  };
}
