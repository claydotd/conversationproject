import { Outlet } from "react-router-dom";
import { useSiteContent } from "../lib/content-context";
import { Footer } from "./Footer";
import { Header } from "./Header";

export function Layout() {
  const { loading } = useSiteContent();

  if (loading) {
    return <main id="main" aria-busy="true" />;
  }

  return (
    <>
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
