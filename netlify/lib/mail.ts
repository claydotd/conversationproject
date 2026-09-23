import { formatPricePounds } from "../../shared/shop";
import type { OrderRecord } from "./orders";
import { getEnv } from "./env";

export function mailConfigured(): boolean {
  return Boolean(getEnv("RESEND_API_KEY") && getEnv("RESEND_FROM_EMAIL"));
}

export async function sendOrderReceiptEmail(input: {
  order: OrderRecord;
  siteUrl: string;
}): Promise<boolean> {
  const apiKey = getEnv("RESEND_API_KEY");
  const from = getEnv("RESEND_FROM_EMAIL");
  if (!apiKey || !from) {
    console.warn("Resend is not configured; skipping receipt email.");
    return false;
  }

  const { order, siteUrl } = input;
  const downloadsUrl = `${siteUrl.replace(/\/$/, "")}/downloads`;
  const hasDigital = order.items.some((item) => item.kind === "digital");
  const lines = order.items
    .map(
      (item) =>
        `${item.quantity} × ${item.name} — ${formatPricePounds(
          item.unitPriceCents * item.quantity,
          order.currency,
        )}`,
    )
    .join("\n");

  const shippingBlock = order.shipping
    ? [
        "",
        "Shipping address:",
        order.shipping.name,
        order.shipping.line1,
        order.shipping.line2,
        `${order.shipping.city} ${order.shipping.postcode}`,
        order.shipping.country,
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  const digitalBlock = hasDigital
    ? `\n\nDigital downloads:\nUse the email address from this order on the downloads page:\n${downloadsUrl}\n`
    : "";

  const text = [
    "Thank you for your order from The Conversation Project.",
    "",
    `Order total: ${formatPricePounds(order.totalCents, order.currency)}`,
    "",
    "Items:",
    lines,
    shippingBlock,
    digitalBlock,
    "",
    "If you have any questions, reply to this email, use the contact page on the website, or email helloconvopro@gmail.com.",
  ]
    .filter((part) => part !== undefined)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [order.email],
      subject: "Your Conversation Project order",
      text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Resend email failed.", response.status, detail);
    throw new Error("Unable to send the receipt email.");
  }
  return true;
}
