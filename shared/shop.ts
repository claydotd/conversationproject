export type ProductKind = "digital" | "physical";

export type OrderStatus = "pending" | "paid" | "failed";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  currency: string;
  kind: ProductKind;
  imageUrl?: string | null;
  downloadBlobKey?: string | null;
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
  name: string;
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
