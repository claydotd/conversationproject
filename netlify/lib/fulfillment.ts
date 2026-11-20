import { sendOrderEmails } from "./mail";
import {
  findOrderBySumupCheckoutId,
  markOrderFailed,
  markOrderPaid,
  sendReceiptUnderLock,
  type OrderRecord,
} from "./orders";
import {
  getCheckout,
  isCheckoutFailed,
  isCheckoutPaid,
} from "./sumup";

export interface FulfillmentResult {
  order: OrderRecord;
  receiptSent: boolean;
}

/**
 * Verify SumUp status for an order, mark paid/failed, and send order emails.
 * Safe to call from the success-page confirm and the SumUp webhook.
 */
export async function fulfillOrderFromSumup(
  order: OrderRecord,
  siteUrl: string,
): Promise<FulfillmentResult> {
  if (order.status === "paid") {
    const receiptSent = await sendReceiptUnderLock(order.id, (locked) =>
      sendOrderEmails({ order: locked, siteUrl }),
    );
    return { order, receiptSent };
  }

  if (order.status === "failed") {
    return { order, receiptSent: false };
  }

  if (!order.sumupCheckoutId) {
    return { order, receiptSent: false };
  }

  const checkout = await getCheckout(order.sumupCheckoutId);

  if (isCheckoutPaid(checkout)) {
    const paid = await markOrderPaid(order.id);
    if (!paid) {
      throw new Error("Unable to update the order.");
    }
    const receiptSent = await sendReceiptUnderLock(paid.id, (locked) =>
      sendOrderEmails({ order: locked, siteUrl }),
    );
    return { order: paid, receiptSent };
  }

  if (isCheckoutFailed(checkout)) {
    await markOrderFailed(order.id);
    return {
      order: { ...order, status: "failed" },
      receiptSent: false,
    };
  }

  return { order, receiptSent: Boolean(order.receiptSentAt) };
}

/** Fulfill by SumUp checkout id (webhook payload). */
export async function fulfillCheckoutBySumupId(
  sumupCheckoutId: string,
  siteUrl: string,
): Promise<FulfillmentResult | null> {
  const order = await findOrderBySumupCheckoutId(sumupCheckoutId);
  if (!order) return null;
  return fulfillOrderFromSumup(order, siteUrl);
}
