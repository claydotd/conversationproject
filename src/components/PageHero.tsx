import { sectionColorVar } from "@shared/page-sections";
import type { HeroLinkMode, ImageDimension, SectionBackground } from "@shared/types";
import { useReveal } from "../hooks/useReveal";
import { SocialLinkButtons } from "./SocialLinks";

interface PageHeroProps {
  eyebrow: string;
  heading: string;
  subheading: string;
  eyebrowColor?: SectionBackground;
  headingColor?: SectionBackground;
  subheadingColor?: SectionBackground;
  imageUrl?: string;
  imageAlt?: string;
  imageDimension?: ImageDimension;
  linkMode?: HeroLinkMode;
  customLinkLabel?: string;
  customLinkUrl?: string;
  className?: string;
  revealDelayMs?: number;
}

export function HeroActions({
  linkMode,
  customLinkLabel,
  customLinkUrl,
}: {
  linkMode: HeroLinkMode;
  customLinkLabel: string;
  customLinkUrl: string;
}) {
  if (linkMode === "social") {
    return <SocialLinkButtons className="hero__actions" />;
  }

  if (linkMode === "custom" && customLinkLabel.trim() && customLinkUrl.trim()) {
    return (
      <div className="hero__actions">
        <a className="hero__cta button-link" href={customLinkUrl}>
          {customLinkLabel}
        </a>
      </div>
    );
  }

  return null;
}

function textColorStyle(color: SectionBackground | undefined) {
  const value = sectionColorVar(color ?? "default");
  return value ? { color: value } : undefined;
}

export function PageHero({
  eyebrow,
  heading,
  subheading,
  eyebrowColor = "default",
  headingColor = "default",
  subheadingColor = "default",
  imageUrl = "",
  imageAlt = "",
  imageDimension = "landscape",
  linkMode = "none",
  customLinkLabel = "",
  customLinkUrl = "",
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
          {eyebrow ? (
            <p className="hero__eyebrow" style={textColorStyle(eyebrowColor)}>
              {eyebrow}
            </p>
          ) : null}
          {heading ? (
            <h1 style={textColorStyle(headingColor)}>{heading}</h1>
          ) : null}
          {subheading ? (
            <p className="hero__sub" style={textColorStyle(subheadingColor)}>
              {subheading}
            </p>
          ) : null}
        </div>
        <HeroActions
          linkMode={linkMode}
          customLinkLabel={customLinkLabel}
          customLinkUrl={customLinkUrl}
        />
      </div>
      {hasImage ? (
        <div className={`hero__media hero__media--${imageDimension}`}>
          <img src={imageUrl} alt={imageAlt} />
        </div>
      ) : null}
    </section>
  );
}
