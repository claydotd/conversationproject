import type { Config, Context } from "@netlify/functions";
import { productFilesStore } from "../lib/blobs";
import {
  createDownloadToken,
  publicDownloadPath,
  verifyDownloadToken,
} from "../lib/downloads";
import { errorJson, json } from "../lib/http";
import {
  emailOwnsPaidDigitalProduct,
  listPaidDigitalDownloadsForEmail,
} from "../lib/orders";
import { getProductsByIds } from "../lib/products";

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  zip: "application/zip",
  epub: "application/epub+zip",
  txt: "text/plain",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function handleListDownloads(req: Request) {
  const body = (await req.json()) as { email?: string };
  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  if (!isValidEmail(email)) {
    return errorJson("Enter the email address used on your order.");
  }

  const downloads = await listPaidDigitalDownloadsForEmail(email);
  return json({
    email,
    items: downloads.map((item) => ({
      productId: item.productId,
      name: item.name,
      downloadUrl: publicDownloadPath(
        createDownloadToken({ email, productId: item.productId }),
      ),
    })),
  });
}

async function handleFileDownload(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  const verified = verifyDownloadToken(token);
  if (!verified) {
    return errorJson("This download link has expired. Request a new one.", 401);
  }

  const owns = await emailOwnsPaidDigitalProduct(
    verified.email,
    verified.productId,
  );
  if (!owns) {
    return errorJson("No paid download found for this email.", 403);
  }

  const [product] = await getProductsByIds([verified.productId]);
  if (!product?.downloadBlobKey) {
    return errorJson("This download is not available yet.", 404);
  }

  const store = productFilesStore();
  const file = await store.get(product.downloadBlobKey, {
    type: "arrayBuffer",
  });
  if (!file) {
    return errorJson("File not found.", 404);
  }

  const extension =
    product.downloadBlobKey.split(".").pop()?.toLowerCase() ?? "";
  const contentType = MIME[extension] ?? "application/octet-stream";
  const safeName =
    product.slug.replace(/[^a-z0-9-_]/gi, "-") || "download";

  return new Response(file, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${safeName}.${extension || "bin"}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

export default async (req: Request, _context: Context) => {
  const { pathname } = new URL(req.url);
  try {
    if (pathname === "/api/downloads" && req.method === "POST") {
      return await handleListDownloads(req);
    }
    if (
      (pathname === "/api/downloads/file" ||
        pathname.startsWith("/api/downloads/file")) &&
      req.method === "GET"
    ) {
      return await handleFileDownload(req);
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
  path: ["/api/downloads", "/api/downloads/*"],
};
