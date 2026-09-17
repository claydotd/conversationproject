import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AboutPage } from "./pages/About";
import { AdminApp } from "./pages/admin/AdminApp";
import { ContactPage } from "./pages/Contact";
import { HomePage } from "./pages/Home";
import { NotFoundPage } from "./pages/NotFound";

export function App() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminApp />} />
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
