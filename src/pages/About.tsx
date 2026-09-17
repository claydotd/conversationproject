import { PageHero } from "../components/PageHero";
import { PageSections } from "../components/PageSections";
import { Seo } from "../components/Seo";
import { TestimonialSection } from "../components/TestimonialSection";
import { useSiteContent } from "../lib/content-context";

export function AboutPage() {
  const { content, testimonialsFor } = useSiteContent();
  const page = content.pages.about;

  return (
    <>
      <Seo title={page.seoTitle} description={page.seoDescription} />
      <PageHero
        eyebrow="About"
        heading={page.heroHeading}
        subheading={page.heroSubheading}
      />
      <PageSections sections={page.sections} />
      <TestimonialSection testimonials={testimonialsFor("about")} />
    </>
  );
}
