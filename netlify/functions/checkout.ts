import type { Config, Context } from "@netlify/functions";
import type { CheckoutRequest, ShippingAddress } from "../../shared/shop";
import { getEnv } from "../lib/env";
import {
  fulfillCheckoutBySumupId,
  fulfillOrderFromSumup,
} from "../lib/fulfillment";
import { errorJson, json } from "../lib/http";
import {
  createPendingOrder,
  findOrderByCheckoutReference,
  findOrderBySumupCheckoutId,
  markOrderFailed,
  setOrderCheckoutId,
  type OrderRecord,
} from "../lib/orders";
import { getProductsByIds } from "../lib/products";
import { createHostedCheckout, sumupConfigured } from "../lib/sumup";

function requirePublicSiteUrl(): string {
  const configured = getEnv("PUBLIC_SITE_URL")?.trim().replace(/\/$/, "");
  if (!configured) {
    throw new Error(
      "PUBLIC_SITE_URL must be set to your absolute site URL (e.g. https://example.com).",
    );
  }
  return configured;
}

function siteUrlForEmails(req: Request): string {
  const configured = getEnv("PUBLIC_SITE_URL")?.trim().replace(/\/$/, "");
  if (configured) return configured;
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeShipping(
  value: ShippingAddress | null | undefined,
): ShippingAddress | null {
  if (!value) return null;
  const name = String(value.name ?? "").trim();
  const line1 = String(value.line1 ?? "").trim();
  const city = String(value.city ?? "").trim();
  const postcode = String(value.postcode ?? "").trim();
  const country = String(value.country ?? "").trim();
  if (!name || !line1 || !city || !postcode || !country) {
    return null;
  }
  return {
    name,
    line1,
    line2: String(value.line2 ?? "").trim(),
    city,
    postcode,
    country,
  };
}

async function handleCreateCheckout(req: Request) {
  if (!sumupConfigured()) {
    return errorJson(
      "SumUp is not configured. Set SUMUP_API_KEY and SUMUP_MERCHANT_CODE.",
      503,
    );
  }

  let siteUrl: string;
  try {
    siteUrl = requirePublicSiteUrl();
  } catch (error) {
    return errorJson(
      error instanceof Error ? error.message : "PUBLIC_SITE_URL is required.",
      503,
    );
  }

  const body = (await req.json()) as CheckoutRequest;
  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  if (!isValidEmail(email)) {
    return errorJson("A valid email address is required.");
  }

  const rawItems = Array.isArray(body.items) ? body.items : [];
  const quantities = new Map<string, number>();
  for (const item of rawItems) {
    const productId = String(item?.productId ?? "");
    const quantity = Math.floor(Number(item?.quantity));
    if (!productId || !Number.isFinite(quantity) || quantity < 1) continue;
    quantities.set(productId, (quantities.get(productId) ?? 0) + quantity);
  }
  if (quantities.size === 0) {
    return errorJson("Your trolley is empty.");
  }

  const products = await getProductsByIds([...quantities.keys()]);
  const byId = new Map(products.map((product) => [product.id, product]));
  const lineItems: Array<{
    productId: string;
    name: string;
    unitPriceCents: number;
    quantity: number;
    kind: "digital" | "physical";
  }> = [];

  for (const [productId, quantity] of quantities) {
    const product = byId.get(productId);
    if (!product || !product.published) {
      return errorJson("One or more products are no longer available.", 409);
    }
    lineItems.push({
      productId: product.id,
      name: product.name,
      unitPriceCents: product.priceCents,
      quantity,
      kind: product.kind,
    });
  }

  const needsShipping = lineItems.some((item) => item.kind === "physical");
  const shipping = normalizeShipping(body.shipping);
  if (needsShipping && !shipping) {
    return errorJson(
      "A complete shipping address is required for physical products.",
    );
  }

  const currency = lineItems[0]
    ? (byId.get(lineItems[0].productId)?.currency ?? "GBP")
    : "GBP";
  const totalCents = lineItems.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0,
  );
  if (totalCents < 1) {
    return errorJson("Order total must be greater than zero.");
  }

  const checkoutReference = crypto.randomUUID();
  const order = await createPendingOrder({
    email,
    currency,
    totalCents,
    checkoutReference,
    shipping: needsShipping ? shipping : null,
    items: lineItems,
  });

  const description = lineItems
    .map((item) => `${item.name} × ${item.quantity}`)
    .join(", ");

  try {
    const checkout = await createHostedCheckout({
      amountMajor: totalCents / 100,
      currency,
      checkoutReference,
      description,
      redirectUrl: `${siteUrl}/shop/success?ref=${encodeURIComponent(checkoutReference)}`,
      returnUrl: `${siteUrl}/api/checkout/webhook`,
    });
    if (!checkout.id || !checkout.hosted_checkout_url) {
      throw new Error("SumUp did not return a hosted checkout URL.");
    }
    await setOrderCheckoutId(order.id, checkout.id);
    return json({
      orderId: order.id,
      checkoutReference,
      hostedCheckoutUrl: checkout.hosted_checkout_url,
    });
  } catch (error) {
    await markOrderFailed(order.id);
    throw error;
  }
}

function confirmResponse(order: OrderRecord, receiptSent: boolean) {
  return json({
    orderId: order.id,
    status: order.status,
    email: order.email,
    hasDigitalItems: order.items.some((item) => item.kind === "digital"),
    receiptSent,
  });
}

async function handleConfirmCheckout(req: Request) {
  if (!sumupConfigured()) {
    return errorJson(
      "SumUp is not configured. Set SUMUP_API_KEY and SUMUP_MERCHANT_CODE.",
      503,
    );
  }

  const body = (await req.json()) as { checkoutReference?: string };
  const checkoutReference = String(body.checkoutReference ?? "").trim();
  if (!checkoutReference) {
    return errorJson("Missing checkout reference.");
  }

  // Success URL uses sumup_checkout_reference; recovery may use SumUp's checkout id.
  const order =
    (await findOrderByCheckoutReference(checkoutReference)) ??
    (await findOrderBySumupCheckoutId(checkoutReference));
  if (!order) {
    return errorJson("Order not found.", 404);
  }

  if (!order.sumupCheckoutId && order.status === "pending") {
    return errorJson("This order does not have a SumUp checkout yet.", 409);
  }

  const result = await fulfillOrderFromSumup(order, siteUrlForEmails(req));
  return confirmResponse(result.order, result.receiptSent);
}

async function handleSumupWebhook(req: Request) {
  if (!sumupConfigured()) {
    // Still 2xx so SumUp does not retry forever on misconfiguration noise.
    console.error("SumUp webhook received but SumUp is not configured.");
    return new Response(null, { status: 204 });
  }

  let payload: { event_type?: string; id?: string };
  try {
    payload = (await req.json()) as { event_type?: string; id?: string };
  } catch {
    return new Response(null, { status: 204 });
  }

  const eventType = String(payload.event_type ?? "");
  const checkoutId = String(payload.id ?? "").trim();
  if (eventType && eventType !== "CHECKOUT_STATUS_CHANGED") {
    return new Response(null, { status: 204 });
  }
  if (!checkoutId) {
    return new Response(null, { status: 204 });
  }

  try {
    const siteUrl = requirePublicSiteUrl();
    const result = await fulfillCheckoutBySumupId(checkoutId, siteUrl);
    if (!result) {
      // Order row may not have sumup_checkout_id yet; ask SumUp to retry.
      console.warn("SumUp webhook: no order for checkout", checkoutId);
      return new Response(null, { status: 500 });
    }
  } catch (error) {
    console.error("SumUp webhook fulfillment failed.", error);
    return new Response(null, { status: 500 });
  }

  return new Response(null, { status: 204 });
}

export default async (req: Request, _context: Context) => {
  const { pathname } = new URL(req.url);
  try {
    if (pathname === "/api/checkout" && req.method === "POST") {
      return await handleCreateCheckout(req);
    }
    if (pathname === "/api/checkout/confirm" && req.method === "POST") {
      return await handleConfirmCheckout(req);
    }
    if (pathname === "/api/checkout/webhook" && req.method === "POST") {
      return await handleSumupWebhook(req);
    }
    return errorJson("Not found", 404);
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";
    return errorJson(message, 500);
  }
};

export const config: Config = {
  path: ["/api/checkout", "/api/checkout/*"],
};
