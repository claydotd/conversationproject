import { useEffect, useState, type FormEvent } from "react";
import {
  formatPricePounds,
  slugifyProductName,
  type Product,
  type ProductKind,
} from "@shared/shop";
import {
  createAdminProduct,
  fetchAdminProducts,
  updateAdminProduct,
  uploadAdminProductFile,
} from "../../lib/api";

interface Draft {
  id?: string;
  name: string;
  slug: string;
  description: string;
  pricePounds: string;
  kind: ProductKind;
  published: boolean;
  inventory: string;
  sortOrder: string;
  downloadBlobKey: string;
}

function toDraft(product?: Product): Draft {
  if (!product) {
    return {
      name: "",
      slug: "",
      description: "",
      pricePounds: "5.00",
      kind: "digital",
      published: true,
      inventory: "",
      sortOrder: "0",
      downloadBlobKey: "",
    };
  }
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    pricePounds: (product.priceCents / 100).toFixed(2),
    kind: product.kind,
    published: product.published,
    inventory:
      product.inventory === null || product.inventory === undefined
        ? ""
        : String(product.inventory),
    sortOrder: String(product.sortOrder ?? 0),
    downloadBlobKey: product.downloadBlobKey ?? "",
  };
}

function draftToPayload(draft: Draft): Omit<Product, "id"> {
  const pounds = Number(draft.pricePounds);
  const priceCents = Math.round((Number.isFinite(pounds) ? pounds : 0) * 100);
  const inventory =
    draft.inventory.trim() === ""
      ? null
      : Math.floor(Number(draft.inventory));
  return {
    name: draft.name.trim(),
    slug: draft.slug.trim() || slugifyProductName(draft.name),
    description: draft.description.trim(),
    priceCents,
    currency: "GBP",
    kind: draft.kind,
    published: draft.published,
    inventory: Number.isFinite(inventory as number) ? inventory : null,
    sortOrder: Math.floor(Number(draft.sortOrder) || 0),
    downloadBlobKey:
      draft.kind === "digital" ? draft.downloadBlobKey || null : null,
  };
}

export function ProductsEditor() {
  const [products, setProducts] = useState<Product[]>([]);
  const [draft, setDraft] = useState<Draft>(toDraft());
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function reload() {
    const next = await fetchAdminProducts();
    setProducts(next);
  }

  useEffect(() => {
    void reload()
      .catch((error: unknown) => {
        setStatus(
          error instanceof Error ? error.message : "Unable to load products.",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setStatus("");
    try {
      const payload = draftToPayload(draft);
      if (draft.id) {
        await updateAdminProduct(draft.id, payload);
        setStatus("Product updated.");
      } else {
        await createAdminProduct(payload);
        setStatus("Product created.");
      }
      setDraft(toDraft());
      await reload();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function onUpload(file: File | null) {
    if (!file) return;
    setUploading(true);
    setStatus("");
    try {
      const key = await uploadAdminProductFile(file);
      setDraft((current) => ({ ...current, downloadBlobKey: key }));
      setStatus("File uploaded. Save the product to keep it.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="admin-panel stack">
      <h1>Products</h1>
      <p className="muted">
        Changes save immediately to the database. Published products appear in
        the public shop.
      </p>
      {status ? <p className="banner">{status}</p> : null}
      {loading ? <p className="muted">Loading products…</p> : null}

      {!loading ? (
        <div className="stack">
          {products.map((product) => (
            <div key={product.id} className="card">
              <div className="card__header">
                <div>
                  <strong>{product.name}</strong>
                  <p className="muted">
                    {formatPricePounds(product.priceCents, product.currency)} ·{" "}
                    {product.kind}
                    {product.published ? "" : " · unpublished"}
                  </p>
                </div>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => setDraft(toDraft(product))}
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <form className="card field-grid" onSubmit={(event) => void onSave(event)}>
        <div className="card__header">
          <h2>{draft.id ? "Edit product" : "Add product"}</h2>
          {draft.id ? (
            <button
              type="button"
              className="ghost"
              onClick={() => setDraft(toDraft())}
            >
              New product
            </button>
          ) : null}
        </div>

        <label>
          Name
          <input
            required
            value={draft.name}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                name: event.target.value,
                slug:
                  current.id || current.slug
                    ? current.slug
                    : slugifyProductName(event.target.value),
              }))
            }
          />
        </label>
        <label>
          Slug
          <input
            required
            value={draft.slug}
            onChange={(event) =>
              setDraft((current) => ({ ...current, slug: event.target.value }))
            }
          />
        </label>
        <label>
          Description
          <textarea
            rows={4}
            value={draft.description}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />
        </label>
        <div className="field-row">
          <label>
            Price (£)
            <input
              required
              inputMode="decimal"
              value={draft.pricePounds}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  pricePounds: event.target.value,
                }))
              }
            />
          </label>
          <label>
            Kind
            <select
              value={draft.kind}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  kind: event.target.value as ProductKind,
                }))
              }
            >
              <option value="digital">Digital</option>
              <option value="physical">Physical</option>
            </select>
          </label>
          <label>
            Sort order
            <input
              value={draft.sortOrder}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  sortOrder: event.target.value,
                }))
              }
            />
          </label>
        </div>
        <label>
          Inventory (optional)
          <input
            value={draft.inventory}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                inventory: event.target.value,
              }))
            }
          />
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={draft.published}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                published: event.target.checked,
              }))
            }
          />
          Published in shop
        </label>

        {draft.kind === "digital" ? (
          <div className="stack">
            <label>
              Download file
              <input
                type="file"
                accept=".pdf,.zip,.epub,.txt,.png,.jpg,.jpeg"
                onChange={(event) =>
                  void onUpload(event.target.files?.[0] ?? null)
                }
              />
            </label>
            <p className="muted">
              {uploading
                ? "Uploading…"
                : draft.downloadBlobKey
                  ? `File key: ${draft.downloadBlobKey}`
                  : "No file uploaded yet."}
            </p>
          </div>
        ) : null}

        <button type="submit" disabled={saving || uploading}>
          {saving ? "Saving…" : draft.id ? "Update product" : "Create product"}
        </button>
      </form>
    </div>
  );
}
