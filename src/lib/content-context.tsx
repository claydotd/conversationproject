import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { defaultContent } from "@shared/default-content";
import type { PageSlug, SiteContent, Testimonial } from "@shared/types";
import { fetchPublishedContent } from "./api";

interface ContentContextValue {
  content: SiteContent;
  loading: boolean;
  testimonialsFor: (slug: PageSlug) => Testimonial[];
}

const ContentContext = createContext<ContentContextValue | null>(null);

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchPublishedContent()
      .then((next) => {
        if (!cancelled) setContent(next);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      content,
      loading,
      testimonialsFor: (slug: PageSlug) =>
        content.testimonials
          .filter((item) => item.pageSlug === slug)
          .sort((a, b) => a.sortOrder - b.sortOrder),
    }),
    [content, loading],
  );

  return (
    <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
  );
}

export function useSiteContent() {
  const value = useContext(ContentContext);
  if (!value) {
    throw new Error("useSiteContent must be used within ContentProvider");
  }
  return value;
}
