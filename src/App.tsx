import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ScrollToTop } from "./components/ScrollToTop";
import { AboutPage } from "./pages/About";
import { ContactPage } from "./pages/Contact";
import { EventsPage } from "./pages/Events";
import { HomePage } from "./pages/Home";
import { NotFoundPage } from "./pages/NotFound";
import { ShopPage } from "./pages/Shop";
import { TermsPage } from "./pages/Terms";

const AdminApp = lazy(() =>
  import("./pages/admin/AdminApp").then((m) => ({ default: m.AdminApp })),
);
const CartPage = lazy(() =>
  import("./pages/Cart").then((m) => ({ default: m.CartPage })),
);
const CheckoutPage = lazy(() =>
  import("./pages/Checkout").then((m) => ({ default: m.CheckoutPage })),
);
const DownloadsPage = lazy(() =>
  import("./pages/Downloads").then((m) => ({ default: m.DownloadsPage })),
);
const ShopSuccessPage = lazy(() =>
  import("./pages/ShopSuccess").then((m) => ({ default: m.ShopSuccessPage })),
);

function RouteFallback() {
  return <div className="page" style={{ padding: "2rem 0" }} />;
}

export function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/admin" element={<AdminApp />} />
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/shop/cart" element={<CartPage />} />
            <Route path="/shop/checkout" element={<CheckoutPage />} />
            <Route path="/shop/success" element={<ShopSuccessPage />} />
            <Route path="/downloads" element={<DownloadsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
