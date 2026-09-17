import { Link } from "react-router-dom";
import { Seo } from "../components/Seo";

export function NotFoundPage() {
  return (
    <div className="page not-found">
      <Seo
        title="Page not found"
        description="That page is not on this site."
      />
      <h1>This page is not here.</h1>
      <p className="muted">
        The address may have changed, or the page may not have been published
        yet.
      </p>
      <p>
        <Link to="/">Return home</Link>
      </p>
    </div>
  );
}
