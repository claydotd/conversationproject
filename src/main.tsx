import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { CartProvider } from "./lib/cart-context";
import { ContentProvider } from "./lib/content-context";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ContentProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </ContentProvider>
    </BrowserRouter>
  </StrictMode>,
);
