import type { PageSection } from "@shared/types";
import { PageHero } from "./PageHero";
import { TestimonialSection } from "./TestimonialSection";

function paragraphs(text: string, id: string) {
  return text.split(/\n{2,}/).map((paragraph, index) => (
    <p key={`${id}-${index}`}>{paragraph}</p>
  ));
}

function TextBlock({
  heading,
  body,
  id,
}: {
  heading: string;
  body: string;
  id: string;
}) {
  if (!heading && !body) return null;
  return (
    <section className="section page">
      {heading ? <h2>{heading}</h2> : null}
      {body ? <div className="prose">{paragraphs(body, id)}</div> : null}
    </section>
  );
}

function ImageBlock({
  heading,
  imageUrl,
  alt,
  caption,
}: {
  heading: string;
  imageUrl: string;
  alt: string;
  caption: string;
}) {
  if (!imageUrl) return null;
  return (
    <section className="image-block page">
      {heading ? <h2>{heading}</h2> : null}
      <figure>
        <img src={imageUrl} alt={alt} />
        {caption ? <figcaption>{caption}</figcaption> : null}
      </figure>
    </section>
  );
}

function GalleryBlock({
  heading,
  images,
}: {
  heading: string;
  images: { id: string; imageUrl: string; alt: string; caption: string }[];
}) {
  const visible = images.filter((image) => image.imageUrl);
  if (visible.length === 0) return null;
  return (
    <section className="gallery-section page">
      {heading ? <h2>{heading}</h2> : null}
      <div className="gallery">
        {visible.map((image) => (
          <figure key={image.id}>
            <img src={image.imageUrl} alt={image.alt} />
            {image.caption ? <figcaption>{image.caption}</figcaption> : null}
          </figure>
        ))}
      </div>
    </section>
  );
}

function SectionView({ section }: { section: PageSection }) {
  switch (section.type) {
    case "hero":
      if (!section.heading && !section.subheading) return null;
      return (
        <PageHero
          eyebrow={section.eyebrow}
          heading={section.heading}
          subheading={section.subheading}
        />
      );
    case "text":
      return (
        <TextBlock
          id={section.id}
          heading={section.heading}
          body={section.body}
        />
      );
    case "image":
      return (
        <ImageBlock
          heading={section.heading}
          imageUrl={section.imageUrl}
          alt={section.alt}
          caption={section.caption}
        />
      );
    case "gallery":
      return <GalleryBlock heading={section.heading} images={section.images} />;
    case "testimonial":
      return <TestimonialSection item={section} />;
  }
}

export function PageSections({ sections }: { sections: PageSection[] }) {
  return (
    <div className="page-stack">
      {sections.map((section) => (
        <SectionView key={section.id} section={section} />
      ))}
    </div>
  );
}
