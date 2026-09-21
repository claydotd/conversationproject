import type {
  GalleryImage,
  PageSection,
  SectionType,
} from "./types";

export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  hero: "Hero",
  text: "Text",
  image: "Image block",
  gallery: "Image gallery",
  testimonial: "Testimonial",
};

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
  switch (type) {
    case "hero":
      return { id, type, eyebrow: "", heading: "", subheading: "" };
    case "text":
      return { id, type, heading: "", body: "" };
    case "image":
      return { id, type, heading: "", imageUrl: "", alt: "", caption: "" };
    case "gallery":
      return { id, type, heading: "", images: [] };
    case "testimonial":
      return {
        id,
        type,
        quote: "",
        authorName: "",
        authorRole: "",
        imageUrl: "",
      };
  }
}
