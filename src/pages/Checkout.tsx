import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatPricePounds, type Product } from "@shared/shop";
import { Seo } from "../components/Seo";
import { fetchProducts, startCheckout } from "../lib/api";
import { useCart } from "../lib/cart-context";

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, itemCount } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [shipping, setShipping] = useState({
    name: "",
    line1: "",
    line2: "",
    city: "",
    postcode: "",
    country: "United Kingdom",
  });

  useEffect(() => {
    let cancelled = false;
    fetchProducts()
      .then((next) => {
        if (!cancelled) setProducts(next);
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load checkout.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const byId = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const lines = items
    .map((item) => {
      const product = byId.get(item.productId);
      if (!product) return null;
      return { item, product };
    })
    .filter((line): line is { item: (typeof items)[number]; product: Product } =>
      Boolean(line),
    );

  const needsShipping = lines.some(({ product }) => product.kind === "physical");
  const totalCents = lines.reduce(
    (sum, line) => sum + line.product.priceCents * line.item.quantity,
    0,
  );

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (lines.length === 0) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await startCheckout({
        email,
        items: lines.map(({ item }) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        shipping: needsShipping ? shipping : null,
      });
      window.location.href = result.hostedCheckoutUrl;
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to start checkout.",
      );
      setSubmitting(false);
    }
  }

  if (!loading && itemCount === 0) {
    return (
      <div className="page shop-page">
        <Seo title="Checkout" description="Pay for your trolley." />
        <section className="section shop-intro">
          <h1>Checkout</h1>
          <p className="muted">Your trolley is empty.</p>
          <p>
            <Link className="text-link" to="/shop">
              Back to shop
            </Link>
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="page shop-page">
      <Seo title="Checkout" description="Pay for your trolley with SumUp." />
      <section className="section shop-intro">
        <p className="eyebrow">Shop</p>
        <h1>Checkout</h1>
        <p>
          <button
            className="text-button"
            type="button"
            onClick={() => navigate("/shop/cart")}
          >
            Back to trolley
          </button>
        </p>
      </section>

      <section className="section checkout-layout">
        {loading ? <p className="muted">Loading…</p> : null}
        {!loading ? (
          <>
            <form className="checkout-form" onSubmit={(event) => void onSubmit(event)}>
              <label>
                Email
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              <p className="muted">
                We use this email for your receipt
                {needsShipping ? "" : " and to unlock digital downloads"}.
              </p>

              {needsShipping ? (
                <fieldset className="shipping-fields">
                  <legend>Shipping address</legend>
                  <label>
                    Full name
                    <input
                      required
                      autoComplete="name"
                      value={shipping.name}
                      onChange={(event) =>
                        setShipping((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    Address line 1
                    <input
                      required
                      autoComplete="address-line1"
                      value={shipping.line1}
                      onChange={(event) =>
                        setShipping((current) => ({
                          ...current,
                          line1: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    Address line 2
                    <input
                      autoComplete="address-line2"
                      value={shipping.line2}
                      onChange={(event) =>
                        setShipping((current) => ({
                          ...current,
                          line2: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <div className="field-row">
                    <label>
                      City
                      <input
                        required
                        autoComplete="address-level2"
                        value={shipping.city}
                        onChange={(event) =>
                          setShipping((current) => ({
                            ...current,
                            city: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      Postcode
                      <input
                        required
                        autoComplete="postal-code"
                        value={shipping.postcode}
                        onChange={(event) =>
                          setShipping((current) => ({
                            ...current,
                            postcode: event.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>
                  <label>
                    Country
                    <input
                      required
                      autoComplete="country-name"
                      value={shipping.country}
                      onChange={(event) =>
                        setShipping((current) => ({
                          ...current,
                          country: event.target.value,
                        }))
                      }
                    />
                  </label>
                </fieldset>
              ) : null}

              {error ? <p className="banner">{error}</p> : null}

              <button type="submit" disabled={submitting || lines.length === 0}>
                {submitting ? "Redirecting to SumUp…" : "Pay with SumUp"}
              </button>
            </form>

            <aside className="cart-summary">
              <h2>Order summary</h2>
              <ul className="checkout-summary-list">
                {lines.map(({ item, product }) => (
                  <li key={product.id}>
                    <span>
                      {item.quantity} × {product.name}
                    </span>
                    <span>
                      {formatPricePounds(
                        product.priceCents * item.quantity,
                        product.currency,
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              <p>
                Total{" "}
                <strong>
                  {formatPricePounds(
                    totalCents,
                    lines[0]?.product.currency ?? "GBP",
                  )}
                </strong>
              </p>
            </aside>
          </>
        ) : null}
      </section>
    </div>
  );
}
