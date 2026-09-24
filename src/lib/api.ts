import { defaultContent } from "@shared/default-content";
import type { EventsListing } from "@shared/events";
import { normalizeSiteContent } from "@shared/normalize-content";
import type {
  CheckoutRequest,
  CheckoutResponse,
  ConfirmCheckoutResponse,
  DownloadsResponse,
  Product,
} from "@shared/shop";
import type { SiteContent } from "@shared/types";

async function readError(response: Response, fallback: string): Promise<string> {
  const payload = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;
  return payload?.error ?? fallback;
}

export async function fetchPublishedContent(): Promise<SiteContent> {
  const response = await fetch("/api/content");
  if (!response.ok) {
    return defaultContent;
  }
  return normalizeSiteContent(await response.json());
}

export async function fetchAdminSession(): Promise<{
  authenticated: boolean;
  passwordConfigured: boolean;
}> {
  const response = await fetch("/api/admin/session");
  if (!response.ok) {
    return { authenticated: false, passwordConfigured: true };
  }
  return response.json();
}

export async function loginAdmin(
  username: string,
  password: string,
): Promise<void> {
  const response = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    throw new Error(await readError(response, "Unable to sign in."));
  }
}

export async function logoutAdmin(): Promise<void> {
  await fetch("/api/admin/logout", { method: "POST" });
}

export async function fetchAdminContent(): Promise<SiteContent> {
  const response = await fetch("/api/admin/content");
  if (!response.ok) {
    throw new Error(
      await readError(response, "Unable to load editable content."),
    );
  }
  return normalizeSiteContent(await response.json());
}

export async function saveAdminContent(
  content: SiteContent,
): Promise<SiteContent> {
  const response = await fetch("/api/admin/content", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(content),
  });
  if (!response.ok) {
    throw new Error(await readError(response, "Unable to save content."));
  }
  return normalizeSiteContent(await response.json());
}

export async function uploadAdminImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/api/admin/media", {
    method: "POST",
    body,
  });
  if (!response.ok) {
    throw new Error(await readError(response, "Unable to upload the image."));
  }
  const payload = (await response.json()) as { url: string };
  return payload.url;
}

export async function fetchEvents(): Promise<EventsListing> {
  const response = await fetch("/api/events");
  if (!response.ok) {
    throw new Error(await readError(response, "Unable to load events."));
  }
  return (await response.json()) as EventsListing;
}

export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch("/api/products");
  if (!response.ok) {
    throw new Error(await readError(response, "Unable to load products."));
  }
  const payload = (await response.json()) as { products: Product[] };
  return payload.products ?? [];
}

export async function fetchAdminProducts(): Promise<Product[]> {
  const response = await fetch("/api/admin/products");
  if (!response.ok) {
    throw new Error(await readError(response, "Unable to load products."));
  }
  const payload = (await response.json()) as { products: Product[] };
  return payload.products ?? [];
}

export async function createAdminProduct(
  product: Omit<Product, "id">,
): Promise<Product> {
  const response = await fetch("/api/admin/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });
  if (!response.ok) {
    throw new Error(await readError(response, "Unable to create product."));
  }
  const payload = (await response.json()) as { product: Product };
  return payload.product;
}

export async function updateAdminProduct(
  id: string,
  product: Omit<Product, "id">,
): Promise<Product> {
  const response = await fetch(
    `/api/admin/products/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    },
  );
  if (!response.ok) {
    throw new Error(await readError(response, "Unable to update product."));
  }
  const payload = (await response.json()) as { product: Product };
  return payload.product;
}

export async function uploadAdminProductFile(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/api/admin/product-files", {
    method: "POST",
    body,
  });
  if (!response.ok) {
    throw new Error(await readError(response, "Unable to upload the file."));
  }
  const payload = (await response.json()) as { key: string };
  return payload.key;
}

export async function startCheckout(
  payload: CheckoutRequest,
): Promise<CheckoutResponse> {
  const response = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await readError(response, "Unable to start checkout."));
  }
  return (await response.json()) as CheckoutResponse;
}

export async function confirmCheckout(
  checkoutReference: string,
): Promise<ConfirmCheckoutResponse> {
  const response = await fetch("/api/checkout/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ checkoutReference }),
  });
  if (!response.ok) {
    throw new Error(await readError(response, "Unable to confirm payment."));
  }
  return (await response.json()) as ConfirmCheckoutResponse;
}

export async function fetchDownloadsForEmail(
  email: string,
): Promise<DownloadsResponse> {
  const response = await fetch("/api/downloads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    throw new Error(await readError(response, "Unable to look up downloads."));
  }
  return (await response.json()) as DownloadsResponse;
}

export function encodeForm(data: Record<string, string>): string {
  return Object.entries(data)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    )
    .join("&");
}
