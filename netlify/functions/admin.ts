import type { Config, Context } from "@netlify/functions";
import type { ProductKind } from "../../shared/shop";
import { slugifyProductName } from "../../shared/shop";
import type { SiteContent } from "../../shared/types";
import { PAGE_SLUGS } from "../../shared/types";
import {
  clearSessionCookie,
  createSessionCookie,
  isAuthenticated,
  passwordConfigured,
  passwordMatches,
  usernameMatches,
} from "../lib/auth";
import {
  mediaKey,
  mediaStore,
  productFilesStore,
  publicMediaPath,
} from "../lib/blobs";
import { loadContentFromDatabase, saveContentToDatabase } from "../lib/content";
import { errorJson, json } from "../lib/http";
import {
  createProduct,
  listAllProducts,
  updateProduct,
} from "../lib/products";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_PRODUCT_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const ALLOWED_PRODUCT_TYPES = new Set([
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/epub+zip",
  "text/plain",
  "image/jpeg",
  "image/png",
]);
const PRODUCT_KINDS = new Set<ProductKind>(["digital", "physical"]);

function unauthorized() {
  return errorJson("Sign in required.", 401);
}

function requireAuth(req: Request) {
  return isAuthenticated(req);
}

async function handleLogin(req: Request) {
  if (!passwordConfigured()) {
    return errorJson(
      "Set ADMIN_USERNAME, ADMIN_PASSWORD, and ADMIN_SESSION_SECRET in the Netlify environment before using the admin portal.",
      503,
    );
  }

  const body = (await req.json()) as {
    username?: string;
    password?: string;
  };
  if (
    !body.username ||
    !body.password ||
    !usernameMatches(body.username) ||
    !passwordMatches(body.password)
  ) {
    return errorJson("That username or password is not correct.", 401);
  }

  return json(
    { ok: true },
    200,
    { "Set-Cookie": createSessionCookie(req) },
  );
}

async function handleLogout(req: Request) {
  return json({ ok: true }, 200, { "Set-Cookie": clearSessionCookie(req) });
}

async function handleSession(req: Request) {
  return json({
    authenticated: isAuthenticated(req),
    passwordConfigured: passwordConfigured(),
  });
}

async function handleGetContent() {
  const content = await loadContentFromDatabase();
  return json(content);
}

function isSiteContent(value: unknown): value is SiteContent {
  if (!value || typeof value !== "object") return false;
  const candidate = value as SiteContent;
  return (
    Boolean(candidate.site) &&
    Boolean(candidate.pages) &&
    PAGE_SLUGS.every((slug) => candidate.pages?.[slug])
  );
}

async function handleSaveContent(req: Request) {
  const body = (await req.json()) as unknown;
  if (!isSiteContent(body)) {
    return errorJson("The content payload is missing required page data.");
  }
  const saved = await saveContentToDatabase(body);
  return json(saved);
}

async function handleUpload(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return errorJson("Choose an image to upload.");
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return errorJson("Please upload a JPEG, PNG, WebP, or GIF image.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return errorJson("Images need to be 4MB or smaller.");
  }

  const key = mediaKey(file.name);
  const store = mediaStore();
  await store.set(key, await file.arrayBuffer());
  return json({ key, url: publicMediaPath(key) });
}

function parseProductBody(body: Record<string, unknown>) {
  const name = String(body.name ?? "").trim();
  const description = String(body.description ?? "").trim();
  const slugRaw = String(body.slug ?? "").trim();
  const slug = slugRaw || slugifyProductName(name);
  const kind = String(body.kind ?? "") as ProductKind;
  const priceCents = Math.round(Number(body.priceCents));
  const published = Boolean(body.published);
  const sortOrder = Math.floor(Number(body.sortOrder ?? 0));
  const inventoryRaw = body.inventory;
  const inventory =
    inventoryRaw === null ||
    inventoryRaw === undefined ||
    inventoryRaw === ""
      ? null
      : Math.floor(Number(inventoryRaw));
  const downloadBlobKeyRaw = body.downloadBlobKey;
  const downloadBlobKey =
    downloadBlobKeyRaw === null ||
    downloadBlobKeyRaw === undefined ||
    downloadBlobKeyRaw === ""
      ? null
      : String(downloadBlobKeyRaw);
  const imageUrlRaw = body.imageUrl;
  const imageUrl =
    imageUrlRaw === null ||
    imageUrlRaw === undefined ||
    imageUrlRaw === ""
      ? null
      : String(imageUrlRaw);

  if (!name) return { error: "Product name is required." };
  if (!PRODUCT_KINDS.has(kind)) {
    return { error: "Kind must be digital or physical." };
  }
  if (!Number.isFinite(priceCents) || priceCents < 0) {
    return { error: "Price must be a valid amount in pence." };
  }
  if (inventory !== null && (!Number.isFinite(inventory) || inventory < 0)) {
    return { error: "Inventory must be empty or a non-negative number." };
  }

  return {
    input: {
      name,
      slug,
      description,
      priceCents,
      currency: "GBP",
      kind,
      published,
      inventory,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      imageUrl,
      downloadBlobKey: kind === "digital" ? downloadBlobKey : null,
    },
  };
}

async function handleListProducts() {
  const products = await listAllProducts();
  return json({ products });
}

async function handleCreateProduct(req: Request) {
  const body = (await req.json()) as Record<string, unknown>;
  const parsed = parseProductBody(body);
  if ("error" in parsed && parsed.error) {
    return errorJson(parsed.error);
  }
  if (!parsed.input) return errorJson("Invalid product payload.");
  try {
    const product = await createProduct(parsed.input);
    return json({ product }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.toLowerCase().includes("unique")) {
      return errorJson("That slug is already in use.", 409);
    }
    throw error;
  }
}

async function handleUpdateProduct(req: Request, id: string) {
  const body = (await req.json()) as Record<string, unknown>;
  const parsed = parseProductBody(body);
  if ("error" in parsed && parsed.error) {
    return errorJson(parsed.error);
  }
  if (!parsed.input) return errorJson("Invalid product payload.");
  try {
    const product = await updateProduct(id, parsed.input);
    if (!product) return errorJson("Product not found.", 404);
    return json({ product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.toLowerCase().includes("unique")) {
      return errorJson("That slug is already in use.", 409);
    }
    throw error;
  }
}

async function handleProductFileUpload(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return errorJson("Choose a file to upload.");
  }
  if (!ALLOWED_PRODUCT_TYPES.has(file.type) && !file.name.match(/\.(pdf|zip|epub|txt|png|jpe?g)$/i)) {
    return errorJson("Upload a PDF, ZIP, EPUB, text, or image file.");
  }
  if (file.size > MAX_PRODUCT_FILE_BYTES) {
    return errorJson("Product files need to be 5MB or smaller.");
  }

  const key = mediaKey(file.name);
  const store = productFilesStore();
  await store.set(key, await file.arrayBuffer());
  return json({ key });
}

export default async (req: Request, _context: Context) => {
  const { pathname } = new URL(req.url);

  try {
    if (pathname === "/api/admin/login" && req.method === "POST") {
      return await handleLogin(req);
    }
    if (pathname === "/api/admin/logout" && req.method === "POST") {
      return await handleLogout(req);
    }
    if (pathname === "/api/admin/session" && req.method === "GET") {
      return await handleSession(req);
    }

    if (!requireAuth(req)) {
      return unauthorized();
    }

    if (pathname === "/api/admin/content" && req.method === "GET") {
      return await handleGetContent();
    }
    if (pathname === "/api/admin/content" && req.method === "PUT") {
      return await handleSaveContent(req);
    }
    if (pathname === "/api/admin/media" && req.method === "POST") {
      return await handleUpload(req);
    }
    if (pathname === "/api/admin/products" && req.method === "GET") {
      return await handleListProducts();
    }
    if (pathname === "/api/admin/products" && req.method === "POST") {
      return await handleCreateProduct(req);
    }
    if (pathname.startsWith("/api/admin/products/") && req.method === "PUT") {
      const id = decodeURIComponent(
        pathname.replace("/api/admin/products/", ""),
      );
      if (!id) return errorJson("Missing product id.");
      return await handleUpdateProduct(req, id);
    }
    if (pathname === "/api/admin/product-files" && req.method === "POST") {
      return await handleProductFileUpload(req);
    }

    return errorJson("Not found", 404);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";
    console.error(error);
    return errorJson(message, 500);
  }
};

export const config: Config = {
  path: ["/api/admin/*"],
};
