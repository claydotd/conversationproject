import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatPricePounds, type Product } from "@shared/shop";
import { Seo } from "../components/Seo";
import { fetchProducts } from "../lib/api";
import { useCart } from "../lib/cart-context";

export function ShopPage() {
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addedId, setAddedId] = useState("");

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
              : "Unable to load the shop right now.",
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

  return (
    <div className="page shop-page">
      <Seo
        title="Shop"
        description="Digital conversation prompts and the Conversation Project card deck."
      />
      <section className="section shop-intro">
        <h1>Shop</h1>
        <p>
          <Link className="text-link" to="/shop/cart">
            View trolley
          </Link>
          {" · "}
          <Link className="text-link" to="/downloads">
            Access digital downloads
          </Link>
        </p>
      </section>

      <section className="section">
        {loading ? <p className="muted">Loading products…</p> : null}
        {!loading && error ? <p className="banner">{error}</p> : null}
        {!loading && !error && products.length === 0 ? (
          <p className="muted">No products are available yet.</p>
        ) : null}
        {!loading && !error && products.length > 0 ? (
          <ul className="product-grid">
            {products.map((product) => (
              <li key={product.id} className="product-card">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt="" />
                ) : (
                  <div className="product-card__placeholder" aria-hidden="true" />
                )}
                <div className="product-card__body">
                  <h2>{product.name}</h2>
                  {product.description ? (
                    <p className="product-card__description">
                      {product.description}
                    </p>
                  ) : null}
                  <p className="product-card__meta">
                    <span>
                      {formatPricePounds(product.priceCents, product.currency)}
                    </span>
                    <span className="product-card__kind">
                      {product.kind === "digital"
                        ? "Digital download"
                        : "Physical"}
                    </span>
                  </p>
                  <button
                    type="button"
                    className="add-to-trolley"
                    onClick={() => {
                      addItem(product.id);
                      setAddedId(product.id);
                      window.setTimeout(() => setAddedId(""), 1600);
                    }}
                  >
                    {addedId === product.id ? "Added" : "Add to trolley"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
