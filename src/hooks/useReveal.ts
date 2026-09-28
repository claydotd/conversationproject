import { useEffect, useRef, type CSSProperties, type RefObject } from "react";

type RevealOptions = {
  /** Extra delay before the transition starts once visible (ms). */
  delayMs?: number;
  /** Also mark as `.reveal-stagger` so direct children cascade in. */
  stagger?: boolean;
  /**
   * Observer target only — element itself does not fade.
   * Use when descendants (e.g. hero copy lines) own the motion.
   */
  contents?: boolean;
  /**
   * Re-bind the observer when this value changes (e.g. after async content mounts).
   */
  observeKey?: string | number | boolean;
};

type RevealProps<T extends HTMLElement> = {
  ref: RefObject<T | null>;
  className: string;
  style?: CSSProperties;
};

/**
 * Marks an element with `.reveal` and adds `.is-revealed` when it enters the viewport.
 * Pair with `stagger: true` to cascade child fades.
 */
export function useReveal<T extends HTMLElement = HTMLElement>(
  options: RevealOptions = {},
): RevealProps<T> {
  const ref = useRef<T | null>(null);
  const { delayMs = 0, stagger = false, contents = false, observeKey } = options;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (node.classList.contains("is-revealed")) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      node.classList.add("is-revealed");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          node.classList.add("is-revealed");
          observer.unobserve(node);
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -5% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [observeKey]);

  const className = [
    "reveal",
    stagger ? "reveal-stagger" : "",
    contents ? "reveal--contents" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const style =
    delayMs > 0
      ? ({ "--reveal-delay": `${delayMs}ms` } as CSSProperties)
      : undefined;

  return { ref, className, style };
}

/** Soft cascade delay for sibling sections that share the first viewport. */
export function revealDelayForIndex(index: number): number {
  return Math.min(index, 5) * 75;
}
