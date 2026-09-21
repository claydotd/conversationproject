import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { defaultContent } from "@shared/default-content";
import { normalizeSiteContent } from "@shared/normalize-content";
import type { SiteContent } from "@shared/types";
import { fetchPublishedContent } from "./api";

interface ContentContextValue {
  content: SiteContent;
  loading: boolean;
}

const ContentContext = createContext<ContentContextValue | null>(null);

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchPublishedContent()
      .then((next) => {
        if (!cancelled) setContent(normalizeSiteContent(next));
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
