-- Multiple digital downloads per product: hosted blobs and/or external URLs.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS downloads JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Move any existing single blob key into the downloads array.
UPDATE products
SET downloads = jsonb_build_array(
  jsonb_build_object(
    'id', gen_random_uuid()::text,
    'label', 'Download',
    'source', 'blob',
    'blobKey', download_blob_key
  )
)
WHERE download_blob_key IS NOT NULL
  AND download_blob_key <> ''
  AND jsonb_array_length(downloads) = 0;
