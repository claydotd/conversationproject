import { useState, type FormEvent } from "react";
import type { DownloadListingItem } from "@shared/shop";
import { Seo } from "../components/Seo";
import { fetchDownloadsForEmail } from "../lib/api";

export function DownloadsPage() {
  const [email, setEmail] = useState("");
  const [items, setItems] = useState<DownloadListingItem[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setItems(null);
    try {
      const result = await fetchDownloadsForEmail(email);
      setItems(result.items);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to look up downloads.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page shop-page">
      <Seo
        title="Downloads"
        description="Re-download digital purchases using your order email."
      />
      <section className="section shop-intro">
        <p className="eyebrow">Shop</p>
        <h1>Downloads</h1>
        <p className="lede">
          Enter the email address used on your order to access your digital
          downloads again.
        </p>
      </section>

      <section className="section">
        <form className="downloads-form" onSubmit={(event) => void onSubmit(event)}>
          <label>
            Order email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? "Looking up…" : "Find downloads"}
          </button>
        </form>

        {error ? <p className="banner">{error}</p> : null}
        {items && items.length === 0 ? (
          <p className="muted">
            No paid digital downloads were found for that email.
          </p>
        ) : null}
        {items && items.length > 0 ? (
          <ul className="download-list">
            {items.map((item) => (
              <li key={item.productId}>
                <span>{item.name}</span>
                <a className="button-link" href={item.downloadUrl}>
                  Download
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
