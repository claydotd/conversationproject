import { FormEvent, useState } from "react";
import { PageHero } from "../components/PageHero";
import { PageSections } from "../components/PageSections";
import { Seo } from "../components/Seo";
import { TestimonialSection } from "../components/TestimonialSection";
import { encodeForm } from "../lib/api";
import { useSiteContent } from "../lib/content-context";

export function ContactPage() {
  const { content, testimonialsFor } = useSiteContent();
  const page = content.pages.contact;
  const [status, setStatus] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = encodeForm({
      "form-name": "contact",
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      message: String(data.get("message") ?? ""),
      "bot-field": String(data.get("bot-field") ?? ""),
    });

    try {
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: payload,
      });
      if (!response.ok) {
        throw new Error("Request failed");
      }
      form.reset();
      setStatus("Thank you. We will be in touch shortly.");
    } catch {
      setStatus("Something went wrong. Please email us directly instead.");
    }
  }

  return (
    <>
      <Seo title={page.seoTitle} description={page.seoDescription} />
      <PageHero
        eyebrow="Contact"
        heading={page.heroHeading}
        subheading={page.heroSubheading}
      />
      <PageSections sections={page.sections} />
      <section className="section page">
        <div className="contact-layout">
          <div className="form-card">
            <h2>Send a message</h2>
            <form className="form" name="contact" onSubmit={onSubmit}>
              <input type="hidden" name="form-name" value="contact" />
              <p hidden>
                <label>
                  Don’t fill this in: <input name="bot-field" />
                </label>
              </p>
              <label>
                Name
                <input name="name" required autoComplete="name" />
              </label>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                />
              </label>
              <label>
                Message
                <textarea name="message" required />
              </label>
              <button type="submit">Send</button>
              <p className="form-status" role="status">
                {status}
              </p>
            </form>
          </div>
          <aside className="contact-card">
            <h2>Direct</h2>
            <div className="contact-meta">
              {content.site.contactEmail ? (
                <a href={`mailto:${content.site.contactEmail}`}>
                  {content.site.contactEmail}
                </a>
              ) : null}
              {content.site.contactPhone ? (
                <a href={`tel:${content.site.contactPhone}`}>
                  {content.site.contactPhone}
                </a>
              ) : null}
              {content.site.contactAddress ? (
                <p>{content.site.contactAddress}</p>
              ) : null}
              {content.site.social.map((item) => (
                <a key={item.url} href={item.url}>
                  {item.label}
                </a>
              ))}
            </div>
          </aside>
        </div>
      </section>
      <TestimonialSection testimonials={testimonialsFor("contact")} />
    </>
  );
}
