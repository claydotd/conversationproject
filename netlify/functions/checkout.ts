import type { Config, Context } from "@netlify/functions";
import type { CheckoutRequest, ShippingAddress } from "../../shared/shop";
import { getEnv } from "../lib/env";
import { errorJson, json } from "../lib/http";
import { sendOrderReceiptEmail } from "../lib/mail";
import {
  claimReceiptSend,
  clearReceiptSent,
  createPendingOrder,
  findOrderByCheckoutReference,
  markOrderFailed,
  markOrderPaid,
  setOrderCheckoutId,
  type OrderRecord,
} from "../lib/orders";
import { getProductsByIds } from "../lib/products";
import {
  createHostedCheckout,
  getCheckout,
  isCheckoutFailed,
  isCheckoutPaid,
  sumupConfigured,
} from "../lib/sumup";

function siteUrlFromRequest(req: Request): string {
  const configured = getEnv("PUBLIC_SITE_URL");
  if (configured) return configured.replace(/\/$/, "");
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

  const siteUrl = siteUrlFromRequest(req);
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

async function sendReceiptIfNeeded(
  order: OrderRecord,
  req: Request,
): Promise<boolean> {
  if (order.receiptSentAt) return true;

  const claimed = await claimReceiptSend(order.id);
  if (!claimed) {
    // Another confirm already claimed (or finished) this receipt.
    return true;
  }

  try {
    const sent = await sendOrderReceiptEmail({
      order,
      siteUrl: siteUrlFromRequest(req),
    });
    if (!sent) {
      await clearReceiptSent(order.id);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Receipt email failed.", error);
    await clearReceiptSent(order.id);
    return false;
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

  const order = await findOrderByCheckoutReference(checkoutReference);
  if (!order) {
    return errorJson("Order not found.", 404);
  }

  if (order.status === "paid") {
    const receiptSent = await sendReceiptIfNeeded(order, req);
    return confirmResponse(order, receiptSent);
  }

  if (!order.sumupCheckoutId) {
    return errorJson("This order does not have a SumUp checkout yet.", 409);
  }

  const checkout = await getCheckout(order.sumupCheckoutId);
  if (isCheckoutPaid(checkout)) {
    const paid = await markOrderPaid(order.id);
    if (!paid) {
      return errorJson("Unable to update the order.", 500);
    }

    const receiptSent = await sendReceiptIfNeeded(paid, req);
    return confirmResponse(paid, receiptSent);
  }

  if (isCheckoutFailed(checkout)) {
    await markOrderFailed(order.id);
    return json({
      orderId: order.id,
      status: "failed" as const,
      email: order.email,
      hasDigitalItems: order.items.some((item) => item.kind === "digital"),
      receiptSent: false,
    });
  }

  return confirmResponse(order, Boolean(order.receiptSentAt));
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
