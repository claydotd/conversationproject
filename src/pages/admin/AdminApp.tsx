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
import { SiteSettingsEditor } from "./SiteSettingsEditor";

type Panel = "site" | PageSlug;

export function AdminApp() {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordConfigured, setPasswordConfigured] = useState(true);
  const [content, setContent] = useState<SiteContent | null>(null);
  const [panel, setPanel] = useState<Panel>("site");
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
      <aside className="admin-nav">
        <button
          type="button"
          className={panel === "site" ? "active" : ""}
          onClick={() => setPanel("site")}
        >
          Site settings
        </button>
        <button
          type="button"
          className={panel === "home" ? "active" : ""}
          onClick={() => setPanel("home")}
        >
          Home
        </button>
        <button
          type="button"
          className={panel === "about" ? "active" : ""}
          onClick={() => setPanel("about")}
        >
          About
        </button>
        <button
          type="button"
          className={panel === "events" ? "active" : ""}
          onClick={() => setPanel("events")}
        >
          Events
        </button>
        <button
          type="button"
          className={panel === "contact" ? "active" : ""}
          onClick={() => setPanel("contact")}
        >
          Contact
        </button>
        <button
          type="button"
          className={panel === "terms" ? "active" : ""}
          onClick={() => setPanel("terms")}
        >
          Terms
        </button>
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
            });
          }}
        >
          Sign out
        </button>
      </aside>
      <div className="stack">
        <div className="admin-toolbar">
          <p className="muted">
            Saving writes to the database once, then publishes a cached copy for
            the public site.
          </p>
          <button type="button" onClick={() => void onSave()} disabled={saving}>
            {saving ? "Publishing…" : "Save and publish"}
          </button>
        </div>
        {status ? <p className="banner">{status}</p> : null}
        {content && panel === "site" ? (
          <SiteSettingsEditor content={content} setContent={updateContent} />
        ) : null}
        {content && panel !== "site" ? (
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
