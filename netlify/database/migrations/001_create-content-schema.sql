CREATE TABLE site_settings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  footer_text TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL DEFAULT '',
  contact_address TEXT NOT NULL DEFAULT '',
  social JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pages (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  hero_heading TEXT NOT NULL,
  hero_subheading TEXT NOT NULL,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  seo_title TEXT NOT NULL,
  seo_description TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE testimonials (
  id UUID PRIMARY KEY,
  page_slug TEXT NOT NULL REFERENCES pages(slug) ON DELETE CASCADE,
  quote TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX testimonials_page_slug_idx ON testimonials (page_slug, sort_order);

-- Ready for the SumUp shop: digital downloads and physical products.
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  kind TEXT NOT NULL CHECK (kind IN ('digital', 'physical')),
  sumup_checkout_id TEXT,
  download_blob_key TEXT,
  inventory INTEGER,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cache Eventbrite payloads so listings do not hit the API (or this database) on every page view.
CREATE TABLE events_cache (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO site_settings (
  id, name, tagline, footer_text, contact_email, contact_phone, contact_address, social
) VALUES (
  'default',
  'The Conversation Project',
  'Facilitation, coaching, and rooms where people tell the truth kindly.',
  'Conversations worth having.',
  'hello@example.com',
  '',
  '',
  '[]'::jsonb
);

INSERT INTO pages (
  slug, title, hero_heading, hero_subheading, sections, seo_title, seo_description
) VALUES
(
  'home',
  'Home',
  'Conversations that change how people work together.',
  'We help teams and leaders speak with more clarity, honesty, and care — so the important work can actually move.',
  '[
    {
      "id": "home-practice",
      "heading": "A practice, not a script",
      "body": "Most workplaces are full of meetings and short on meaning. We design spaces where people can say the thing that has been sitting unspoken, then leave with a shared next step.\n\nWhether you are gathering a leadership team, a community, or a room of strangers, the work is the same: listen well, name what is true, and keep the conversation human."
    },
    {
      "id": "home-work-with-us",
      "heading": "Ways we work",
      "body": "Facilitation for offsites and difficult decisions. Coaching for leaders who want a more honest room. Workshops that give teams a shared language for feedback, conflict, and care.\n\nEvery engagement is tailored. Tell us what is stuck, and we will help you find the conversation that unlocks it."
    }
  ]'::jsonb,
  'The Conversation Project',
  'Facilitation, coaching, and workshops that help people have the conversations that matter.'
),
(
  'about',
  'About',
  'Built around the belief that talk is real work.',
  'The Conversation Project exists to make ambitious, kind, useful dialogue ordinary — in rooms where it is usually rare.',
  '[
    {
      "id": "about-story",
      "heading": "Why this exists",
      "body": "We started this work after sitting in too many rooms where the real conversation happened in the corridor afterwards. The project is a response to that: slower on purpose, structured enough to feel safe, and honest enough to be useful.\n\nOur background sits at the meeting point of facilitation, coaching, and organisational development. We are less interested in performance and more interested in what becomes possible when people tell the truth kindly."
    },
    {
      "id": "about-approach",
      "heading": "How we show up",
      "body": "We prepare carefully, hold the room firmly, and leave people with language they can keep using without us. You will not get a slide deck of values. You will get a way of speaking that can survive Monday morning."
    }
  ]'::jsonb,
  'About — The Conversation Project',
  'Learn about The Conversation Project, our approach to facilitation, and the people behind the work.'
),
(
  'contact',
  'Contact',
  'Tell us about the conversation you need.',
  'Share a little context and we will come back with availability, an outline, and a clear next step.',
  '[
    {
      "id": "contact-note",
      "heading": "What to include",
      "body": "A few sentences is enough: who would be in the room, what you are hoping will be different afterwards, and any dates you already have in mind. If you are not sure yet, that is useful information too."
    }
  ]'::jsonb,
  'Contact — The Conversation Project',
  'Get in touch with The Conversation Project about facilitation, coaching, or a workshop for your team.'
);

INSERT INTO testimonials (
  id, page_slug, quote, author_name, author_role, image_url, sort_order
) VALUES
(
  '00000000-0000-4000-8000-000000000001',
  'home',
  'They held a conversation our board had been circling for two years. We left with a decision, and with relationships that were stronger than when we arrived.',
  'Priya N.',
  'Chair, cultural organisation',
  '',
  0
),
(
  '00000000-0000-4000-8000-000000000002',
  'home',
  'It did not feel like corporate training. It felt like being taken seriously. The team still uses the phrases we found in that room.',
  'James Okafor',
  'Head of Product',
  '',
  1
),
(
  '00000000-0000-4000-8000-000000000003',
  'about',
  'Rare to find facilitators who can be both gentle and exacting. Nothing was fluffy, and nobody was made small.',
  'Dr. Helen Marsh',
  'Clinical lead',
  '',
  0
),
(
  '00000000-0000-4000-8000-000000000004',
  'contact',
  'From the first reply to the day itself, the process was calm, clear, and human. Booking them was the easiest decision we made all year.',
  'Samir Patel',
  'Operations director',
  '',
  0
);
