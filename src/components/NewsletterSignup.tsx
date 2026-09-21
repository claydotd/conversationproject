import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { encodeForm } from "../lib/api";
import { useSiteContent } from "../lib/content-context";

export function NewsletterSignup() {
  const { content } = useSiteContent();
  const [status, setStatus] = useState("");
  const site = content.site;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = encodeForm({
      "form-name": "newsletter",
      "first-name": String(data.get("first-name") ?? ""),
      "last-name": String(data.get("last-name") ?? ""),
      email: String(data.get("email") ?? ""),
      consent: data.get("consent") ? "yes" : "",
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
      setStatus("Thank you. You are on the list.");
    } catch {
      setStatus("Something went wrong. Please email us directly instead.");
    }
  }

  return (
    <div className="newsletter">
      {site.newsletterHeading ? <h2>{site.newsletterHeading}</h2> : null}
      {site.newsletterParagraph ? <p>{site.newsletterParagraph}</p> : null}
      <form className="form newsletter__form" name="newsletter" onSubmit={onSubmit}>
        <input type="hidden" name="form-name" value="newsletter" />
        <p hidden>
          <label>
            Don’t fill this in: <input name="bot-field" />
          </label>
        </p>
        <div className="newsletter__names">
          <label>
            First name
            <input name="first-name" required autoComplete="given-name" />
          </label>
          <label>
            Last name
            <input name="last-name" required autoComplete="family-name" />
          </label>
        </div>
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label className="form-check">
          <input name="consent" type="checkbox" value="yes" required />
          <span>{site.newsletterConsentLabel}</span>
        </label>
        <p className="newsletter__legal">
          <Link to="/terms">Read the terms and conditions</Link>
        </p>
        <button type="submit">Sign up</button>
        <p className="form-status" role="status">
          {status}
        </p>
      </form>
    </div>
  );
}
