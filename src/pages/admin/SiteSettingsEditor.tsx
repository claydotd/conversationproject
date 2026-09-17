import type { Dispatch, SetStateAction } from "react";
import type { SiteContent, SocialLink } from "@shared/types";

export function SiteSettingsEditor({
  content,
  setContent,
}: {
  content: SiteContent;
  setContent: Dispatch<SetStateAction<SiteContent>>;
}) {
  const site = content.site;

  function update<K extends keyof typeof site>(key: K, value: (typeof site)[K]) {
    setContent((current) => ({
      ...current,
      site: { ...current.site, [key]: value },
    }));
  }

  function updateSocial(index: number, patch: Partial<SocialLink>) {
    setContent((current) => ({
      ...current,
      site: {
        ...current.site,
        social: current.site.social.map((item, itemIndex) =>
          itemIndex === index ? { ...item, ...patch } : item,
        ),
      },
    }));
  }

  return (
    <div className="admin-panel">
      <h1>Site settings</h1>
      <p className="muted">
        These details appear in the header, footer, and contact page.
      </p>
      <div className="field-grid">
        <label>
          Site name
          <input
            value={site.name}
            onChange={(event) => update("name", event.target.value)}
          />
        </label>
        <label>
          Tagline
          <input
            value={site.tagline}
            onChange={(event) => update("tagline", event.target.value)}
          />
        </label>
        <label>
          Footer text
          <input
            value={site.footerText}
            onChange={(event) => update("footerText", event.target.value)}
          />
        </label>
        <label>
          Contact email
          <input
            type="email"
            value={site.contactEmail}
            onChange={(event) => update("contactEmail", event.target.value)}
          />
        </label>
        <label>
          Phone
          <input
            value={site.contactPhone}
            onChange={(event) => update("contactPhone", event.target.value)}
          />
        </label>
        <label>
          Address
          <textarea
            value={site.contactAddress}
            onChange={(event) => update("contactAddress", event.target.value)}
          />
        </label>
      </div>
      <div className="stack">
        <div className="card__header">
          <h2>Social links</h2>
          <button
            className="ghost"
            type="button"
            onClick={() =>
              update("social", [...site.social, { label: "", url: "" }])
            }
          >
            Add link
          </button>
        </div>
        {site.social.map((item, index) => (
          <div className="card" key={`${item.label}-${index}`}>
            <label>
              Label
              <input
                value={item.label}
                onChange={(event) =>
                  updateSocial(index, { label: event.target.value })
                }
              />
            </label>
            <label>
              URL
              <input
                value={item.url}
                onChange={(event) =>
                  updateSocial(index, { url: event.target.value })
                }
              />
            </label>
            <button
              className="danger"
              type="button"
              onClick={() =>
                update(
                  "social",
                  site.social.filter((_, itemIndex) => itemIndex !== index),
                )
              }
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
