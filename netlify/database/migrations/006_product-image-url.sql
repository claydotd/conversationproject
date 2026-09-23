-- Product catalogue images for the public shop.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS image_url TEXT;
