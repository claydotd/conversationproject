import type { Dispatch, SetStateAction } from "react";
import { useRef } from "react";
import {
  COMBINE_SIDE_LABELS,
  createGalleryImage,
  createPageSection,
  HERO_LINK_MODE_LABELS,
  IMAGE_DIMENSION_LABELS,
  IMAGE_SIZE_LABELS,
  isPermanentSectionType,
  SECTION_BACKGROUND_LABELS,
  SECTION_TYPE_LABELS,
  TEXT_ALIGN_LABELS,
} from "@shared/page-sections";
import { wrapInlineMarkdown, type InlineMark } from "@shared/inline-markdown";
import {
  ADDABLE_SECTION_TYPES,
  COMBINE_SIDES,
  HERO_LINK_MODES,
  IMAGE_DIMENSIONS,
  IMAGE_SIZES,
  SECTION_BACKGROUNDS,
  TEXT_ALIGNS,
  type CombineSide,
  type GalleryImage,
  type HeroLinkMode,
  type ImageDimension,
  type ImageSize,
  type PageSection,
  type PageSlug,
  type SectionBackground,
  type SectionType,
  type SiteContent,
  type TextAlign,
} from "@shared/types";
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

  function updatePage(patch: Partial<typeof page>) {
    setContent((current) => ({
      ...current,
      pages: {
        ...current.pages,
        [slug]: { ...current.pages[slug], ...patch },
      },
    }));
  }

  function setSections(sections: PageSection[]) {
    updatePage({ sections });
  }

  function updateSection(
    id: string,
    updater: (section: PageSection) => PageSection,
  ) {
    setSections(
      page.sections.map((section) =>
        section.id === id ? updater(section) : section,
      ),
    );
  }

  function addSection(type: SectionType) {
    setSections([...page.sections, createPageSection(type)]);
  }

  function moveSection(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= page.sections.length) return;
    const next = [...page.sections];
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next);
  }

  function removeSection(id: string) {
    setSections(
      page.sections.filter(
        (section) =>
          section.id !== id || isPermanentSectionType(section.type),
      ),
    );
  }

  async function uploadTo(
    file: File | undefined,
    apply: (url: string) => void,
  ) {
    if (!file) return;
    const url = await uploadAdminImage(file);
    apply(url);
  }

  return (
    <div className="admin-panel">
      <h1>{page.title}</h1>
      <p className="muted">
        Build each page from sections. Permanent blocks (events list, contact
        form) stay on their page but can be moved so other sections sit before
        or after them. Saving publishes the live site.{" "}
        <em>
          Please note: it takes a few seconds after saving for the changes to
          appear.
        </em>
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
        </div>
        <div className="add-section">
          {ADDABLE_SECTION_TYPES.map((type) => (
            <button
              className="ghost"
              type="button"
              key={type}
              onClick={() => addSection(type)}
            >
              Add {SECTION_TYPE_LABELS[type].toLowerCase()}
            </button>
          ))}
        </div>
        {page.sections.length === 0 ? (
          <p className="muted">
            No sections yet. Add text, an image, a gallery, a testimonial, social
            links, or a hero.
          </p>
        ) : null}
        {page.sections.map((section, index) => {
          const permanent = isPermanentSectionType(section.type);
          return (
            <article
              className={`card${permanent ? " card--permanent" : ""}`}
              key={section.id}
            >
              <div className="section-card__meta">
                <p className="section-type-label">
                  {SECTION_TYPE_LABELS[section.type]}
                  {permanent ? " · Permanent" : ""}
                </p>
                <div className="inline-actions">
                  <button
                    className="ghost"
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveSection(index, -1)}
                  >
                    Move up
                  </button>
                  <button
                    className="ghost"
                    type="button"
                    disabled={index === page.sections.length - 1}
                    onClick={() => moveSection(index, 1)}
                  >
                    Move down
                  </button>
                  {!permanent ? (
                    <button
                      className="danger"
                      type="button"
                      onClick={() => removeSection(section.id)}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
              <BackgroundPicker
                value={section.background}
                onChange={(background) =>
                  updateSection(section.id, (current) => ({
                    ...current,
                    background,
                  }))
                }
              />
              <SectionFields
                section={section}
                onChange={(updater) => updateSection(section.id, updater)}
                onUpload={uploadTo}
              />
            </article>
          );
        })}
      </div>
    </div>
  );
}

function BackgroundPicker({
  label = "Background colour",
  value,
  onChange,
}: {
  label?: string;
  value: SectionBackground;
  onChange: (background: SectionBackground) => void;
}) {
  return (
    <fieldset className="bg-picker">
      <legend>
        {label}
        <span className="bg-picker__current">
          {SECTION_BACKGROUND_LABELS[value]}
        </span>
      </legend>
      <div className="bg-swatches" role="radiogroup" aria-label={label}>
        {SECTION_BACKGROUNDS.map((background) => {
          const selected = background === value;
          return (
            <button
              key={background}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={SECTION_BACKGROUND_LABELS[background]}
              title={SECTION_BACKGROUND_LABELS[background]}
              className={`bg-swatch${background === "default" ? " bg-swatch--default" : ""}${selected ? " is-selected" : ""}`}
              style={
                background === "default"
                  ? undefined
                  : { backgroundColor: `var(--${background})` }
              }
              onClick={() => onChange(background)}
            />
          );
        })}
      </div>
    </fieldset>
  );
}

function AlignPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: TextAlign;
  onChange: (align: TextAlign) => void;
}) {
  return (
    <fieldset className="align-picker">
      <legend>{label}</legend>
      <div className="align-picker__options" role="radiogroup" aria-label={label}>
        {TEXT_ALIGNS.map((align) => {
          const selected = align === value;
          return (
            <button
              key={align}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`align-option${selected ? " is-selected" : ""}`}
              onClick={() => onChange(align)}
            >
              {TEXT_ALIGN_LABELS[align]}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function OptionPicker<T extends string>({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  labels: Record<T, string>;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="align-picker">
      <legend>{label}</legend>
      <div className="align-picker__options" role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const selected = option === value;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`align-option${selected ? " is-selected" : ""}`}
              onClick={() => onChange(option)}
            >
              {labels[option]}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function RichTextBodyField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function applyMark(mark: InlineMark) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const next = wrapInlineMarkdown(value, start, end, mark);
    onChange(next.value);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(next.selectionStart, next.selectionEnd);
    });
  }

  return (
    <div className="rich-text-field">
      <div className="rich-text-toolbar" role="toolbar" aria-label="Text style">
        <button
          type="button"
          className="ghost rich-text-toolbar__btn"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => applyMark("bold")}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className="ghost rich-text-toolbar__btn"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => applyMark("italic")}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className="ghost rich-text-toolbar__btn"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => applyMark("underline")}
        >
          <span className="rich-text-toolbar__underline">U</span>
        </button>
      </div>
      <label>
        Paragraph
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      <p className="muted rich-text-hint">
        Select text, then use the buttons for bold, italic, or underline.
      </p>
    </div>
  );
}

function SectionFields({
  section,
  onChange,
  onUpload,
}: {
  section: PageSection;
  onChange: (updater: (current: PageSection) => PageSection) => void;
  onUpload: (
    file: File | undefined,
    apply: (url: string) => void,
  ) => Promise<void>;
}) {
  if (section.type === "events-list") {
    return (
      <p className="muted permanent-note">
        This block shows the live Eventbrite listing. Move it up or down to place
        other sections before or after it.
      </p>
    );
  }

  if (section.type === "contact-form") {
    return (
      <p className="muted permanent-note">
        This block shows the contact form and direct details. Move it up or down
        to place other sections before or after it.
      </p>
    );
  }

  if (section.type === "social-links") {
    return (
      <>
        <p className="muted permanent-note">
          This block shows the social media links from Site settings as buttons.
          Edit those links under Site settings.
        </p>
        <label>
          Heading (optional)
          <input
            value={section.heading}
            onChange={(event) =>
              onChange((current) =>
                current.type === "social-links"
                  ? { ...current, heading: event.target.value }
                  : current,
              )
            }
          />
        </label>
        <AlignPicker
          label="Heading alignment"
          value={section.headingAlign}
          onChange={(headingAlign) =>
            onChange((current) =>
              current.type === "social-links"
                ? { ...current, headingAlign }
                : current,
            )
          }
        />
      </>
    );
  }

  if (section.type === "hero") {
    return (
      <>
        <label>
          Eyebrow
          <input
            value={section.eyebrow}
            onChange={(event) =>
              onChange((current) =>
                current.type === "hero"
                  ? { ...current, eyebrow: event.target.value }
                  : current,
              )
            }
          />
        </label>
        <BackgroundPicker
          label="Eyebrow colour"
          value={section.eyebrowColor}
          onChange={(eyebrowColor) =>
            onChange((current) =>
              current.type === "hero" ? { ...current, eyebrowColor } : current,
            )
          }
        />
        <label>
          Heading
          <input
            value={section.heading}
            onChange={(event) =>
              onChange((current) =>
                current.type === "hero"
                  ? { ...current, heading: event.target.value }
                  : current,
              )
            }
          />
        </label>
        <BackgroundPicker
          label="Heading colour"
          value={section.headingColor}
          onChange={(headingColor) =>
            onChange((current) =>
              current.type === "hero" ? { ...current, headingColor } : current,
            )
          }
        />
        <label>
          Subheading
          <textarea
            value={section.subheading}
            onChange={(event) =>
              onChange((current) =>
                current.type === "hero"
                  ? { ...current, subheading: event.target.value }
                  : current,
              )
            }
          />
        </label>
        <BackgroundPicker
          label="Subheading colour"
          value={section.subheadingColor}
          onChange={(subheadingColor) =>
            onChange((current) =>
              current.type === "hero"
                ? { ...current, subheadingColor }
                : current,
            )
          }
        />
        <OptionPicker
          label="Link buttons"
          value={section.linkMode}
          options={HERO_LINK_MODES}
          labels={HERO_LINK_MODE_LABELS}
          onChange={(linkMode: HeroLinkMode) =>
            onChange((current) =>
              current.type === "hero" ? { ...current, linkMode } : current,
            )
          }
        />
        {section.linkMode === "social" ? (
          <p className="field-hint">
            Shows the social media links from Site settings as buttons under
            the hero text.
          </p>
        ) : null}
        {section.linkMode === "custom" ? (
          <>
            <label>
              Button text
              <input
                value={section.customLinkLabel}
                onChange={(event) =>
                  onChange((current) =>
                    current.type === "hero"
                      ? { ...current, customLinkLabel: event.target.value }
                      : current,
                  )
                }
              />
            </label>
            <label>
              Button URL
              <input
                type="url"
                placeholder="https://"
                value={section.customLinkUrl}
                onChange={(event) =>
                  onChange((current) =>
                    current.type === "hero"
                      ? { ...current, customLinkUrl: event.target.value }
                      : current,
                  )
                }
              />
            </label>
          </>
        ) : null}
        <label>
          Image (optional)
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(event) =>
              void onUpload(event.target.files?.[0], (url) =>
                onChange((current) =>
                  current.type === "hero"
                    ? { ...current, imageUrl: url }
                    : current,
                ),
              )
            }
          />
        </label>
        {section.imageUrl ? (
          <img
            className="preview-image preview-image--wide"
            src={section.imageUrl}
            alt=""
          />
        ) : null}
        <label>
          Image alt text
          <input
            value={section.imageAlt}
            onChange={(event) =>
              onChange((current) =>
                current.type === "hero"
                  ? { ...current, imageAlt: event.target.value }
                  : current,
              )
            }
          />
        </label>
        {section.imageUrl ? (
          <OptionPicker
            label="Image dimensions"
            value={section.imageDimension}
            options={IMAGE_DIMENSIONS}
            labels={IMAGE_DIMENSION_LABELS}
            onChange={(imageDimension: ImageDimension) =>
              onChange((current) =>
                current.type === "hero"
                  ? { ...current, imageDimension }
                  : current,
              )
            }
          />
        ) : null}
        {section.imageUrl ? (
          <button
            className="ghost"
            type="button"
            onClick={() =>
              onChange((current) =>
                current.type === "hero"
                  ? { ...current, imageUrl: "", imageAlt: "" }
                  : current,
              )
            }
          >
            Remove image
          </button>
        ) : null}
      </>
    );
  }

  if (section.type === "text") {
    return (
      <>
        <label>
          Heading
          <input
            value={section.heading}
            onChange={(event) =>
              onChange((current) =>
                current.type === "text"
                  ? { ...current, heading: event.target.value }
                  : current,
              )
            }
          />
        </label>
        <AlignPicker
          label="Heading alignment"
          value={section.headingAlign}
          onChange={(headingAlign) =>
            onChange((current) =>
              current.type === "text" ? { ...current, headingAlign } : current,
            )
          }
        />
        <RichTextBodyField
          value={section.body}
          onChange={(body) =>
            onChange((current) =>
              current.type === "text" ? { ...current, body } : current,
            )
          }
        />
        <AlignPicker
          label="Paragraph alignment"
          value={section.bodyAlign}
          onChange={(bodyAlign) =>
            onChange((current) =>
              current.type === "text" ? { ...current, bodyAlign } : current,
            )
          }
        />
      </>
    );
  }

  if (section.type === "image") {
    return (
      <>
        <label>
          Heading (optional)
          <input
            value={section.heading}
            onChange={(event) =>
              onChange((current) =>
                current.type === "image"
                  ? { ...current, heading: event.target.value }
                  : current,
              )
            }
          />
        </label>
        <label>
          Image
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(event) =>
              void onUpload(event.target.files?.[0], (url) =>
                onChange((current) =>
                  current.type === "image"
                    ? { ...current, imageUrl: url }
                    : current,
                ),
              )
            }
          />
        </label>
        {section.imageUrl ? (
          <img className="preview-image preview-image--wide" src={section.imageUrl} alt="" />
        ) : null}
        <label>
          Alt text
          <input
            value={section.alt}
            onChange={(event) =>
              onChange((current) =>
                current.type === "image"
                  ? { ...current, alt: event.target.value }
                  : current,
              )
            }
          />
        </label>
        <label>
          Caption
          <input
            value={section.caption}
            onChange={(event) =>
              onChange((current) =>
                current.type === "image"
                  ? { ...current, caption: event.target.value }
                  : current,
              )
            }
          />
        </label>
        <OptionPicker
          label="Image size"
          value={section.size}
          options={IMAGE_SIZES}
          labels={IMAGE_SIZE_LABELS}
          onChange={(size: ImageSize) =>
            onChange((current) =>
              current.type === "image"
                ? {
                    ...current,
                    size,
                    combineWithAbove:
                      size === "full-width" ? false : current.combineWithAbove,
                  }
                : current,
            )
          }
        />
        <OptionPicker
          label="Image dimensions"
          value={section.dimension}
          options={IMAGE_DIMENSIONS}
          labels={IMAGE_DIMENSION_LABELS}
          onChange={(dimension: ImageDimension) =>
            onChange((current) =>
              current.type === "image" ? { ...current, dimension } : current,
            )
          }
        />
        {section.size === "full-width" ? null : (
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={section.combineWithAbove}
              onChange={(event) =>
                onChange((current) =>
                  current.type === "image"
                    ? { ...current, combineWithAbove: event.target.checked }
                    : current,
                )
              }
            />
            Combine with section above
          </label>
        )}
        {section.combineWithAbove && section.size !== "full-width" ? (
          <OptionPicker
            label="Image position"
            value={section.combineSide}
            options={COMBINE_SIDES}
            labels={COMBINE_SIDE_LABELS}
            onChange={(combineSide: CombineSide) =>
              onChange((current) =>
                current.type === "image"
                  ? { ...current, combineSide }
                  : current,
              )
            }
          />
        ) : null}
        {section.imageUrl ? (
          <button
            className="ghost"
            type="button"
            onClick={() =>
              onChange((current) =>
                current.type === "image" ? { ...current, imageUrl: "" } : current,
              )
            }
          >
            Remove image
          </button>
        ) : null}
      </>
    );
  }

  if (section.type === "gallery") {
    return (
      <>
        <label>
          Heading (optional)
          <input
            value={section.heading}
            onChange={(event) =>
              onChange((current) =>
                current.type === "gallery"
                  ? { ...current, heading: event.target.value }
                  : current,
              )
            }
          />
        </label>
        {section.images.map((image) => (
          <GalleryImageFields
            key={image.id}
            image={image}
            onChange={(patch) =>
              onChange((current) =>
                current.type === "gallery"
                  ? {
                      ...current,
                      images: current.images.map((item) =>
                        item.id === image.id ? { ...item, ...patch } : item,
                      ),
                    }
                  : current,
              )
            }
            onUpload={onUpload}
            onRemove={() =>
              onChange((current) =>
                current.type === "gallery"
                  ? {
                      ...current,
                      images: current.images.filter(
                        (item) => item.id !== image.id,
                      ),
                    }
                  : current,
              )
            }
          />
        ))}
        <label>
          Add image
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              void onUpload(file, (url) =>
                onChange((current) =>
                  current.type === "gallery"
                    ? {
                        ...current,
                        images: [
                          ...current.images,
                          { ...createGalleryImage(), imageUrl: url },
                        ],
                      }
                    : current,
                ),
              );
            }}
          />
        </label>
      </>
    );
  }

  return (
    <>
      <label>
        Quote
        <textarea
          value={section.quote}
          onChange={(event) =>
            onChange((current) =>
              current.type === "testimonial"
                ? { ...current, quote: event.target.value }
                : current,
            )
          }
        />
      </label>
      <label>
        Name
        <input
          value={section.authorName}
          onChange={(event) =>
            onChange((current) =>
              current.type === "testimonial"
                ? { ...current, authorName: event.target.value }
                : current,
            )
          }
        />
      </label>
      <label>
        Role / organisation
        <input
          value={section.authorRole}
          onChange={(event) =>
            onChange((current) =>
              current.type === "testimonial"
                ? { ...current, authorRole: event.target.value }
                : current,
            )
          }
        />
      </label>
      <label>
        Photo (optional)
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(event) =>
            void onUpload(event.target.files?.[0], (url) =>
              onChange((current) =>
                current.type === "testimonial"
                  ? { ...current, imageUrl: url }
                  : current,
              ),
            )
          }
        />
      </label>
      {section.imageUrl ? (
        <>
          <img className="preview-image" src={section.imageUrl} alt="" />
          <button
            className="ghost"
            type="button"
            onClick={() =>
              onChange((current) =>
                current.type === "testimonial"
                  ? { ...current, imageUrl: "" }
                  : current,
              )
            }
          >
            Remove photo
          </button>
        </>
      ) : null}
    </>
  );
}

function GalleryImageFields({
  image,
  onChange,
  onUpload,
  onRemove,
}: {
  image: GalleryImage;
  onChange: (patch: Partial<GalleryImage>) => void;
  onUpload: (
    file: File | undefined,
    apply: (url: string) => void,
  ) => Promise<void>;
  onRemove: () => void;
}) {
  return (
    <div className="gallery-editor-item">
      {image.imageUrl ? (
        <img
          className="preview-image preview-image--wide"
          src={image.imageUrl}
          alt=""
        />
      ) : null}
      <label>
        Replace image
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(event) =>
            void onUpload(event.target.files?.[0], (url) =>
              onChange({ imageUrl: url }),
            )
          }
        />
      </label>
      <label>
        Alt text
        <input
          value={image.alt}
          onChange={(event) => onChange({ alt: event.target.value })}
        />
      </label>
      <label>
        Caption
        <input
          value={image.caption}
          onChange={(event) => onChange({ caption: event.target.value })}
        />
      </label>
      <button className="ghost" type="button" onClick={onRemove}>
        Remove from gallery
      </button>
    </div>
  );
}
