import { useEffect, useState, type SetStateAction } from "react";
import type { PageSlug, SiteContent } from "@shared/types";
import { Seo } from "../../components/Seo";
import {
  fetchAdminContent,
  fetchAdminSession,
  logoutAdmin,
  saveAdminContent,
} from "../../lib/api";
import { AdminLogin } from "./AdminLogin";
import { PageEditor } from "./PageEditor";
import { ProductsEditor } from "./ProductsEditor";
import { SiteSettingsEditor } from "./SiteSettingsEditor";

type Panel = "site" | "products" | PageSlug;

const NAV_ITEMS: Array<{ id: Panel; label: string }> = [
  { id: "site", label: "Site settings" },
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "events", label: "Events" },
  { id: "contact", label: "Contact" },
  { id: "terms", label: "Terms" },
  { id: "products", label: "Shop" },
];

export function AdminApp() {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordConfigured, setPasswordConfigured] = useState(true);
  const [content, setContent] = useState<SiteContent | null>(null);
  const [panel, setPanel] = useState<Panel>("site");
  const [navOpen, setNavOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.body.classList.add("admin-body");
    return () => document.body.classList.remove("admin-body");
  }, []);

  useEffect(() => {
    void fetchAdminSession().then((session) => {
      setAuthenticated(session.authenticated);
      setPasswordConfigured(session.passwordConfigured);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    void fetchAdminContent()
      .then(setContent)
      .catch((error: unknown) => {
        setStatus(
          error instanceof Error ? error.message : "Unable to load content.",
        );
      });
  }, [authenticated]);

  function updateContent(action: SetStateAction<SiteContent>) {
    setContent((current) => {
      if (!current) return current;
      return typeof action === "function" ? action(current) : action;
    });
  }

  function selectPanel(next: Panel) {
    setPanel(next);
    setNavOpen(false);
  }

  async function onSave() {
    if (!content) return;
    setSaving(true);
    setStatus("");
    try {
      const saved = await saveAdminContent(content);
      setContent(saved);
      setStatus(
        saved.publishedAt
          ? `Published ${new Date(saved.publishedAt).toLocaleString()}`
          : "Saved.",
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) {
    return <div className="login">Loading…</div>;
  }

  if (!authenticated) {
    return (
      <AdminLogin
        passwordConfigured={passwordConfigured}
        onSignedIn={() => setAuthenticated(true)}
      />
    );
  }

  return (
    <div className="admin-shell">
      <Seo
        title="Admin"
        description="Edit website copy without changing code."
      />
      <button
        type="button"
        className="admin-nav-toggle"
        aria-expanded={navOpen}
        aria-controls="admin-nav"
        onClick={() => setNavOpen((open) => !open)}
      >
        Menu
      </button>
      <aside
        id="admin-nav"
        className={navOpen ? "admin-nav is-open" : "admin-nav"}
      >
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={panel === item.id ? "active" : ""}
            onClick={() => selectPanel(item.id)}
          >
            {item.label}
          </button>
        ))}
        <a href="/" target="_blank" rel="noreferrer">
          View site
        </a>
        <button
          className="ghost"
          type="button"
          onClick={() => {
            void logoutAdmin().then(() => {
              setAuthenticated(false);
              setContent(null);
              setNavOpen(false);
            });
          }}
        >
          Sign out
        </button>
      </aside>
      <div className="admin-main stack">
        {panel !== "products" ? (
          <div className="admin-toolbar">
            <p className="muted">
              Saving writes to the database once, then publishes a cached copy
              for the public site.
            </p>
            <button
              type="button"
              onClick={() => void onSave()}
              disabled={saving}
            >
              {saving ? "Publishing…" : "Save and publish"}
            </button>
          </div>
        ) : null}
        {status ? <p className="banner">{status}</p> : null}
        {content && panel === "products" ? (
          <ProductsEditor content={content} setContent={updateContent} />
        ) : null}
        {content && panel === "site" ? (
          <SiteSettingsEditor content={content} setContent={updateContent} />
        ) : null}
        {content && panel !== "site" && panel !== "products" ? (
          <PageEditor
            slug={panel}
            content={content}
            setContent={updateContent}
          />
        ) : null}
      </div>
    </div>
  );
}
