import type { Testimonial } from "@shared/types";

export function TestimonialSection({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  if (testimonials.length === 0) return null;

  return (
    <section className="testimonials page" aria-labelledby="testimonials-heading">
      <h2 id="testimonials-heading">In their words</h2>
      <div className="testimonial-grid">
        {testimonials.map((item) => (
          <figure
            className={
              item.imageUrl ? "testimonial testimonial--with-image" : "testimonial"
            }
            key={item.id}
          >
            {item.imageUrl ? (
              <img src={item.imageUrl} alt="" width={88} height={88} />
            ) : null}
            <div>
              <blockquote>“{item.quote}”</blockquote>
              <figcaption>
                <strong>{item.authorName}</strong>
                {item.authorRole ? ` · ${item.authorRole}` : ""}
              </figcaption>
            </div>
          </figure>
        ))}
      </div>
    </section>
  );
}
