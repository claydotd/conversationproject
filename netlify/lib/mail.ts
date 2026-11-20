import { formatPricePounds } from "../../shared/shop";
import { getSiteContactEmail } from "./content";
import type { OrderRecord } from "./orders";
import { getEnv } from "./env";

export function mailConfigured(): boolean {
  return Boolean(getEnv("RESEND_API_KEY") && getEnv("RESEND_FROM_EMAIL"));
}

function resendCredentials(): { apiKey: string; from: string } | null {
  const apiKey = getEnv("RESEND_API_KEY");
  const from = getEnv("RESEND_FROM_EMAIL");
  if (!apiKey || !from) return null;
  return { apiKey, from };
}

function orderItemLines(order: OrderRecord): string {
  return order.items
    .map(
      (item) =>
        `${item.quantity} × ${item.name} — ${formatPricePounds(
          item.unitPriceCents * item.quantity,
          order.currency,
        )}`,
    )
    .join("\n");
}

function shippingBlock(order: OrderRecord): string {
  if (!order.shipping) return "";
  return [
    "",
    "Shipping address:",
    order.shipping.name,
    order.shipping.line1,
    order.shipping.line2,
    `${order.shipping.city} ${order.shipping.postcode}`,
    order.shipping.country,
  ]
    .filter(Boolean)
    .join("\n");
}

function normalizeEmailBody(parts: Array<string | undefined>): string {
  return parts
    .filter((part) => part !== undefined)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

async function sendResendEmail(input: {
  apiKey: string;
  from: string;
  to: string[];
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<void> {
  const body: Record<string, unknown> = {
    from: input.from,
    to: input.to,
    subject: input.subject,
    text: input.text,
  };
  if (input.replyTo) body.reply_to = input.replyTo;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Resend email failed.", response.status, detail);
    throw new Error("Unable to send email via Resend.");
  }
}

export async function sendOrderReceiptEmail(input: {
  order: OrderRecord;
  siteUrl: string;
}): Promise<boolean> {
  const creds = resendCredentials();
  if (!creds) {
    console.warn("Resend is not configured; skipping receipt email.");
    return false;
  }

  const { order, siteUrl } = input;
  const downloadsUrl = `${siteUrl.replace(/\/$/, "")}/downloads`;
  const hasDigital = order.items.some((item) => item.kind === "digital");
  const digitalBlock = hasDigital
    ? `\n\nDigital downloads:\nUse the email address from this order on the downloads page:\n${downloadsUrl}\n`
    : "";

  const text = normalizeEmailBody([
    "Thank you for your order from The Conversation Project.",
    "",
    `Order total: ${formatPricePounds(order.totalCents, order.currency)}`,
    "",
    "Items:",
    orderItemLines(order),
    shippingBlock(order),
    digitalBlock,
    "",
    "If you have any questions, reply to this email, use the contact page on the website, or email helloconvopro@gmail.com.",
  ]);

  await sendResendEmail({
    ...creds,
    to: [order.email],
    subject: "Your Conversation Project order",
    text,
  });
  return true;
}

export async function sendOwnerOrderEmail(input: {
  order: OrderRecord;
  ownerEmail: string;
}): Promise<boolean> {
  const creds = resendCredentials();
  if (!creds) {
    console.warn("Resend is not configured; skipping owner order email.");
    return false;
  }

  const { order, ownerEmail } = input;
  const hasPhysical = order.items.some((item) => item.kind === "physical");
  const hasDigital = order.items.some((item) => item.kind === "digital");
  const kindNote = [
    hasPhysical ? "Includes physical item(s) — fulfil shipping." : null,
    hasDigital ? "Includes digital item(s)." : null,
  ]
    .filter(Boolean)
    .join(" ");

  const text = normalizeEmailBody([
    "New paid order from The Conversation Project shop.",
    "",
    `Customer: ${order.email}`,
    `Order id: ${order.id}`,
    `Checkout reference: ${order.sumupCheckoutReference}`,
    `Total: ${formatPricePounds(order.totalCents, order.currency)}`,
    kindNote ? `\n${kindNote}` : "",
    "",
    "Items:",
    orderItemLines(order),
    shippingBlock(order),
    "",
    "Reply to this email to contact the customer.",
  ]);

  await sendResendEmail({
    ...creds,
    to: [ownerEmail],
    replyTo: order.email,
    subject: `New order — ${formatPricePounds(order.totalCents, order.currency)}`,
    text,
  });
  return true;
}

/**
 * Customer receipt + owner notification to Admin → Site settings contact email.
 * Owner email is required when a contact email is configured.
 */
export async function sendOrderEmails(input: {
  order: OrderRecord;
  siteUrl: string;
}): Promise<boolean> {
  const receiptSent = await sendOrderReceiptEmail(input);
  if (!receiptSent) return false;

  const ownerEmail = await getSiteContactEmail();
  if (!ownerEmail) {
    console.warn(
      "Site contact email is empty; customer receipt sent without owner copy.",
    );
    return true;
  }

  await sendOwnerOrderEmail({ order: input.order, ownerEmail });
  return true;
}
