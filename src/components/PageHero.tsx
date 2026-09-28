import type { ImageDimension } from "@shared/types";
import { useReveal } from "../hooks/useReveal";

interface PageHeroProps {
  eyebrow: string;
  heading: string;
  subheading: string;
  imageUrl?: string;
  imageAlt?: string;
  imageDimension?: ImageDimension;
  className?: string;
  revealDelayMs?: number;
}

export function PageHero({
  eyebrow,
  heading,
  subheading,
  imageUrl = "",
  imageAlt = "",
  imageDimension = "portrait",
  className,
  revealDelayMs = 0,
}: PageHeroProps) {
  const hasImage = Boolean(imageUrl);
  const reveal = useReveal<HTMLElement>({
    delayMs: revealDelayMs,
    contents: true,
  });
  const classes = [
    "hero",
    hasImage ? "hero--with-image" : "",
    className,
    reveal.className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={classes} ref={reveal.ref} style={reveal.style}>
      <div className="page hero__inner">
        <div className="hero__copy">
          {eyebrow ? <p className="hero__eyebrow">{eyebrow}</p> : null}
          {heading ? <h1>{heading}</h1> : null}
          {subheading ? <p className="hero__sub">{subheading}</p> : null}
        </div>
        {hasImage ? (
          <div className={`hero__media hero__media--${imageDimension}`}>
            <img src={imageUrl} alt={imageAlt} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
