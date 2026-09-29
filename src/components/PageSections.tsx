import type { ReactNode } from "react";
import type {
  ImageSection,
  PageSection,
  SectionBackground,
  TestimonialSection as TestimonialContent,
  TextAlign,
} from "@shared/types";
import { sectionColorVar, sectionSurfaceClass } from "@shared/page-sections";
import { parseInlineMarkdown } from "@shared/inline-markdown";
import { revealDelayForIndex, useReveal } from "../hooks/useReveal";
import { ContactForm } from "./ContactForm";
import { EventList } from "./EventList";
import { PageHero, HeroActions } from "./PageHero";
import { SocialLinks } from "./SocialLinks";
import { TestimonialsClothesline } from "./TestimonialSection";

type SectionCluster =
  | { kind: "section"; section: PageSection }
  | { kind: "combined"; primary: PageSection; image: ImageSection }
  | { kind: "testimonials"; items: TestimonialContent[] };

function clusterSections(sections: PageSection[]): SectionCluster[] {
  const clusters: SectionCluster[] = [];
  const combinableTypes = new Set([
    "text",
    "hero",
    "gallery",
    "image",
  ]);

  for (const section of sections) {
    if (section.type === "testimonial") {
      const last = clusters[clusters.length - 1];
      if (last?.kind === "testimonials") {
        last.items.push(section);
      } else {
        clusters.push({ kind: "testimonials", items: [section] });
      }
      continue;
    }

    if (
      section.type === "image" &&
      section.combineWithAbove &&
      section.size !== "full-width" &&
      section.imageUrl
    ) {
      const last = clusters[clusters.length - 1];
      if (
        last?.kind === "section" &&
        combinableTypes.has(last.section.type)
      ) {
        clusters[clusters.length - 1] = {
          kind: "combined",
          primary: last.section,
          image: section,
        };
        continue;
      }
    }

    clusters.push({ kind: "section", section });
  }

  return clusters;
}

function renderInlineToken(
  token: ReturnType<typeof parseInlineMarkdown>[number],
  key: string,
): ReactNode {
  if (token.kind === "text") return <span key={key}>{token.value}</span>;
  const nested = token.children.map((child, index) =>
    renderInlineToken(child, `${key}-${index}`),
  );
  if (token.kind === "bold") return <strong key={key}>{nested}</strong>;
  if (token.kind === "italic") return <em key={key}>{nested}</em>;
  return <u key={key}>{nested}</u>;
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return parseInlineMarkdown(text).map((token, index) =>
    renderInlineToken(token, `${keyPrefix}-${index}`),
  );
}

function paragraphs(text: string, id: string) {
  return text.split(/\n{2,}/).map((paragraph, index) => (
    <p key={`${id}-${index}`}>
      {paragraph.split("\n").map((line, lineIndex, lines) => (
        <span key={`${id}-${index}-l${lineIndex}`}>
          {renderInline(line, `${id}-${index}-l${lineIndex}`)}
          {lineIndex < lines.length - 1 ? <br /> : null}
        </span>
      ))}
    </p>
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
  revealDelayMs = 0,
  stagger = true,
}: {
  background: SectionBackground;
  className: string;
  children: ReactNode;
  revealDelayMs?: number;
  stagger?: boolean;
}) {
  const reveal = useReveal<HTMLDivElement>({
    delayMs: revealDelayMs,
    stagger,
  });

  return (
    <section className={cx(className, sectionSurfaceClass(background))}>
      <div
        className={cx("page", reveal.className)}
        ref={reveal.ref}
        style={reveal.style}
      >
        {children}
      </div>
    </section>
  );
}

function TextBlockContent({
  heading,
  body,
  id,
  headingAlign,
  bodyAlign,
}: {
  heading: string;
  body: string;
  id: string;
  headingAlign: TextAlign;
  bodyAlign: TextAlign;
}) {
  return (
    <>
      {heading ? (
        <h2 className={alignClass(headingAlign)}>{heading}</h2>
      ) : null}
      {body ? (
        <div className={cx("prose", alignClass(bodyAlign))}>
          {paragraphs(body, id)}
        </div>
      ) : null}
    </>
  );
}

function TextBlock({
  heading,
  body,
  id,
  background,
  headingAlign,
  bodyAlign,
  revealDelayMs,
}: {
  heading: string;
  body: string;
  id: string;
  background: SectionBackground;
  headingAlign: TextAlign;
  bodyAlign: TextAlign;
  revealDelayMs?: number;
}) {
  if (!heading && !body) return null;
  return (
    <SectionFrame
      className="section"
      background={background}
      revealDelayMs={revealDelayMs}
    >
      <TextBlockContent
        id={id}
        heading={heading}
        body={body}
        headingAlign={headingAlign}
        bodyAlign={bodyAlign}
      />
    </SectionFrame>
  );
}

function ImageFigure({
  heading,
  imageUrl,
  alt,
  caption,
  size,
  dimension,
}: {
  heading: string;
  imageUrl: string;
  alt: string;
  caption: string;
  size: ImageSection["size"];
  dimension: ImageSection["dimension"];
}) {
  return (
    <div
      className={cx(
        "image-figure",
        `image-figure--${size}`,
        `image-figure--dim-${dimension}`,
      )}
    >
      {heading ? <h2>{heading}</h2> : null}
      <figure>
        <img src={imageUrl} alt={alt} />
        {caption ? <figcaption>{caption}</figcaption> : null}
      </figure>
    </div>
  );
}

function ImageBlock({
  heading,
  imageUrl,
  alt,
  caption,
  background,
  size,
  dimension,
  revealDelayMs,
}: {
  heading: string;
  imageUrl: string;
  alt: string;
  caption: string;
  background: SectionBackground;
  size: ImageSection["size"];
  dimension: ImageSection["dimension"];
  revealDelayMs?: number;
}) {
  if (!imageUrl) return null;
  return (
    <SectionFrame
      className={cx(
        "image-block",
        size === "full-width" && "image-block--full-width",
      )}
      background={background}
      revealDelayMs={revealDelayMs}
    >
      <ImageFigure
        heading={heading}
        imageUrl={imageUrl}
        alt={alt}
        caption={caption}
        size={size}
        dimension={dimension}
      />
    </SectionFrame>
  );
}

function GalleryBlock({
  heading,
  images,
  background,
  revealDelayMs,
}: {
  heading: string;
  images: { id: string; imageUrl: string; alt: string; caption: string }[];
  background: SectionBackground;
  revealDelayMs?: number;
}) {
  const visible = images.filter((image) => image.imageUrl);
  if (visible.length === 0) return null;
  return (
    <SectionFrame
      className="gallery-section"
      background={background}
      revealDelayMs={revealDelayMs}
    >
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

function CombinedPrimaryContent({ section }: { section: PageSection }) {
  switch (section.type) {
    case "hero": {
      const eyebrowColor = sectionColorVar(section.eyebrowColor);
      const headingColor = sectionColorVar(section.headingColor);
      const subheadingColor = sectionColorVar(section.subheadingColor);
      return (
        <div className="hero__copy">
          {section.eyebrow ? (
            <p
              className="hero__eyebrow"
              style={eyebrowColor ? { color: eyebrowColor } : undefined}
            >
              {section.eyebrow}
            </p>
          ) : null}
          {section.heading ? (
            <h1 style={headingColor ? { color: headingColor } : undefined}>
              {section.heading}
            </h1>
          ) : null}
          {section.subheading ? (
            <p
              className="hero__sub"
              style={subheadingColor ? { color: subheadingColor } : undefined}
            >
              {section.subheading}
            </p>
          ) : null}
          <HeroActions
            linkMode={section.linkMode}
            customLinkLabel={section.customLinkLabel}
            customLinkUrl={section.customLinkUrl}
          />
        </div>
      );
    }
    case "text":
      if (!section.heading && !section.body) return null;
      return (
        <TextBlockContent
          id={section.id}
          heading={section.heading}
          body={section.body}
          headingAlign={section.headingAlign}
          bodyAlign={section.bodyAlign}
        />
      );
    case "gallery": {
      const visible = section.images.filter((image) => image.imageUrl);
      if (visible.length === 0 && !section.heading) return null;
      return (
        <>
          {section.heading ? <h2>{section.heading}</h2> : null}
          {visible.length > 0 ? (
            <div className="gallery">
              {visible.map((image) => (
                <figure key={image.id}>
                  <img src={image.imageUrl} alt={image.alt} />
                  {image.caption ? (
                    <figcaption>{image.caption}</figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          ) : null}
        </>
      );
    }
    case "image":
      if (!section.imageUrl) return null;
      return (
        <ImageFigure
          heading={section.heading}
          imageUrl={section.imageUrl}
          alt={section.alt}
          caption={section.caption}
          size={section.size}
          dimension={section.dimension}
        />
      );
    default:
      return null;
  }
}

function CombinedBlock({
  primary,
  image,
  revealDelayMs,
}: {
  primary: PageSection;
  image: ImageSection;
  revealDelayMs?: number;
}) {
  const reveal = useReveal<HTMLDivElement>({
    delayMs: revealDelayMs,
    stagger: true,
  });

  const imageEl = (
    <ImageFigure
      heading={image.heading}
      imageUrl={image.imageUrl}
      alt={image.alt}
      caption={image.caption}
      size={image.size}
      dimension={image.dimension}
    />
  );

  const imageFirst = image.combineSide === "left";
  const frameClass =
    primary.type === "hero" ? "hero combined-section" : "combined-section";

  return (
    <section
      className={cx(frameClass, sectionSurfaceClass(primary.background))}
    >
      <div
        className={cx(
          "page",
          "combined-layout",
          `combined-layout--image-${image.combineSide}`,
          reveal.className,
        )}
        ref={reveal.ref}
        style={reveal.style}
      >
        {imageFirst ? (
          <>
            <div className="combined-layout__media">{imageEl}</div>
            <div className="combined-layout__content">
              <CombinedPrimaryContent section={primary} />
            </div>
          </>
        ) : (
          <>
            <div className="combined-layout__content">
              <CombinedPrimaryContent section={primary} />
            </div>
            <div className="combined-layout__media">{imageEl}</div>
          </>
        )}
      </div>
    </section>
  );
}

function SectionView({
  section,
  revealDelayMs,
}: {
  section: PageSection;
  revealDelayMs?: number;
}) {
  switch (section.type) {
    case "hero":
      if (!section.heading && !section.subheading && !section.imageUrl) {
        return null;
      }
      return (
        <PageHero
          eyebrow={section.eyebrow}
          heading={section.heading}
          subheading={section.subheading}
          eyebrowColor={section.eyebrowColor}
          headingColor={section.headingColor}
          subheadingColor={section.subheadingColor}
          imageUrl={section.imageUrl}
          imageAlt={section.imageAlt}
          imageDimension={section.imageDimension}
          linkMode={section.linkMode}
          customLinkLabel={section.customLinkLabel}
          customLinkUrl={section.customLinkUrl}
          className={sectionSurfaceClass(section.background)}
          revealDelayMs={revealDelayMs}
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
          revealDelayMs={revealDelayMs}
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
          size={section.size}
          dimension={section.dimension}
          revealDelayMs={revealDelayMs}
        />
      );
    case "gallery":
      return (
        <GalleryBlock
          heading={section.heading}
          images={section.images}
          background={section.background}
          revealDelayMs={revealDelayMs}
        />
      );
    case "testimonial":
      return (
        <TestimonialsClothesline
          items={[section]}
          revealDelayMs={revealDelayMs}
        />
      );
    case "events-list":
      return (
        <EventList
          background={section.background}
          revealDelayMs={revealDelayMs}
        />
      );
    case "contact-form":
      return (
        <ContactForm
          background={section.background}
          revealDelayMs={revealDelayMs}
        />
      );
    case "social-links":
      return (
        <SocialLinks
          heading={section.heading}
          headingAlign={section.headingAlign}
          background={section.background}
          revealDelayMs={revealDelayMs}
        />
      );
  }
}

export function PageSections({ sections }: { sections: PageSection[] }) {
  return (
    <div className="page-stack">
      {clusterSections(sections).map((cluster, index) => {
        const delay = revealDelayForIndex(index);
        if (cluster.kind === "testimonials") {
          return (
            <TestimonialsClothesline
              key={cluster.items[0].id}
              items={cluster.items}
              revealDelayMs={delay}
            />
          );
        }
        if (cluster.kind === "combined") {
          return (
            <CombinedBlock
              key={cluster.image.id}
              primary={cluster.primary}
              image={cluster.image}
              revealDelayMs={delay}
            />
          );
        }
        return (
          <SectionView
            key={cluster.section.id}
            section={cluster.section}
            revealDelayMs={delay}
          />
        );
      })}
    </div>
  );
}
