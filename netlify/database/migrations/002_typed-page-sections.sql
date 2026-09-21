-- Move page heroes and testimonials into ordered, typed sections.
-- Existing sites keep their copy; new section types can be added in admin.

UPDATE pages AS p
SET sections = (
  jsonb_build_array(
    jsonb_build_object(
      'id', p.slug || '-hero',
      'type', 'hero',
      'eyebrow', CASE
        WHEN p.slug = 'home' THEN 'The Conversation Project'
        ELSE p.title
      END,
      'heading', p.hero_heading,
      'subheading', p.hero_subheading
    )
  )
  || COALESCE((
    SELECT jsonb_agg(
      CASE
        WHEN elem.elem ? 'type' THEN elem.elem
        ELSE jsonb_build_object(
          'id', COALESCE(NULLIF(elem.elem->>'id', ''), gen_random_uuid()::text),
          'type', 'text',
          'heading', COALESCE(elem.elem->>'heading', ''),
          'body', COALESCE(elem.elem->>'body', '')
        )
      END
      ORDER BY elem.ordinality
    )
    FROM jsonb_array_elements(p.sections) WITH ORDINALITY AS elem(elem, ordinality)
  ), '[]'::jsonb)
  || COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', t.id,
        'type', 'testimonial',
        'quote', t.quote,
        'authorName', t.author_name,
        'authorRole', t.author_role,
        'imageUrl', t.image_url
      )
      ORDER BY t.sort_order, t.created_at
    )
    FROM testimonials AS t
    WHERE t.page_slug = p.slug
  ), '[]'::jsonb)
)
WHERE NOT EXISTS (
  SELECT 1
  FROM jsonb_array_elements(p.sections) AS e
  WHERE e->>'type' IS NOT NULL
);
