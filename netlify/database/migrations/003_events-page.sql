INSERT INTO pages (
  slug, title, hero_heading, hero_subheading, sections, seo_title, seo_description
)
VALUES (
  'events',
  'Events',
  'Come and sit in a room with us.',
  'Upcoming gatherings from The Conversation Project. Booking and full details live on Eventbrite.',
  '[
    {
      "id": "events-hero",
      "type": "hero",
      "background": "default",
      "eyebrow": "Events",
      "heading": "Come and sit in a room with us.",
      "subheading": "Upcoming gatherings from The Conversation Project. Booking and full details live on Eventbrite."
    },
    {
      "id": "events-intro",
      "type": "text",
      "background": "default",
      "heading": "What to expect",
      "body": "These are relaxed, structured conversations — not networking, not a lecture. A few prompts, a room of people willing to talk, and enough time to say the thing that usually stays unsaid.\n\nChoose an upcoming date below, or look back at past events. Each card takes you to Eventbrite for tickets and the practical details."
    }
  ]'::jsonb,
  'Events — The Conversation Project',
  'See upcoming Conversation Project events and book via Eventbrite.'
)
ON CONFLICT (slug) DO NOTHING;
