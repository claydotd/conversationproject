import type { SocialPlatform } from "@shared/social";
import { socialLinkDisplayLabel } from "@shared/social";
import type { SectionBackground, TextAlign } from "@shared/types";
import { sectionSurfaceClass } from "@shared/page-sections";
import { useReveal } from "../hooks/useReveal";
import { useSiteContent } from "../lib/content-context";

type IconPlatform = Exclude<SocialPlatform, "other"> | "link";

function iconPlatform(platform: SocialPlatform): IconPlatform {
  return platform === "other" ? "link" : platform;
}

function SocialIcon({ platform }: { platform: IconPlatform }) {
  const common = {
    className: "social-links__icon",
    viewBox: "0 0 24 24",
    width: "1.15rem",
    height: "1.15rem",
    "aria-hidden": true as const,
    focusable: false as const,
  };

  switch (platform) {
    case "instagram":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.75">
          <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...common} fill="currentColor">
          <path d="M14.5 8.5V6.8c0-.7.5-1.3 1.2-1.3H17V3h-1.8C12.8 3 11 4.8 11 7v1.5H9v3h2V21h3.5v-9.5H17l.5-3h-3z" />
        </svg>
      );
    case "x":
      return (
        <svg {...common} fill="currentColor">
          <path d="M4 4h4.2l4.1 5.7L17.2 4H20l-6.1 7.1L20.5 20h-4.2l-4.5-6.2L7 20H4.2l6.5-7.5L4 4z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...common} fill="currentColor">
          <path d="M6.2 9.5H3.5V20h2.7V9.5zM4.85 4A1.6 1.6 0 1 0 4.86 7.2 1.6 1.6 0 0 0 4.85 4zM20.5 20h-2.7v-5.5c0-1.55-.55-2.6-1.9-2.6-1.04 0-1.66.7-1.93 1.38-.1.24-.12.58-.12.92V20h-2.7s.04-8.4 0-9.28h2.7v1.32c.36-.55 1-1.34 2.44-1.34 1.78 0 3.11 1.16 3.11 3.66V20z" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common} fill="currentColor">
          <path d="M21.6 7.6a2.5 2.5 0 0 0-1.76-1.77C18.2 5.5 12 5.5 12 5.5s-6.2 0-7.84.33A2.5 2.5 0 0 0 2.4 7.6 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.4 2.5 2.5 0 0 0 1.76 1.77C5.8 18.5 12 18.5 12 18.5s6.2 0 7.84-.33a2.5 2.5 0 0 0 1.76-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.4zM10 15.2V8.8l5.2 3.2L10 15.2z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common} fill="currentColor">
          <path d="M16.5 3c.4 2.4 1.8 3.9 4 4.3v2.6c-1.4.1-2.7-.3-4-1.1v5.7c0 3.4-2.5 5.9-6.1 5.9A5.9 5.9 0 0 1 4.5 14.4c0-3.4 2.7-5.9 6-5.9.3 0 .7 0 1 .1v2.8a3.1 3.1 0 0 0-1-.2 3.1 3.1 0 0 0-3.1 3.1c0 1.7 1.4 3.1 3.1 3.1s3.1-1.3 3.1-3.1V3h2.9z" />
        </svg>
      );
    case "threads":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M9.2 11.6c.4-2.4 1.8-3.6 3.8-3.6 2.6 0 3.8 1.6 3.8 4.2 0 3.4-1.5 5.6-4.4 5.6-2.4 0-4-1.6-4-4.1 0-3.7 2.8-5.7 6.4-5.7 1.5 0 2.9.3 4 .8" />
          <path d="M8.4 13.2c.6 2.8 2.2 4.2 4.6 4.2" />
        </svg>
      );
    case "bluesky":
      return (
        <svg {...common} fill="currentColor">
          <path d="M6.3 4.8c2.3 1.7 4.8 5.2 5.7 7.1.9-1.9 3.4-5.4 5.7-7.1 1.7-1.3 4.3-2.3 4.3.9 0 .6-.4 5.2-.6 6-.9 2.5-3.9 3.1-6.6 2.7 4.8.8 6 3.5 3.4 6.2-5 5.1-7.2-1.3-7.7-3-.5 1.7-2.8 8-7.7 3-2.6-2.7-1.4-5.4 3.4-6.2-2.7.4-5.7-.2-6.6-2.7-.2-.8-.6-5.4-.6-6 0-3.2 2.6-2.2 4.3-.9z" />
        </svg>
      );
    default:
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M10 14a4.5 4.5 0 0 0 6.4.4l2.1-2.1a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2" />
          <path d="M14 10a4.5 4.5 0 0 0-6.4-.4L5.5 11.7a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2" />
        </svg>
      );
  }
}

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function alignClass(align: TextAlign) {
  return `text-align-${align}`;
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
        <div
          className={cx(
            "social-links",
            headingAlign === "left" && "social-links--start",
            headingAlign === "right" && "social-links--end",
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
                <SocialIcon platform={iconPlatform(item.platform)} />
                <span>{label}</span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
