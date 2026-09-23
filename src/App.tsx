import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ScrollToTop } from "./components/ScrollToTop";
import { AboutPage } from "./pages/About";
import { AdminApp } from "./pages/admin/AdminApp";
import { CartPage } from "./pages/Cart";
import { CheckoutPage } from "./pages/Checkout";
import { ContactPage } from "./pages/Contact";
import { DownloadsPage } from "./pages/Downloads";
import { EventsPage } from "./pages/Events";
import { HomePage } from "./pages/Home";
import { NotFoundPage } from "./pages/NotFound";
import { ShopPage } from "./pages/Shop";
import { ShopSuccessPage } from "./pages/ShopSuccess";
import { TermsPage } from "./pages/Terms";

export function App() {
  return (
    <>
      <ScrollToTop />
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
    </>
  );
}
