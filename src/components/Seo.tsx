import { useEffect } from "react";

interface SeoProps {
  title: string;
  description: string;
}

export function Seo({ title, description }: SeoProps) {
  useEffect(() => {
    document.title = title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", description);
    }
  }, [title, description]);

  return null;
}
