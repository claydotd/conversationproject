ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS newsletter_heading TEXT NOT NULL DEFAULT 'Stay in the loop',
  ADD COLUMN IF NOT EXISTS newsletter_paragraph TEXT NOT NULL DEFAULT 'Sign up with your email address to receive news and updates on upcoming workshops.',
  ADD COLUMN IF NOT EXISTS newsletter_consent_label TEXT NOT NULL DEFAULT 'I consent to receiving news and updates by email.';

INSERT INTO pages (
  slug, title, hero_heading, hero_subheading, sections, seo_title, seo_description
)
VALUES (
  'terms',
  'Terms and conditions',
  'Terms and conditions',
  'How this site works, and how we use your details if you get in touch or sign up.',
  '[
    {
      "id": "terms-hero",
      "type": "hero",
      "background": "default",
      "eyebrow": "Legal",
      "heading": "Terms and conditions",
      "subheading": "How this site works, and how we use your details if you get in touch or sign up."
    },
    {
      "id": "terms-using-the-site",
      "type": "text",
      "background": "default",
      "heading": "Using this website",
      "body": "This website is provided by The Conversation Project to share our work and make it easy to get in touch. Please use it in good faith. Do not attempt to disrupt the site, misuse forms, or copy content without permission.\n\nEvent listings may link out to Eventbrite or other third-party pages. Those services have their own terms, and we are not responsible for their content or booking processes."
    },
    {
      "id": "terms-newsletter",
      "type": "text",
      "background": "default",
      "heading": "Newsletter and contact details",
      "body": "If you sign up to the newsletter, we use your first name, last name, and email address to send news and updates about upcoming workshops and related work. The consent checkbox is required: we will not add you unless you agree.\n\nYou can unsubscribe at any time using the link in our emails, or by contacting us. If you write to us through the contact form, we will use the details you send only to reply and to follow up on your enquiry.\n\nWe do not sell your personal details."
    },
    {
      "id": "terms-changes",
      "type": "text",
      "background": "default",
      "heading": "Changes",
      "body": "We may update these terms as the site or our work changes. The latest version will always appear on this page. If you have questions, please contact us."
    }
  ]'::jsonb,
  'Terms and conditions — The Conversation Project',
  'Terms for using The Conversation Project website, including newsletter signup and contact details.'
)
ON CONFLICT (slug) DO NOTHING;
