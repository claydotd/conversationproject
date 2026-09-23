import type { ReactNode } from "react";
import type { PageSection, SectionBackground, TextAlign } from "@shared/types";
import { sectionSurfaceClass } from "@shared/page-sections";
import { ContactForm } from "./ContactForm";
import { EventList } from "./EventList";
import { PageHero } from "./PageHero";
import { TestimonialSection } from "./TestimonialSection";

function paragraphs(text: string, id: string) {
  return text.split(/\n{2,}/).map((paragraph, index) => (
    <p key={`${id}-${index}`}>{paragraph}</p>
  ));
}

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function alignClass(align: TextAlign) {
  return `text-align-${align}`;
}

function SectionFrame({
  background,
  className,
  children,
}: {
  background: SectionBackground;
  className: string;
  children: ReactNode;
}) {
  return (
    <section className={cx(className, sectionSurfaceClass(background))}>
      <div className="page">{children}</div>
    </section>
  );
}

function TextBlock({
  heading,
  body,
  id,
  background,
  headingAlign,
  bodyAlign,
}: {
  heading: string;
  body: string;
  id: string;
  background: SectionBackground;
  headingAlign: TextAlign;
  bodyAlign: TextAlign;
}) {
  if (!heading && !body) return null;
  return (
    <SectionFrame className="section" background={background}>
      {heading ? (
        <h2 className={alignClass(headingAlign)}>{heading}</h2>
      ) : null}
      {body ? (
        <div className={cx("prose", alignClass(bodyAlign))}>
          {paragraphs(body, id)}
        </div>
      ) : null}
    </SectionFrame>
  );
}

function ImageBlock({
  heading,
  imageUrl,
  alt,
  caption,
  background,
}: {
  heading: string;
  imageUrl: string;
  alt: string;
  caption: string;
  background: SectionBackground;
}) {
  if (!imageUrl) return null;
  return (
    <SectionFrame className="image-block" background={background}>
      {heading ? <h2>{heading}</h2> : null}
      <figure>
        <img src={imageUrl} alt={alt} />
        {caption ? <figcaption>{caption}</figcaption> : null}
      </figure>
    </SectionFrame>
  );
}

function GalleryBlock({
  heading,
  images,
  background,
}: {
  heading: string;
  images: { id: string; imageUrl: string; alt: string; caption: string }[];
  background: SectionBackground;
}) {
  const visible = images.filter((image) => image.imageUrl);
  if (visible.length === 0) return null;
  return (
    <SectionFrame className="gallery-section" background={background}>
      {heading ? <h2>{heading}</h2> : null}
      <div className="gallery">
        {visible.map((image) => (
          <figure key={image.id}>
            <img src={image.imageUrl} alt={image.alt} />
            {image.caption ? <figcaption>{image.caption}</figcaption> : null}
          </figure>
        ))}
      </div>
    </SectionFrame>
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
          className={sectionSurfaceClass(section.background)}
        />
      );
    case "text":
      return (
        <TextBlock
          id={section.id}
          heading={section.heading}
          body={section.body}
          background={section.background}
          headingAlign={section.headingAlign}
          bodyAlign={section.bodyAlign}
        />
      );
    case "image":
      return (
        <ImageBlock
          heading={section.heading}
          imageUrl={section.imageUrl}
          alt={section.alt}
          caption={section.caption}
          background={section.background}
        />
      );
    case "gallery":
      return (
        <GalleryBlock
          heading={section.heading}
          images={section.images}
          background={section.background}
        />
      );
    case "testimonial":
      return <TestimonialSection item={section} />;
    case "events-list":
      return <EventList background={section.background} />;
    case "contact-form":
      return <ContactForm background={section.background} />;
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
