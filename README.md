# The Conversation Project

A Vite + React + TypeScript site prepared for Netlify. The public pages are **Home**, **About**, **Events**, **Shop**, and **Contact**. The site owner can edit copy, testimonials, contact details, and shop products from `/admin` without touching code.

## How content is stored

There are two layers on purpose, so visitors do not wake the database:

1. **Netlify Database (Postgres)** is the source of truth. The admin portal reads and writes here.
2. **Netlify Blobs** holds a published snapshot of the whole site, plus testimonial photos and digital product files.

When someone visits the website, `/api/content` reads only the Blob snapshot (or built-in starter copy if nothing has been published yet). That keeps Netlify Database compute credits for editing, not for every page view. The JSON response is also cached at the CDN for a minute.

Contact messages use **Netlify Forms**, so they also skip the database. Shop products and orders live in the database; the public catalogue is served from `/api/products`.

## Editing the site

From `/admin` the owner can change:

- Site name, tagline, footer, email, phone, address, social links
- Each page’s SEO text and an ordered list of sections
- Section types: optional hero, text, image block, image gallery, and testimonial
- Image uploads (pages and product photos) are resized in the browser (max 2400px edge) and converted to WebP before upload, so phone camera photos work while public loads stay small. The post-compress upload cap is 4MB (Netlify Functions body limit).
- **Products**: add/edit shop items (name, price, digital/physical, publish, multiple digital files and/or external download links). Product saves go straight to the database and do not use **Save and publish**.

**Save and publish** writes page content to the database once, then refreshes the Blob snapshot the public site reads.

The **Events** page intro is editable in admin. The listing itself is loaded from Eventbrite when `/events` opens: `/api/events` caches the response in Netlify Blobs for a few minutes so visitors do not hit Eventbrite (or the database) on every view. If nothing is scheduled, the page says **No upcoming events**. Each card links out to the Eventbrite event page.

## Shop

- Catalogue: `/shop` (localStorage trolley)
- Checkout: SumUp Hosted Checkout via `/api/checkout`
- Physical items (card deck) require a shipping address at checkout; fulfilment is manual
- After payment, `/shop/success` confirms the SumUp checkout and sends a Resend receipt with a link to `/downloads`
- Buyers re-download digital files at `/downloads` by entering the order email
- Upload digital files in **Admin → Products** (PDF/ZIP up to 5MB), or attach external download links for larger files
