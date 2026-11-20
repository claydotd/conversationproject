import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faBluesky } from "@fortawesome/free-brands-svg-icons/faBluesky";
import { faFacebook } from "@fortawesome/free-brands-svg-icons/faFacebook";
import { faInstagram } from "@fortawesome/free-brands-svg-icons/faInstagram";
import { faLinkedin } from "@fortawesome/free-brands-svg-icons/faLinkedin";
import { faThreads } from "@fortawesome/free-brands-svg-icons/faThreads";
import { faTiktok } from "@fortawesome/free-brands-svg-icons/faTiktok";
import { faXTwitter } from "@fortawesome/free-brands-svg-icons/faXTwitter";
import { faYoutube } from "@fortawesome/free-brands-svg-icons/faYoutube";
import { faLink } from "@fortawesome/free-solid-svg-icons/faLink";
import type { SocialPlatform } from "@shared/social";

const ICONS: Record<SocialPlatform, IconDefinition> = {
  instagram: faInstagram,
  facebook: faFacebook,
  x: faXTwitter,
  linkedin: faLinkedin,
  youtube: faYoutube,
  tiktok: faTiktok,
  threads: faThreads,
  bluesky: faBluesky,
  other: faLink,
};

export function SocialPlatformIcon({
  platform,
  className,
}: {
  platform: SocialPlatform;
  className?: string;
}) {
  const icon = ICONS[platform].icon;
  const [width, height, , , pathData] = icon;
  const paths = Array.isArray(pathData) ? pathData : [pathData];

  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      width="1.15em"
      height="1.15em"
      aria-hidden="true"
      focusable="false"
      role="img"
    >
      {paths.map((d) => (
        <path key={d} fill="currentColor" d={d} />
      ))}
    </svg>
  );
}
