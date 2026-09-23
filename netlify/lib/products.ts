import type { Product, ProductKind } from "../../shared/shop";
import { getDb } from "./db";

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_cents: number | string;
  currency: string;
  kind: ProductKind;
  download_blob_key: string | null;
  inventory: number | string | null;
  published: boolean;
  sort_order: number | string;
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    priceCents: Number(row.price_cents),
    currency: row.currency || "GBP",
    kind: row.kind,
    downloadBlobKey: row.download_blob_key,
    inventory:
      row.inventory === null || row.inventory === undefined
        ? null
        : Number(row.inventory),
    published: Boolean(row.published),
    sortOrder: Number(row.sort_order) || 0,
  };
}

export async function listPublishedProducts(): Promise<Product[]> {
  const db = getDb();
  const rows = await db.sql`
    SELECT id, name, slug, description, price_cents, currency, kind,
           download_blob_key, inventory, published, sort_order
    FROM products
    WHERE published = TRUE
    ORDER BY sort_order ASC, name ASC
  `;
  return (rows as ProductRow[]).map(mapProduct);
}

export async function listAllProducts(): Promise<Product[]> {
  const db = getDb();
  const rows = await db.sql`
    SELECT id, name, slug, description, price_cents, currency, kind,
           download_blob_key, inventory, published, sort_order
    FROM products
    ORDER BY sort_order ASC, name ASC
  `;
  return (rows as ProductRow[]).map(mapProduct);
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  const db = getDb();
  const rows = await db.sql`
    SELECT id, name, slug, description, price_cents, currency, kind,
           download_blob_key, inventory, published, sort_order
    FROM products
    WHERE id = ANY(${ids})
  `;
  return (rows as ProductRow[]).map(mapProduct);
}

export interface ProductWriteInput {
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  currency?: string;
  kind: ProductKind;
  published: boolean;
  inventory?: number | null;
  sortOrder?: number;
  downloadBlobKey?: string | null;
}

export async function createProduct(input: ProductWriteInput): Promise<Product> {
  const db = getDb();
  const rows = await db.sql`
    INSERT INTO products (
      name, slug, description, price_cents, currency, kind,
      published, inventory, sort_order, download_blob_key
    ) VALUES (
      ${input.name},
      ${input.slug},
      ${input.description},
      ${input.priceCents},
      ${input.currency ?? "GBP"},
      ${input.kind},
      ${input.published},
      ${input.inventory ?? null},
      ${input.sortOrder ?? 0},
      ${input.downloadBlobKey ?? null}
    )
    RETURNING id, name, slug, description, price_cents, currency, kind,
              download_blob_key, inventory, published, sort_order
  `;
  return mapProduct(rows[0] as ProductRow);
}

export async function updateProduct(
  id: string,
  input: ProductWriteInput,
): Promise<Product | null> {
  const db = getDb();
  const rows = await db.sql`
    UPDATE products SET
      name = ${input.name},
      slug = ${input.slug},
      description = ${input.description},
      price_cents = ${input.priceCents},
      currency = ${input.currency ?? "GBP"},
      kind = ${input.kind},
      published = ${input.published},
      inventory = ${input.inventory ?? null},
      sort_order = ${input.sortOrder ?? 0},
      download_blob_key = ${input.downloadBlobKey ?? null},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, name, slug, description, price_cents, currency, kind,
              download_blob_key, inventory, published, sort_order
  `;
  const row = rows[0] as ProductRow | undefined;
  return row ? mapProduct(row) : null;
}
