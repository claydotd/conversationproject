import type { ReactNode } from "react";
import type { PageSlug } from "@shared/types";
import { PageSections } from "./PageSections";
import { Seo } from "./Seo";
import { useSiteContent } from "../lib/content-context";

export function CmsPage({
  slug,
  children,
}: {
  slug: PageSlug;
  children?: ReactNode;
}) {
  const { content } = useSiteContent();
  const page = content.pages[slug];

  return (
    <>
      <Seo title={page.seoTitle} description={page.seoDescription} />
      <PageSections sections={page.sections} />
      {children}
    </>
  );
}
