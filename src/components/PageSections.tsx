import type { ContentSection } from "@shared/types";

export function PageSections({ sections }: { sections: ContentSection[] }) {
  return (
    <>
      {sections.map((section) => (
        <section className="section page" key={section.id}>
          {section.heading ? <h2>{section.heading}</h2> : null}
          <div className="prose">
            {section.body.split(/\n{2,}/).map((paragraph, index) => (
              <p key={`${section.id}-${index}`}>{paragraph}</p>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
