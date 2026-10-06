import { useState, type ReactNode } from "react";
import { uploadAdminImage } from "../lib/api";
import { formatBytes } from "../lib/compressImage";

export function formatUploadSizeNote(
  originalBytes: number,
  compressedBytes: number,
): string {
  if (originalBytes === compressedBytes) {
    return `Uploaded size: ${formatBytes(compressedBytes)}`;
  }
  return `Original ${formatBytes(originalBytes)} → compressed ${formatBytes(compressedBytes)}`;
}

type AdminImageFileInputProps = {
  label: string;
  onUploaded: (url: string, sizeNote: string) => void;
  clearInputAfterSelect?: boolean;
  /** When set, shown with the upload size note under the file control. */
  previewUrl?: string;
  /** Extra size note to show with the preview (e.g. from a prior add). */
  sizeNote?: string | null;
  /** Custom preview (e.g. gallery fit frame). Falls back to a plain wide image. */
  renderPreview?: (url: string) => ReactNode;
};

export function AdminImageFileInput({
  label,
  onUploaded,
  clearInputAfterSelect = false,
  previewUrl,
  sizeNote: sizeNoteProp = null,
  renderPreview,
}: AdminImageFileInputProps) {
  const [busy, setBusy] = useState(false);
  const [localSizeNote, setLocalSizeNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sizeNote = localSizeNote ?? sizeNoteProp;

  async function handleChange(file: File | undefined, input: HTMLInputElement) {
    if (!file) return;
    setBusy(true);
    setError(null);
    setLocalSizeNote(null);
    try {
      const result = await uploadAdminImage(file);
      const note = formatUploadSizeNote(
        result.originalBytes,
        result.compressedBytes,
      );
      onUploaded(result.url, note);
      if (clearInputAfterSelect) {
        input.value = "";
        setLocalSizeNote(null);
      } else {
        setLocalSizeNote(note);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack admin-image-upload">
      <label>
        {label}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={busy}
          onChange={(event) => {
            const input = event.target;
            void handleChange(input.files?.[0], input);
          }}
        />
      </label>
      {busy ? (
        <p className="muted field-hint">Compressing and uploading…</p>
      ) : null}
      {previewUrl ? (
        renderPreview ? (
          renderPreview(previewUrl)
        ) : (
          <img
            className="preview-image preview-image--wide"
            src={previewUrl}
            alt=""
          />
        )
      ) : null}
      {!busy && sizeNote ? <p className="muted field-hint">{sizeNote}</p> : null}
      {error ? (
        <p className="muted field-hint" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
