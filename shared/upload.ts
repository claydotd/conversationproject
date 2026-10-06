/** Encode a File/Blob as base64 for JSON upload bodies (Netlify local FormData is unreliable). */
export async function fileToBase64(file: Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, offset + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export type UploadedFilePayload = {
  filename: string;
  contentType: string;
  data: string;
};

export function decodeUploadedFilePayload(payload: UploadedFilePayload): File {
  const binary = atob(payload.data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], payload.filename, {
    type: payload.contentType || "application/octet-stream",
  });
}

export function isUploadedFilePayload(
  value: unknown,
): value is UploadedFilePayload {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.filename === "string" &&
    candidate.filename.length > 0 &&
    typeof candidate.contentType === "string" &&
    typeof candidate.data === "string" &&
    candidate.data.length > 0
  );
}
