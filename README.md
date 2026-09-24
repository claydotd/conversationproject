# The Conversation Project

A Vite + React + TypeScript site prepared for Netlify. The public pages are **Home**, **About**, **Events**, **Shop**, and **Contact**. The site owner can edit copy, testimonials, contact details, and shop products from `/admin` without touching code.

## How content is stored

There are two layers on purpose, so visitors do not wake the database:

1. **Netlify Database (Postgres)** is the source of truth. The admin portal reads and writes here.
2. **Netlify Blobs** holds a published snapshot of the whole site, plus testimonial photos and digital product files.

When someone visits the website, `/api/content` reads only the Blob snapshot (or built-in starter copy if nothing has been published yet). That keeps Netlify Database compute credits for editing, not for every page view. The JSON response is also cached at the CDN for a minute.

Contact messages use **Netlify Forms**, so they also skip the database. Shop products and orders live in the database; the public catalogue is served from `/api/products`.

## Local development

```bash
cp .env.example .env
npm install
npm run dev
```

Set `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and a long random `ADMIN_SESSION_SECRET` in `.env`, then open:

- Site: `http://localhost:5173`
- Admin: `http://localhost:5173/admin`
- Shop: `http://localhost:5173/shop`

The `@netlify/vite-plugin` emulates Functions, Blobs, and other Netlify primitives inside `npm run dev`. Netlify Database is provisioned automatically when the site is linked and deployed (and typically when using the Netlify CLI locally). Until a database exists, the public site still renders starter copy; the admin save action needs the database.

**Local database migrations are not applied automatically.** With the dev server running, apply them once (or whenever you pull new migration files):

```bash
npm run db:migrate
```

That runs `netlify database migrations apply` against the local Netlify Database and creates tables such as `products` and `orders`.

## Netlify setup

1. Push this repo and create a Netlify site from it (or run `npx netlify init`).
2. Build command: `npm run build`. Publish directory: `dist`. These are already in `netlify.toml`.
3. Enable **Netlify Database** on the site. Migrations in `netlify/database/migrations/` are applied automatically on deploy.
4. In **Site configuration → Environment variables**, set:
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `ADMIN_SESSION_SECRET` (long random string; signing key only)
   - `EVENTBRITE_API_KEY` (private token from Eventbrite → Account Settings → Developer Links → API Keys)
   - `EVENTBRITE_ORGANIZER_ID` (defaults to `114391829571` if omitted)
   - `SUMUP_API_KEY`
   - `SUMUP_MERCHANT_CODE`
   - `SUMUP_PAY_TO_EMAIL` (optional)
   - `RESEND_API_KEY` and `RESEND_FROM_EMAIL` (for order receipt emails)
   - `PUBLIC_SITE_URL` (optional absolute site URL for links in emails)
5. Deploy, then visit `https://your-site.netlify.app/admin`, sign in, and click **Save and publish** once so the public snapshot exists.

Starter copy is already in the first migration, so the pages have real placeholder text and testimonials ready to replace. Shop products are seeded in migration `005_shop-orders.sql`.

## Editing the site

From `/admin` the owner can change:

- Site name, tagline, footer, email, phone, address, social links
- Each page’s SEO text and an ordered list of sections
- Section types: optional hero, text, image block, image gallery, and testimonial
- **Products**: add/edit shop items (name, price, digital/physical, publish, digital file upload). Product saves go straight to the database and do not use **Save and publish**.

**Save and publish** writes page content to the database once, then refreshes the Blob snapshot the public site reads.

The **Events** page intro is editable in admin. The listing itself is loaded from Eventbrite when `/events` opens: `/api/events` caches the response in Netlify Blobs for a few minutes so visitors do not hit Eventbrite (or the database) on every view. If nothing is scheduled, the page says **No upcoming events**. Each card links out to the Eventbrite event page.

## Shop

- Catalogue: `/shop` (localStorage trolley)
- Checkout: SumUp Hosted Checkout via `/api/checkout`
- Physical items (card deck) require a shipping address at checkout; fulfilment is manual
- After payment, `/shop/success` confirms the SumUp checkout and sends a Resend receipt with a link to `/downloads`
- Buyers re-download digital files at `/downloads` by entering the order email
- Upload digital files in **Admin → Products** (PDF/ZIP up to 5MB)
