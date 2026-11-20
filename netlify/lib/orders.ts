import type {
  OrderStatus,
  ProductKind,
  ShippingAddress,
} from "../../shared/shop";
import { getDb } from "./db";

export interface OrderItemRecord {
  id: string;
  orderId: string;
  productId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  kind: ProductKind;
}

export interface OrderRecord {
  id: string;
  email: string;
  status: OrderStatus;
  currency: string;
  totalCents: number;
  shippingCents: number;
  shipping: ShippingAddress | null;
  sumupCheckoutId: string | null;
  sumupCheckoutReference: string;
  receiptSentAt: string | null;
  items: OrderItemRecord[];
}

interface OrderRow {
  id: string;
  email: string;
  status: OrderStatus;
  currency: string;
  total_cents: number | string;
  shipping_cents: number | string | null;
  shipping_name: string | null;
  shipping_line1: string | null;
  shipping_line2: string | null;
  shipping_city: string | null;
  shipping_postcode: string | null;
  shipping_country: string | null;
  sumup_checkout_id: string | null;
  sumup_checkout_reference: string;
  receipt_sent_at: string | null;
}

interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  name: string;
  unit_price_cents: number | string;
  quantity: number | string;
  kind: ProductKind;
}

function mapShipping(row: OrderRow): ShippingAddress | null {
  if (!row.shipping_name || !row.shipping_line1) return null;
  return {
    name: row.shipping_name,
    line1: row.shipping_line1,
    line2: row.shipping_line2 ?? "",
    city: row.shipping_city ?? "",
    postcode: row.shipping_postcode ?? "",
    country: row.shipping_country ?? "",
  };
}

function mapItem(row: OrderItemRow): OrderItemRecord {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    name: row.name,
    unitPriceCents: Number(row.unit_price_cents),
    quantity: Number(row.quantity),
    kind: row.kind,
  };
}

async function loadItems(orderIds: string[]): Promise<OrderItemRecord[]> {
  if (orderIds.length === 0) return [];
  const db = getDb();
  const rows = await db.sql`
    SELECT id, order_id, product_id, name, unit_price_cents, quantity, kind
    FROM order_items
    WHERE order_id = ANY(${orderIds})
  `;
  return (rows as OrderItemRow[]).map(mapItem);
}

function attachItems(
  row: OrderRow,
  items: OrderItemRecord[],
): OrderRecord {
  return {
    id: row.id,
    email: row.email,
    status: row.status,
    currency: row.currency,
    totalCents: Number(row.total_cents),
    shippingCents: Number(row.shipping_cents) || 0,
    shipping: mapShipping(row),
    sumupCheckoutId: row.sumup_checkout_id,
    sumupCheckoutReference: row.sumup_checkout_reference,
    receiptSentAt: row.receipt_sent_at,
    items: items.filter((item) => item.orderId === row.id),
  };
}

export interface CreateOrderInput {
  email: string;
  currency: string;
  totalCents: number;
  shippingCents: number;
  checkoutReference: string;
  shipping: ShippingAddress | null;
  items: Array<{
    productId: string;
    name: string;
    unitPriceCents: number;
    quantity: number;
    kind: ProductKind;
  }>;
}

export async function createPendingOrder(
  input: CreateOrderInput,
): Promise<OrderRecord> {
  const db = getDb();
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");
    const orderResult = await client.query(
      `INSERT INTO orders (
        email, status, currency, total_cents, shipping_cents,
        shipping_name, shipping_line1, shipping_line2,
        shipping_city, shipping_postcode, shipping_country,
        sumup_checkout_reference
      ) VALUES ($1,'pending',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING id, email, status, currency, total_cents, shipping_cents,
        shipping_name, shipping_line1, shipping_line2,
        shipping_city, shipping_postcode, shipping_country,
        sumup_checkout_id, sumup_checkout_reference, receipt_sent_at`,
      [
        input.email.trim().toLowerCase(),
        input.currency,
        input.totalCents,
        input.shippingCents,
        input.shipping?.name ?? null,
        input.shipping?.line1 ?? null,
        input.shipping?.line2 ?? null,
        input.shipping?.city ?? null,
        input.shipping?.postcode ?? null,
        input.shipping?.country ?? null,
        input.checkoutReference,
      ],
    );
    const orderRow = orderResult.rows[0] as OrderRow;
    for (const item of input.items) {
      await client.query(
        `INSERT INTO order_items (
          order_id, product_id, name, unit_price_cents, quantity, kind
        ) VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          orderRow.id,
          item.productId,
          item.name,
          item.unitPriceCents,
          item.quantity,
          item.kind,
        ],
      );
    }
    await client.query("COMMIT");
    const items = await loadItems([orderRow.id]);
    return attachItems(orderRow, items);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function setOrderCheckoutId(
  orderId: string,
  checkoutId: string,
): Promise<void> {
  const db = getDb();
  await db.sql`
    UPDATE orders
    SET sumup_checkout_id = ${checkoutId}, updated_at = NOW()
    WHERE id = ${orderId}
  `;
}

const ORDER_SELECT = `id, email, status, currency, total_cents, shipping_cents,
  shipping_name, shipping_line1, shipping_line2,
  shipping_city, shipping_postcode, shipping_country,
  sumup_checkout_id, sumup_checkout_reference, receipt_sent_at`;

export async function findOrderByCheckoutReference(
  reference: string,
): Promise<OrderRecord | null> {
  const db = getDb();
  const rows = await db.sql`
    SELECT id, email, status, currency, total_cents, shipping_cents,
           shipping_name, shipping_line1, shipping_line2,
           shipping_city, shipping_postcode, shipping_country,
           sumup_checkout_id, sumup_checkout_reference, receipt_sent_at
    FROM orders
    WHERE sumup_checkout_reference = ${reference}
    LIMIT 1
  `;
  const row = rows[0] as OrderRow | undefined;
  if (!row) return null;
  const items = await loadItems([row.id]);
  return attachItems(row, items);
}

export async function findOrderBySumupCheckoutId(
  sumupCheckoutId: string,
): Promise<OrderRecord | null> {
  const db = getDb();
  const rows = await db.sql`
    SELECT id, email, status, currency, total_cents, shipping_cents,
           shipping_name, shipping_line1, shipping_line2,
           shipping_city, shipping_postcode, shipping_country,
           sumup_checkout_id, sumup_checkout_reference, receipt_sent_at
    FROM orders
    WHERE sumup_checkout_id = ${sumupCheckoutId}
    LIMIT 1
  `;
  const row = rows[0] as OrderRow | undefined;
  if (!row) return null;
  const items = await loadItems([row.id]);
  return attachItems(row, items);
}

export async function markOrderPaid(orderId: string): Promise<OrderRecord | null> {
  const db = getDb();
  const rows = await db.sql`
    UPDATE orders
    SET status = 'paid', updated_at = NOW()
    WHERE id = ${orderId} AND status <> 'paid'
    RETURNING id, email, status, currency, total_cents, shipping_cents,
      shipping_name, shipping_line1, shipping_line2,
      shipping_city, shipping_postcode, shipping_country,
      sumup_checkout_id, sumup_checkout_reference, receipt_sent_at
  `;
  let row = rows[0] as OrderRow | undefined;
  if (!row) {
    const existing = await db.sql`
      SELECT id, email, status, currency, total_cents, shipping_cents,
             shipping_name, shipping_line1, shipping_line2,
             shipping_city, shipping_postcode, shipping_country,
             sumup_checkout_id, sumup_checkout_reference, receipt_sent_at
      FROM orders WHERE id = ${orderId} LIMIT 1
    `;
    row = existing[0] as OrderRow | undefined;
  }
  if (!row) return null;
  const items = await loadItems([row.id]);
  return attachItems(row, items);
}

export async function markOrderFailed(orderId: string): Promise<void> {
  const db = getDb();
  await db.sql`
    UPDATE orders
    SET status = 'failed', updated_at = NOW()
    WHERE id = ${orderId} AND status = 'pending'
  `;
}

/**
 * Serialize receipt sending with a row lock. Sets `receipt_sent_at` only after
 * `send` returns true. Concurrent callers wait on the lock; if the first send
 * fails they can retry. Returns whether the receipt is recorded as sent.
 */
export async function sendReceiptUnderLock(
  orderId: string,
  send: (order: OrderRecord) => Promise<boolean>,
): Promise<boolean> {
  const db = getDb();
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");
    const locked = await client.query(
      `SELECT ${ORDER_SELECT}
       FROM orders
       WHERE id = $1
       FOR UPDATE`,
      [orderId],
    );
    const row = locked.rows[0] as OrderRow | undefined;
    if (!row) {
      await client.query("ROLLBACK");
      return false;
    }
    if (row.receipt_sent_at) {
      await client.query("COMMIT");
      return true;
    }

    const items = await loadItems([row.id]);
    const order = attachItems(row, items);

    let sent = false;
    try {
      sent = await send(order);
    } catch (error) {
      console.error("Receipt email failed.", error);
      sent = false;
    }

    if (sent) {
      await client.query(
        `UPDATE orders
         SET receipt_sent_at = NOW(), updated_at = NOW()
         WHERE id = $1`,
        [orderId],
      );
    }
    await client.query("COMMIT");
    return sent;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listPaidDigitalDownloadsForEmail(
  email: string,
): Promise<
  Array<{
    productId: string;
    name: string;
    downloads: unknown;
    downloadBlobKey: string | null;
  }>
> {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const rows = await db.sql`
    SELECT DISTINCT ON (p.id)
      p.id AS product_id,
      p.name,
      p.downloads,
      p.download_blob_key
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p ON p.id = oi.product_id
    WHERE o.status = 'paid'
      AND lower(o.email) = ${normalized}
      AND oi.kind = 'digital'
      AND (
        jsonb_array_length(COALESCE(p.downloads, '[]'::jsonb)) > 0
        OR (p.download_blob_key IS NOT NULL AND p.download_blob_key <> '')
      )
    ORDER BY p.id, o.created_at DESC
  `;
  return (
    rows as Array<{
      product_id: string;
      name: string;
      downloads: unknown;
      download_blob_key: string | null;
    }>
  ).map((row) => ({
    productId: row.product_id,
    name: row.name,
    downloads: row.downloads,
    downloadBlobKey: row.download_blob_key,
  }));
}

export async function emailOwnsPaidDigitalProduct(
  email: string,
  productId: string,
): Promise<boolean> {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const rows = await db.sql`
    SELECT 1
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.status = 'paid'
      AND lower(o.email) = ${normalized}
      AND oi.product_id = ${productId}
      AND oi.kind = 'digital'
    LIMIT 1
  `;
  return rows.length > 0;
}
