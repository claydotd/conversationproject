import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { formatPricePounds, type Product } from "@shared/shop";
import { Seo } from "../components/Seo";
import { fetchProducts } from "../lib/api";
import { useCart } from "../lib/cart-context";

export function CartPage() {
  const { items, setQuantity, removeItem, itemCount } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
              : "Unable to load trolley products.",
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

  const totalCents = lines.reduce(
    (sum, line) => sum + line.product.priceCents * line.item.quantity,
    0,
  );

  return (
    <div className="page shop-page">
      <Seo title="Trolley" description="Review items before checkout." />
      <section className="section shop-intro">
        <p className="eyebrow">Shop</p>
        <h1>Your trolley</h1>
        <p>
          <Link className="text-link" to="/shop">
            Continue shopping
          </Link>
        </p>
      </section>

      <section className="section">
        {loading ? <p className="muted">Loading…</p> : null}
        {!loading && error ? <p className="banner">{error}</p> : null}
        {!loading && !error && itemCount === 0 ? (
          <p className="muted">Your trolley is empty.</p>
        ) : null}
        {!loading && !error && lines.length > 0 ? (
          <div className="cart-layout">
            <ul className="cart-list">
              {lines.map(({ item, product }) => (
                <li key={product.id} className="cart-row">
                  <div>
                    <h2>{product.name}</h2>
                    <p className="muted">
                      {formatPricePounds(product.priceCents, product.currency)}{" "}
                      each ·{" "}
                      {product.kind === "digital" ? "Digital" : "Physical"}
                    </p>
                  </div>
                  <div className="cart-row__controls">
                    <label>
                      Qty
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(event) =>
                          setQuantity(
                            product.id,
                            Number(event.target.value) || 0,
                          )
                        }
                      />
                    </label>
                    <p>
                      {formatPricePounds(
                        product.priceCents * item.quantity,
                        product.currency,
                      )}
                    </p>
                    <button
                      className="ghost"
                      type="button"
                      onClick={() => removeItem(product.id)}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <aside className="cart-summary">
              <p>
                Total{" "}
                <strong>
                  {formatPricePounds(totalCents, lines[0]?.product.currency)}
                </strong>
              </p>
              <Link className="button-link" to="/shop/checkout">
                Checkout
              </Link>
            </aside>
          </div>
        ) : null}
      </section>
    </div>
  );
}
