import {
  SECTION_BACKGROUNDS,
  type GalleryImage,
  type PageSection,
  type PermanentSectionType,
  type SectionBackground,
  type SectionType,
  type TextAlign,
} from "./types";

export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  hero: "Hero",
  text: "Text",
  image: "Image block",
  gallery: "Image gallery",
  testimonial: "Testimonial",
  "events-list": "Events list",
  "contact-form": "Contact form",
};

export const TEXT_ALIGN_LABELS: Record<TextAlign, string> = {
  left: "Left",
  center: "Center",
  right: "Right",
};

export const SECTION_BACKGROUND_LABELS: Record<SectionBackground, string> = {
  default: "Default",
  "dark-background": "Dark background",
  "mid-background": "Mid background",
  "light-background": "Light background",
  paper: "Paper",
  "paper-deep": "Deep paper",
  ink: "Ink",
  "ink-soft": "Soft ink",
  accent: "Accent",
  "accent-deep": "Deep accent",
  sage: "Sage",
};

const INVERSE_BACKGROUNDS = new Set<SectionBackground>([
  "dark-background",
  "ink",
  "ink-soft",
  "accent",
  "accent-deep",
  "sage",
]);

const PERMANENT_TYPES = new Set<string>(["events-list", "contact-form"]);

export function isPermanentSectionType(
  type: SectionType,
): type is PermanentSectionType {
  return PERMANENT_TYPES.has(type);
}

export function isTextAlign(value: unknown): value is TextAlign {
  return value === "left" || value === "center" || value === "right";
}

export function isSectionBackground(
  value: unknown,
): value is SectionBackground {
  return (
    typeof value === "string" &&
    (SECTION_BACKGROUNDS as readonly string[]).includes(value)
  );
}

export function sectionSurfaceClass(background: SectionBackground): string {
  if (background === "default") return "";
  const classes = ["section-bg", `section-bg--${background}`];
  if (INVERSE_BACKGROUNDS.has(background)) {
    classes.push("section-bg--inverse");
  }
  return classes.join(" ");
}

export function createSectionId(): string {
  return crypto.randomUUID();
}

export function createGalleryImage(): GalleryImage {
  return {
    id: createSectionId(),
    imageUrl: "",
    alt: "",
    caption: "",
  };
}

export function createPageSection(type: SectionType): PageSection {
  const id = createSectionId();
  const background: SectionBackground = "default";
  switch (type) {
    case "hero":
      return { id, type, background, eyebrow: "", heading: "", subheading: "" };
    case "text":
      return {
        id,
        type,
        background,
        heading: "",
        body: "",
        headingAlign: "left",
        bodyAlign: "left",
      };
    case "image":
      return {
        id,
        type,
        background,
        heading: "",
        imageUrl: "",
        alt: "",
        caption: "",
      };
    case "gallery":
      return { id, type, background, heading: "", images: [] };
    case "testimonial":
      return {
        id,
        type,
        background,
        quote: "",
        authorName: "",
        authorRole: "",
        imageUrl: "",
      };
    case "events-list":
      return { id, type, background };
    case "contact-form":
      return { id, type, background };
  }
}
