const MAX_EDGE_PX = 2400;
const WEBP_QUALITY = 0.82;
const JPEG_FALLBACK_QUALITY = 0.85;
/** Keep under Netlify Functions' ~4.5MB effective binary body limit. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

function baseName(fileName: string): string {
  const trimmed = fileName.trim() || "image";
  const withoutExt = trimmed.replace(/\.[^.]+$/, "");
  return withoutExt || "image";
}

async function probeWithinBounds(file: File): Promise<boolean> {
  if (typeof createImageBitmap !== "function") {
    return false;
  }
  try {
    const bitmap = await createImageBitmap(file);
    const within = Math.max(bitmap.width, bitmap.height) <= MAX_EDGE_PX;
    bitmap.close();
    return within;
  } catch {
    return false;
  }
}

async function drawToCanvas(file: File): Promise<{
  canvas: HTMLCanvasElement;
  close: () => void;
}> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to process that image in this browser.");
  }

  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    const longest = Math.max(bitmap.width, bitmap.height);
    const scale = longest > MAX_EDGE_PX ? MAX_EDGE_PX / longest : 1;
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return {
      canvas,
      close: () => bitmap.close(),
    };
  }

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to read that image."));
    };
    img.src = url;
  });

  const longest = Math.max(image.naturalWidth, image.naturalHeight);
  const scale = longest > MAX_EDGE_PX ? MAX_EDGE_PX / longest : 1;
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return { canvas, close: () => undefined };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

/**
 * Resize (max 2400px edge) and convert to WebP for admin media uploads.
 * Falls back to JPEG if the browser cannot encode WebP.
 */
export async function compressImageForUpload(
  file: File,
): Promise<{ file: File; originalBytes: number; compressedBytes: number }> {
  const originalBytes = file.size;

  if (
    file.type === "image/webp" &&
    file.size <= MAX_UPLOAD_BYTES &&
    (await probeWithinBounds(file))
  ) {
    return {
      file,
      originalBytes,
      compressedBytes: file.size,
    };
  }

  let drawn: { canvas: HTMLCanvasElement; close: () => void };
  try {
    drawn = await drawToCanvas(file);
  } catch {
    throw new Error(
      "Unable to read that image. Try a JPEG, PNG, WebP, or GIF.",
    );
  }

  try {
    let blob = await canvasToBlob(drawn.canvas, "image/webp", WEBP_QUALITY);
    let mime = "image/webp";
    let ext = "webp";

    // Safari (incl. iOS) cannot encode WebP from canvas; toBlob silently
    // returns a PNG instead of null. A 2400px PNG of a photo often exceeds 4MB
    // even when the original JPEG was under 2MB.
    if (!blob || blob.size === 0 || blob.type !== "image/webp") {
      blob = await canvasToBlob(
        drawn.canvas,
        "image/jpeg",
        JPEG_FALLBACK_QUALITY,
      );
      mime = "image/jpeg";
      ext = "jpg";
    }

    if (!blob || blob.size === 0 || blob.type !== mime) {
      throw new Error("Unable to compress that image.");
    }

    if (blob.size > MAX_UPLOAD_BYTES) {
      // Retry once at a lower JPEG quality for pathological photos.
      if (mime === "image/jpeg") {
        const smaller = await canvasToBlob(drawn.canvas, "image/jpeg", 0.7);
        if (
          smaller &&
          smaller.size > 0 &&
          smaller.type === "image/jpeg" &&
          smaller.size <= MAX_UPLOAD_BYTES
        ) {
          blob = smaller;
        }
      }
    }

    if (!blob || blob.size > MAX_UPLOAD_BYTES) {
      throw new Error(
        "That image is still too large after compression. Try a smaller photo.",
      );
    }

    const prepared = new File([blob], `${baseName(file.name)}.${ext}`, {
      type: mime,
      lastModified: Date.now(),
    });

    return {
      file: prepared,
      originalBytes,
      compressedBytes: prepared.size,
    };
  } finally {
    drawn.close();
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
