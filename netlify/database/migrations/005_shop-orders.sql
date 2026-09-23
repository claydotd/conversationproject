-- Shop: sort order on products, seed catalogue, orders for SumUp checkout.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed')),
  currency TEXT NOT NULL DEFAULT 'GBP',
  total_cents INTEGER NOT NULL,
  shipping_name TEXT,
  shipping_line1 TEXT,
  shipping_line2 TEXT,
  shipping_city TEXT,
  shipping_postcode TEXT,
  shipping_country TEXT,
  sumup_checkout_id TEXT,
  sumup_checkout_reference TEXT NOT NULL UNIQUE,
  receipt_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS orders_email_idx ON orders (lower(email));
CREATE INDEX IF NOT EXISTS orders_sumup_checkout_id_idx ON orders (sumup_checkout_id);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  name TEXT NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  kind TEXT NOT NULL CHECK (kind IN ('digital', 'physical'))
);

CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items (order_id);

INSERT INTO products (
  name, slug, description, price_cents, currency, kind, published, sort_order
)
VALUES
  (
    'A Little Space for Big Conversations about Ending & Beginning - Digital Download',
    'ending-beginning-digital',
    'Digital download: conversation prompts about ending and beginning.',
    500,
    'GBP',
    'digital',
    TRUE,
    1
  ),
  (
    'A Little Space for Big Conversations - Digital Download 24 Conversation Prompts',
    'conversation-prompts-digital',
    'Digital download: 24 conversation prompts.',
    500,
    'GBP',
    'digital',
    TRUE,
    2
  ),
  (
    'A Little Space for Big Conversations about Mental Health - Digital Download 24 Prompts',
    'mental-health-digital',
    'Digital download: 24 prompts about mental health.',
    500,
    'GBP',
    'digital',
    TRUE,
    3
  ),
  (
    'A Little Space for Big Conversations about Friendship - Digital Download 24 Prompts',
    'friendship-digital',
    'Digital download: 24 prompts about friendship.',
    500,
    'GBP',
    'digital',
    TRUE,
    4
  ),
  (
    'The Conversation Project Card Deck (75 cards)',
    'card-deck',
    'Physical card deck with 75 conversation cards. Shipping address required at checkout.',
    1500,
    'GBP',
    'physical',
    TRUE,
    5
  )
ON CONFLICT (slug) DO NOTHING;
