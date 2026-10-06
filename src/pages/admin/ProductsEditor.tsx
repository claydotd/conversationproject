import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  formatPricePounds,
  slugifyProductName,
  type Product,
  type ProductDownload,
  type ProductKind,
} from "@shared/shop";
import {
  createAdminProduct,
  deleteAdminProduct,
  fetchAdminProducts,
  updateAdminProduct,
  uploadAdminProductFile,
} from "../../lib/api";
import { AdminImageFileInput } from "../../components/AdminImageFileInput";

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
  imageUrl: string;
  downloads: ProductDownload[];
}

interface ExternalDraft {
  label: string;
  url: string;
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `dl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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
      imageUrl: "",
      downloads: [],
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
    imageUrl: product.imageUrl ?? "",
    downloads: product.downloads ?? [],
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
    imageUrl: draft.imageUrl.trim() || null,
    downloads: draft.kind === "digital" ? draft.downloads : [],
  };
}

function downloadSummary(download: ProductDownload): string {
  if (download.source === "external") {
    return download.url ?? "External link";
  }
  return download.blobKey ? `File: ${download.blobKey}` : "Uploaded file";
}

export function ProductsEditor() {
  const [products, setProducts] = useState<Product[]>([]);
  const [draft, setDraft] = useState<Draft>(toDraft());
  const [externalDraft, setExternalDraft] = useState<ExternalDraft>({
    label: "",
    url: "",
  });
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function scrollToForm() {
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function startNewProduct() {
    setDraft(toDraft());
    setExternalDraft({ label: "", url: "" });
    setStatus("");
    scrollToForm();
  }

  function startEdit(product: Product) {
    setDraft(toDraft(product));
    setExternalDraft({ label: "", url: "" });
    setStatus("");
    scrollToForm();
  }

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
      setExternalDraft({ label: "", url: "" });
      await reload();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(product: Product) {
    const confirmed = window.confirm(
      `Delete “${product.name}”? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    setStatus("");
    try {
      await deleteAdminProduct(product.id);
      if (draft.id === product.id) {
        setDraft(toDraft());
      }
      setStatus("Product deleted.");
      await reload();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setDeleting(false);
    }
  }

  async function onUploadFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    setStatus("");
    try {
      const key = await uploadAdminProductFile(file);
      const label = file.name.replace(/\.[^.]+$/, "") || file.name;
      setDraft((current) => ({
        ...current,
        downloads: [
          ...current.downloads,
          {
            id: newId(),
            label,
            source: "blob",
            blobKey: key,
          },
        ],
      }));
      setStatus("File uploaded. Save the product to keep it.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function addExternalLink() {
    const label = externalDraft.label.trim() || "External download";
    const url = externalDraft.url.trim();
    if (!/^https?:\/\//i.test(url)) {
      setStatus("External links need a full http:// or https:// URL.");
      return;
    }
    setDraft((current) => ({
      ...current,
      downloads: [
        ...current.downloads,
        {
          id: newId(),
          label,
          source: "external",
          url,
        },
      ],
    }));
    setExternalDraft({ label: "", url: "" });
    setStatus("External link added. Save the product to keep it.");
  }

  function removeDownload(id: string) {
    setDraft((current) => ({
      ...current,
      downloads: current.downloads.filter((item) => item.id !== id),
    }));
  }

  function updateDownloadLabel(id: string, label: string) {
    setDraft((current) => ({
      ...current,
      downloads: current.downloads.map((item) =>
        item.id === id ? { ...item, label } : item,
      ),
    }));
  }

  return (
    <div className="admin-panel stack">
      <div className="admin-toolbar">
        <h1>Products</h1>
        <button type="button" className="ghost" onClick={startNewProduct}>
          New product
        </button>
      </div>
      <p className="muted">
        Changes save immediately to the database. Published products appear in
        the public shop.
      </p>
      {status ? <p className="banner">{status}</p> : null}
      {loading ? <p className="muted">Loading products…</p> : null}

      {!loading ? (
        <div className="stack">
          {products.map((product) => (
            <div
              key={product.id}
              className={
                draft.id === product.id ? "card card--editing" : "card"
              }
            >
              <div className="card__header">
                <div>
                  <strong>{product.name}</strong>
                  <p className="muted">
                    {formatPricePounds(product.priceCents, product.currency)} ·{" "}
                    {product.kind}
                    {product.kind === "digital"
                      ? ` · ${product.downloads.length} download${product.downloads.length === 1 ? "" : "s"}`
                      : ""}
                    {product.published ? "" : " · unpublished"}
                  </p>
                </div>
                <div className="inline-actions">
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => startEdit(product)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="danger"
                    disabled={deleting}
                    onClick={() => void onDelete(product)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <form
        ref={formRef}
        className="card field-grid"
        onSubmit={(event) => void onSave(event)}
      >
        <div className="card__header">
          <h2>{draft.id ? "Edit product" : "Add product"}</h2>
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
              type="number"
              step={1}
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
            type="number"
            min={0}
            step={1}
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

        <div className="stack">
          <AdminImageFileInput
            label="Product image"
            onUploaded={(url) => {
              setDraft((current) => ({ ...current, imageUrl: url }));
              setStatus("Image uploaded. Save the product to keep it.");
            }}
          />
          {draft.imageUrl ? (
            <div className="stack">
              <img
                className="preview-image preview-image--wide"
                src={draft.imageUrl}
                alt=""
              />
              <button
                type="button"
                className="ghost"
                onClick={() =>
                  setDraft((current) => ({ ...current, imageUrl: "" }))
                }
              >
                Remove image
              </button>
            </div>
          ) : (
            <p className="muted">No image uploaded yet.</p>
          )}
        </div>

        {draft.kind === "digital" ? (
          <div className="stack product-downloads">
            <h3>Downloads</h3>
            <p className="muted">
              Add one or more files (up to 5MB each), or external links for
              larger files hosted elsewhere (Drive, Dropbox, etc.).
            </p>

            {draft.downloads.length === 0 ? (
              <p className="muted">No downloads added yet.</p>
            ) : (
              <ul className="product-download-list">
                {draft.downloads.map((download) => (
                  <li key={download.id}>
                    <label>
                      Label
                      <input
                        value={download.label}
                        onChange={(event) =>
                          updateDownloadLabel(download.id, event.target.value)
                        }
                      />
                    </label>
                    <p className="muted">
                      {download.source === "external"
                        ? "External link"
                        : "Uploaded file"}{" "}
                      · {downloadSummary(download)}
                    </p>
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => removeDownload(download.id)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <label>
              Upload a file (≤5MB)
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.zip,.epub,.txt,.png,.jpg,.jpeg"
                onChange={(event) =>
                  void onUploadFile(event.target.files?.[0] ?? null)
                }
              />
            </label>
            <p className="muted">
              {uploading ? "Uploading…" : "PDF, ZIP, EPUB, text, or image."}
            </p>

            <div className="stack product-download-external">
              <strong>Or add an external download link</strong>
              <label>
                Label
                <input
                  value={externalDraft.label}
                  placeholder="e.g. Full PDF pack"
                  onChange={(event) =>
                    setExternalDraft((current) => ({
                      ...current,
                      label: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                URL
                <input
                  type="url"
                  value={externalDraft.url}
                  placeholder="https://"
                  onChange={(event) =>
                    setExternalDraft((current) => ({
                      ...current,
                      url: event.target.value,
                    }))
                  }
                />
              </label>
              <button
                type="button"
                className="ghost"
                disabled={!externalDraft.url.trim()}
                onClick={addExternalLink}
              >
                Add external link
              </button>
            </div>
          </div>
        ) : null}

        <div className="inline-actions">
          <button type="submit" disabled={saving || uploading}>
            {saving ? "Saving…" : draft.id ? "Update product" : "Create product"}
          </button>
          {draft.id ? (
            <button
              type="button"
              className="danger"
              disabled={saving || deleting || uploading}
              onClick={() => {
                const product = products.find((item) => item.id === draft.id);
                if (product) void onDelete(product);
              }}
            >
              {deleting ? "Deleting…" : "Delete product"}
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
