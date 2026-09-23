import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { ConfirmCheckoutResponse } from "@shared/shop";
import { Seo } from "../components/Seo";
import { confirmCheckout } from "../lib/api";
import { useCart } from "../lib/cart-context";

export function ShopSuccessPage() {
  const [params] = useSearchParams();
  const reference = params.get("ref") ?? "";
  const { clear } = useCart();
  const clearRef = useRef(clear);
  clearRef.current = clear;
  const clearedRef = useRef(false);
  const [result, setResult] = useState<ConfirmCheckoutResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reference) {
      setError("Missing checkout reference.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    let attempts = 0;
    let timer: number | undefined;

    async function poll() {
      attempts += 1;
      try {
        const next = await confirmCheckout(reference);
        if (cancelled) return;
        setResult(next);
        if (next.status === "paid") {
          if (!clearedRef.current) {
            clearedRef.current = true;
            clearRef.current();
          }
          setLoading(false);
          return;
        }
        if (next.status === "failed") {
          setLoading(false);
          return;
        }
        if (attempts < 8) {
          timer = window.setTimeout(() => {
            void poll();
          }, 1500);
          return;
        }
        setLoading(false);
      } catch (cause) {
        if (cancelled) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to confirm payment.",
        );
        setLoading(false);
      }
    }

    void poll();
    return () => {
      cancelled = true;
      if (timer !== undefined) {
        window.clearTimeout(timer);
      }
    };
  }, [reference]);

  return (
    <div className="page shop-page">
      <Seo title="Order complete" description="Thanks for your order." />
      <section className="section shop-intro">
        <p className="eyebrow">Shop</p>
        {loading ? (
          <>
            <h1>Confirming payment…</h1>
            <p className="muted">This usually only takes a moment.</p>
          </>
        ) : null}
        {!loading && error ? (
          <>
            <h1>Something went wrong</h1>
            <p className="banner">{error}</p>
            <p>
              <Link className="text-link" to="/shop">
                Back to shop
              </Link>
            </p>
          </>
        ) : null}
        {!loading && !error && result?.status === "paid" ? (
          <>
            <h1>Thank you</h1>
            <p>
              Payment received
              {result.email ? ` for ${result.email}` : ""}.
              {result.receiptSent
                ? " A receipt email is on its way."
                : " Your receipt email will follow shortly if email sending is configured."}
            </p>
            {result.hasDigitalItems ? (
              <p>
                Digital downloads are available on the{" "}
                <Link className="text-link" to="/downloads">
                  downloads page
                </Link>{" "}
                using the same email address.
              </p>
            ) : null}
            <p>
              <Link className="text-link" to="/shop">
                Continue shopping
              </Link>
            </p>
          </>
        ) : null}
        {!loading && !error && result?.status === "failed" ? (
          <>
            <h1>Payment not completed</h1>
            <p>The SumUp checkout did not complete successfully.</p>
            <p>
              <Link className="text-link" to="/shop/cart">
                Return to trolley
              </Link>
            </p>
          </>
        ) : null}
        {!loading && !error && result?.status === "pending" ? (
          <>
            <h1>Payment still processing</h1>
            <p>
              SumUp has not marked this checkout as paid yet. Refresh this page
              in a moment, or check your email for a receipt.
            </p>
            <p>
              <Link className="text-link" to="/downloads">
                Downloads page
              </Link>
            </p>
          </>
        ) : null}
      </section>
    </div>
  );
}
