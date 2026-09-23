import { Link } from "react-router-dom";
import { useSiteContent } from "../lib/content-context";
import { NewsletterSignup } from "./NewsletterSignup";

export function Footer() {
  const { content } = useSiteContent();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__grid">
          <NewsletterSignup />
          <div className="site-footer__aside">
            {content.site.contactEmail ? (
              <a href={`mailto:${content.site.contactEmail}`}>
                {content.site.contactEmail}
              </a>
            ) : null}
            <Link to="/terms">Terms and conditions</Link>
          </div>
        </div>
        <div className="site-footer__bottom">
          <p className="site-footer__copy">
            © {year} {content.site.name}. {content.site.footerText}
          </p>
          <p className="made-by">Site made by <a href="https://analoguegonedigital.co.uk" target="_blank" rel="noopener noreferrer">analoguegonedigital.co.uk</a></p>
        </div>
      </div>
    </footer>
  );
}
