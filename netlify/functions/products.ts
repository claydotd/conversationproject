import type { Config, Context } from "@netlify/functions";
import { listPublishedProducts } from "../lib/products";
import { errorJson, json } from "../lib/http";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=60, stale-while-revalidate=86400",
  "Netlify-CDN-Cache-Control":
    "public, durable, s-maxage=60, stale-while-revalidate=86400",
};

export default async (req: Request, _context: Context) => {
  if (req.method !== "GET") {
    return errorJson("Method not allowed", 405);
  }

  try {
    const products = await listPublishedProducts();
    // Public catalogue omits download blob keys.
    return json(
      {
        products: products.map((product) => ({
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          priceCents: product.priceCents,
          currency: product.currency,
          kind: product.kind,
          imageUrl: product.imageUrl ?? null,
          inventory: product.inventory,
          published: product.published,
          sortOrder: product.sortOrder,
        })),
      },
      200,
      CACHE_HEADERS,
    );
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Unable to load products.";
    return errorJson(message, 500);
  }
};

export const config: Config = {
  path: "/api/products",
};
