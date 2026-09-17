import { PageHero } from "../components/PageHero";
import { PageSections } from "../components/PageSections";
import { Seo } from "../components/Seo";
import { TestimonialSection } from "../components/TestimonialSection";
import { useSiteContent } from "../lib/content-context";

export function HomePage() {
  const { content, testimonialsFor } = useSiteContent();
  const page = content.pages.home;

  return (
    <>
      <Seo title={page.seoTitle} description={page.seoDescription} />
      <PageHero
        eyebrow={content.site.name}
        heading={page.heroHeading}
        subheading={page.heroSubheading}
      />
      <PageSections sections={page.sections} />
      <TestimonialSection testimonials={testimonialsFor("home")} />
    </>
  );
}
