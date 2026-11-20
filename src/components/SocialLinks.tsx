import { socialLinkDisplayLabel } from "@shared/social";
import type { SectionBackground, TextAlign } from "@shared/types";
import { sectionSurfaceClass } from "@shared/page-sections";
import { useReveal } from "../hooks/useReveal";
import { SocialPlatformIcon } from "../icons/SocialPlatformIcon";
import { useSiteContent } from "../lib/content-context";

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function alignClass(align: TextAlign) {
  return `text-align-${align}`;
}

export function SocialLinkButtons({
  className,
  align = "center",
}: {
  className?: string;
  align?: TextAlign;
}) {
  const { content } = useSiteContent();
  const links = content.site.social.filter((item) => item.url.trim());
  if (links.length === 0) return null;

  return (
    <div
      className={cx(
        "social-links",
        align === "left" && "social-links--start",
        align === "right" && "social-links--end",
        className,
      )}
    >
      {links.map((item) => {
        const label = socialLinkDisplayLabel(item);
        return (
          <a
            key={`${item.platform}-${item.url}-${label}`}
            className="social-links__button"
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <SocialPlatformIcon
              platform={item.platform}
              className="social-links__icon"
            />
            <span>{label}</span>
          </a>
        );
      })}
    </div>
  );
}

export function SocialLinks({
  heading,
  headingAlign = "center",
  background = "default",
  revealDelayMs = 0,
}: {
  heading?: string;
  headingAlign?: TextAlign;
  background?: SectionBackground;
  revealDelayMs?: number;
}) {
  const { content } = useSiteContent();
  const links = content.site.social.filter((item) => item.url.trim());
  const reveal = useReveal<HTMLDivElement>({
    delayMs: revealDelayMs,
    stagger: true,
  });

  if (links.length === 0) return null;

  return (
    <section
      className={cx(
        "section",
        "social-links-section",
        sectionSurfaceClass(background),
      )}
    >
      <div
        className={cx("page", reveal.className)}
        ref={reveal.ref}
        style={reveal.style}
      >
        {heading ? <h2 className={alignClass(headingAlign)}>{heading}</h2> : null}
        <SocialLinkButtons align={headingAlign} />
      </div>
    </section>
  );
}
