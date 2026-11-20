export const SOCIAL_PLATFORMS = [
  "instagram",
  "facebook",
  "x",
  "linkedin",
  "youtube",
  "tiktok",
  "threads",
  "bluesky",
  "other",
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  x: "X",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  tiktok: "TikTok",
  threads: "Threads",
  bluesky: "Bluesky",
  other: "Other…",
};

export function isSocialPlatform(value: unknown): value is SocialPlatform {
  return (
    typeof value === "string" &&
    (SOCIAL_PLATFORMS as readonly string[]).includes(value)
  );
}

/** Infer a platform from legacy free-text label/url pairs. */
export function inferSocialPlatform(label: string, url: string): SocialPlatform {
  const haystack = `${label} ${url}`.toLowerCase();
  if (haystack.includes("instagram") || haystack.includes("instagr.am")) {
    return "instagram";
  }
  if (haystack.includes("facebook") || haystack.includes("fb.com")) {
    return "facebook";
  }
  if (
    haystack.includes("twitter") ||
    haystack.includes("x.com") ||
    /(?:^|\/\/|\.)x\.com(?:\/|$)/i.test(url)
  ) {
    return "x";
  }
  if (haystack.includes("linkedin")) return "linkedin";
  if (haystack.includes("youtube") || haystack.includes("youtu.be")) {
    return "youtube";
  }
  if (haystack.includes("tiktok")) return "tiktok";
  if (haystack.includes("threads.net") || /\bthreads\b/.test(haystack)) {
    return "threads";
  }
  if (haystack.includes("bluesky") || haystack.includes("bsky.app")) {
    return "bluesky";
  }
  return "other";
}

export function socialLinkDisplayLabel(link: {
  platform: SocialPlatform;
  label: string;
  url: string;
}): string {
  if (link.platform === "other") {
    return link.label.trim() || link.url;
  }
  return SOCIAL_PLATFORM_LABELS[link.platform];
}
