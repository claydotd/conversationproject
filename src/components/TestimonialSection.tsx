import { sectionSurfaceClass } from "@shared/page-sections";
import type { TestimonialSection as TestimonialContent } from "@shared/types";

export function TestimonialSection({ item }: { item: TestimonialContent }) {
  if (!item.quote && !item.authorName) return null;

  return (
    <section
      className={["testimonial-section", sectionSurfaceClass(item.background)]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="page">
        <figure
          className={
            item.imageUrl ? "testimonial testimonial--with-image" : "testimonial"
          }
        >
          {item.imageUrl ? (
            <img src={item.imageUrl} alt="" width={88} height={88} />
          ) : null}
          <div>
            {item.quote ? <blockquote>“{item.quote}”</blockquote> : null}
            {item.authorName || item.authorRole ? (
              <figcaption>
                {item.authorName ? <strong>{item.authorName}</strong> : null}
                {item.authorRole ? ` · ${item.authorRole}` : ""}
              </figcaption>
            ) : null}
          </div>
        </figure>
      </div>
    </section>
  );
}
