import { useSiteContent } from "../lib/content-context";

export function Footer() {
  const { content } = useSiteContent();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <p>
          © {year} {content.site.name}. {content.site.footerText}
        </p>
        <p>
          {content.site.contactEmail ? (
            <a href={`mailto:${content.site.contactEmail}`}>
              {content.site.contactEmail}
            </a>
          ) : null}
        </p>
      </div>
    </footer>
  );
}
