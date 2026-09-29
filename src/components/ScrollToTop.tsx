import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // "instant" bypasses CSS `scroll-behavior: smooth` so route changes
    // always snap to top instead of starting a scroll that can be interrupted.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
