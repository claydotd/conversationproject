import type { Dispatch, SetStateAction } from "react";
import type { PageSlug, SiteContent, Testimonial } from "@shared/types";
import { uploadAdminImage } from "../../lib/api";

export function PageEditor({
  slug,
  content,
  setContent,
}: {
  slug: PageSlug;
  content: SiteContent;
  setContent: Dispatch<SetStateAction<SiteContent>>;
}) {
  const page = content.pages[slug];
  const testimonials = content.testimonials
    .filter((item) => item.pageSlug === slug)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  function updatePage(patch: Partial<typeof page>) {
    setContent((current) => ({
      ...current,
      pages: {
        ...current.pages,
        [slug]: { ...current.pages[slug], ...patch },
      },
    }));
  }

  function updateSection(
    id: string,
    patch: Partial<(typeof page.sections)[number]>,
  ) {
    updatePage({
      sections: page.sections.map((section) =>
        section.id === id ? { ...section, ...patch } : section,
      ),
    });
  }

  function setTestimonials(next: Testimonial[]) {
    setContent((current) => ({
      ...current,
      testimonials: [
        ...current.testimonials.filter((item) => item.pageSlug !== slug),
        ...next.map((item, index) => ({ ...item, sortOrder: index })),
      ],
    }));
  }

  function updateTestimonial(id: string, patch: Partial<Testimonial>) {
    setTestimonials(
      testimonials.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  async function onImage(id: string, file: File | undefined) {
    if (!file) return;
    const url = await uploadAdminImage(file);
    updateTestimonial(id, { imageUrl: url });
  }

  return (
    <div className="admin-panel">
      <h1>{page.title}</h1>
      <p className="muted">
        Edit the public copy for this page. Saving publishes it to the live
        site.
      </p>
      <div className="field-grid">
        <label>
          Page title
          <input
            value={page.title}
            onChange={(event) => updatePage({ title: event.target.value })}
          />
        </label>
        <label>
          Hero heading
          <input
            value={page.heroHeading}
            onChange={(event) =>
              updatePage({ heroHeading: event.target.value })
            }
          />
        </label>
        <label>
          Hero subheading
          <textarea
            value={page.heroSubheading}
            onChange={(event) =>
              updatePage({ heroSubheading: event.target.value })
            }
          />
        </label>
        <label>
          SEO title
          <input
            value={page.seoTitle}
            onChange={(event) => updatePage({ seoTitle: event.target.value })}
          />
        </label>
        <label>
          SEO description
          <textarea
            value={page.seoDescription}
            onChange={(event) =>
              updatePage({ seoDescription: event.target.value })
            }
          />
        </label>
      </div>

      <div className="stack">
        <div className="card__header">
          <h2>Page sections</h2>
          <button
            className="ghost"
            type="button"
            onClick={() =>
              updatePage({
                sections: [
                  ...page.sections,
                  {
                    id: crypto.randomUUID(),
                    heading: "New section",
                    body: "",
                  },
                ],
              })
            }
          >
            Add section
          </button>
        </div>
        {page.sections.map((section) => (
          <div className="card" key={section.id}>
            <label>
              Heading
              <input
                value={section.heading}
                onChange={(event) =>
                  updateSection(section.id, { heading: event.target.value })
                }
              />
            </label>
            <label>
              Body
              <textarea
                value={section.body}
                onChange={(event) =>
                  updateSection(section.id, { body: event.target.value })
                }
              />
            </label>
            <button
              className="danger"
              type="button"
              onClick={() =>
                updatePage({
                  sections: page.sections.filter(
                    (item) => item.id !== section.id,
                  ),
                })
              }
            >
              Remove section
            </button>
          </div>
        ))}
      </div>

      <div className="stack">
        <div className="card__header">
          <h2>Testimonials</h2>
          <button
            className="ghost"
            type="button"
            onClick={() =>
              setTestimonials([
                ...testimonials,
                {
                  id: crypto.randomUUID(),
                  pageSlug: slug,
                  quote: "",
                  authorName: "",
                  authorRole: "",
                  imageUrl: "",
                  sortOrder: testimonials.length,
                },
              ])
            }
          >
            Add testimonial
          </button>
        </div>
        {testimonials.map((item, index) => (
          <div className="card" key={item.id}>
            <label>
              Quote
              <textarea
                value={item.quote}
                onChange={(event) =>
                  updateTestimonial(item.id, { quote: event.target.value })
                }
              />
            </label>
            <label>
              Name
              <input
                value={item.authorName}
                onChange={(event) =>
                  updateTestimonial(item.id, { authorName: event.target.value })
                }
              />
            </label>
            <label>
              Role / organisation
              <input
                value={item.authorRole}
                onChange={(event) =>
                  updateTestimonial(item.id, { authorRole: event.target.value })
                }
              />
            </label>
            <label>
              Photo (optional)
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(event) =>
                  void onImage(item.id, event.target.files?.[0])
                }
              />
            </label>
            {item.imageUrl ? (
              <img className="preview-image" src={item.imageUrl} alt="" />
            ) : null}
            <div className="inline-actions">
              <button
                className="ghost"
                type="button"
                disabled={index === 0}
                onClick={() => {
                  const next = [...testimonials];
                  [next[index - 1], next[index]] = [
                    next[index],
                    next[index - 1],
                  ];
                  setTestimonials(next);
                }}
              >
                Move up
              </button>
              <button
                className="ghost"
                type="button"
                disabled={index === testimonials.length - 1}
                onClick={() => {
                  const next = [...testimonials];
                  [next[index + 1], next[index]] = [
                    next[index],
                    next[index + 1],
                  ];
                  setTestimonials(next);
                }}
              >
                Move down
              </button>
              <button
                className="ghost"
                type="button"
                onClick={() => updateTestimonial(item.id, { imageUrl: "" })}
              >
                Remove photo
              </button>
              <button
                className="danger"
                type="button"
                onClick={() =>
                  setTestimonials(
                    testimonials.filter((entry) => entry.id !== item.id),
                  )
                }
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
