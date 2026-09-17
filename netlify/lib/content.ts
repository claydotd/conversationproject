import { defaultContent } from "../../shared/default-content";
import type {
  ContentSection,
  PageContent,
  PageSlug,
  SiteContent,
  SiteSettings,
  SocialLink,
  Testimonial,
} from "../../shared/types";
import { PAGE_SLUGS } from "../../shared/types";
import { getDb } from "./db";
import { writePublishedContent } from "./blobs";

interface SettingsRow {
  name: string;
  tagline: string;
  footer_text: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  social: SocialLink[] | string;
}

interface PageRow {
  slug: PageSlug;
  title: string;
  hero_heading: string;
  hero_subheading: string;
  sections: ContentSection[] | string;
  seo_title: string;
  seo_description: string;
}

interface TestimonialRow {
  id: string;
  page_slug: PageSlug;
  quote: string;
  author_name: string;
  author_role: string;
  image_url: string;
  sort_order: number | string;
}

function parseJson<T>(value: T | string, fallback: T): T {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function mapSettings(row: SettingsRow): SiteSettings {
  return {
    name: row.name,
    tagline: row.tagline,
    footerText: row.footer_text,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone ?? "",
    contactAddress: row.contact_address ?? "",
    social: parseJson<SocialLink[]>(row.social, []),
  };
}

function mapPage(row: PageRow): PageContent {
  return {
    slug: row.slug,
    title: row.title,
    heroHeading: row.hero_heading,
    heroSubheading: row.hero_subheading,
    sections: parseJson<ContentSection[]>(row.sections, []),
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
  };
}

function mapTestimonial(row: TestimonialRow): Testimonial {
  return {
    id: row.id,
    pageSlug: row.page_slug,
    quote: row.quote,
    authorName: row.author_name,
    authorRole: row.author_role ?? "",
    imageUrl: row.image_url ?? "",
    sortOrder: Number(row.sort_order) || 0,
  };
}

export async function loadContentFromDatabase(): Promise<SiteContent> {
  const db = getDb();
  const [settingsRows, pageRows, testimonialRows] = await Promise.all([
    db.sql`SELECT name, tagline, footer_text, contact_email, contact_phone, contact_address, social FROM site_settings WHERE id = ${"default"}`,
    db.sql`SELECT slug, title, hero_heading, hero_subheading, sections, seo_title, seo_description FROM pages`,
    db.sql`SELECT id, page_slug, quote, author_name, author_role, image_url, sort_order FROM testimonials ORDER BY page_slug, sort_order, created_at`,
  ]);

  const settings = settingsRows[0] as SettingsRow | undefined;
  if (!settings) {
    return structuredClone(defaultContent);
  }

  const pages = { ...defaultContent.pages };
  for (const row of pageRows as PageRow[]) {
    if (PAGE_SLUGS.includes(row.slug)) {
      pages[row.slug] = mapPage(row);
    }
  }

  return {
    site: mapSettings(settings),
    pages,
    testimonials: (testimonialRows as TestimonialRow[]).map(mapTestimonial),
    publishedAt: null,
  };
}

export async function saveContentToDatabase(
  content: SiteContent,
): Promise<SiteContent> {
  const db = getDb();
  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO site_settings (
        id, name, tagline, footer_text, contact_email, contact_phone, contact_address, social, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8, NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        tagline = EXCLUDED.tagline,
        footer_text = EXCLUDED.footer_text,
        contact_email = EXCLUDED.contact_email,
        contact_phone = EXCLUDED.contact_phone,
        contact_address = EXCLUDED.contact_address,
        social = EXCLUDED.social,
        updated_at = NOW()`,
      [
        "default",
        content.site.name,
        content.site.tagline,
        content.site.footerText,
        content.site.contactEmail,
        content.site.contactPhone,
        content.site.contactAddress,
        JSON.stringify(content.site.social ?? []),
      ],
    );

    for (const slug of PAGE_SLUGS) {
      const page = content.pages[slug];
      await client.query(
        `INSERT INTO pages (
          slug, title, hero_heading, hero_subheading, sections, seo_title, seo_description, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7, NOW())
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          hero_heading = EXCLUDED.hero_heading,
          hero_subheading = EXCLUDED.hero_subheading,
          sections = EXCLUDED.sections,
          seo_title = EXCLUDED.seo_title,
          seo_description = EXCLUDED.seo_description,
          updated_at = NOW()`,
        [
          page.slug,
          page.title,
          page.heroHeading,
          page.heroSubheading,
          JSON.stringify(page.sections ?? []),
          page.seoTitle,
          page.seoDescription,
        ],
      );
    }

    await client.query("DELETE FROM testimonials");
    for (const [index, item] of content.testimonials.entries()) {
      await client.query(
        `INSERT INTO testimonials (
          id, page_slug, quote, author_name, author_role, image_url, sort_order
        ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          item.id,
          item.pageSlug,
          item.quote,
          item.authorName,
          item.authorRole ?? "",
          item.imageUrl ?? "",
          Number.isFinite(item.sortOrder) ? item.sortOrder : index,
        ],
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  const saved = await loadContentFromDatabase();
  const published: SiteContent = {
    ...saved,
    publishedAt: new Date().toISOString(),
  };
  await writePublishedContent(published);
  return published;
}
