export type ProductKind = "digital" | "physical";

export type OrderStatus = "pending" | "paid" | "failed";

/** Hosted in Netlify Blobs (≤5MB) or an external storage URL for larger files. */
export type ProductDownloadSource = "blob" | "external";

export interface ProductDownload {
  id: string;
  label: string;
  source: ProductDownloadSource;
  /** Netlify Blobs key when source is "blob". */
  blobKey?: string;
  /** External download URL when source is "external". */
  url?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  currency: string;
  kind: ProductKind;
  imageUrl?: string | null;
  /** Digital deliverables; empty for physical products. */
  downloads: ProductDownload[];
  inventory?: number | null;
  published: boolean;
  sortOrder: number;
}

export interface CartItemInput {
  productId: string;
  quantity: number;
}

export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  country: string;
}

export interface CheckoutRequest {
  email: string;
  items: CartItemInput[];
  shipping?: ShippingAddress | null;
}

export interface CheckoutResponse {
  orderId: string;
  checkoutReference: string;
  hostedCheckoutUrl: string;
}

export interface ConfirmCheckoutRequest {
  checkoutReference: string;
}

export interface ConfirmCheckoutResponse {
  orderId: string;
  status: OrderStatus;
  email: string;
  hasDigitalItems: boolean;
  receiptSent: boolean;
}

export interface DownloadListingItem {
  productId: string;
  downloadId: string;
  name: string;
  label: string;
  downloadUrl: string;
}

export interface DownloadsResponse {
  email: string;
  items: DownloadListingItem[];
}

export function formatPricePounds(priceCents: number, currency = "GBP"): string {
  const amount = priceCents / 100;
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `£${amount.toFixed(2)}`;
  }
}

export function slugifyProductName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "product";
}

export function normalizeProductDownloads(
  value: unknown,
  legacyBlobKey?: string | null,
): ProductDownload[] {
  const fromJson = Array.isArray(value)
    ? value.flatMap((item): ProductDownload[] => {
        if (!item || typeof item !== "object") return [];
        const raw = item as Record<string, unknown>;
        const id = String(raw.id ?? "").trim();
        const label = String(raw.label ?? "").trim() || "Download";
        const source =
          raw.source === "external" || raw.source === "blob"
            ? raw.source
            : null;
        if (!id || !source) return [];
        if (source === "blob") {
          const blobKey = String(raw.blobKey ?? "").trim();
          if (!blobKey) return [];
          return [{ id, label, source: "blob", blobKey }];
        }
        const url = String(raw.url ?? "").trim();
        if (!/^https?:\/\//i.test(url)) return [];
        return [{ id, label, source: "external", url }];
      })
    : [];

  if (fromJson.length > 0) return fromJson;

  const legacy = String(legacyBlobKey ?? "").trim();
  if (!legacy) return [];
  return [
    {
      id: "legacy",
      label: "Download",
      source: "blob",
      blobKey: legacy,
    },
  ];
}

