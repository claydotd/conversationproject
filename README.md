# The Conversation Project

A Vite + React + TypeScript site prepared for Netlify. The public pages are **Home**, **About**, **Events**, and **Contact**. The site owner can edit copy, testimonials, and contact details from `/admin` without touching code.

## How content is stored

There are two layers on purpose, so visitors do not wake the database:

1. **Netlify Database (Postgres)** is the source of truth. The admin portal reads and writes here.
2. **Netlify Blobs** holds a published snapshot of the whole site, plus testimonial photos.

When someone visits the website, `/api/content` reads only the Blob snapshot (or built-in starter copy if nothing has been published yet). That keeps Netlify Database compute credits for editing, not for every page view. The JSON response is also cached at the CDN for a minute.

Contact messages use **Netlify Forms**, so they also skip the database.

## Local development

```bash
cp .env.example .env
npm install
npm run dev
```

Set `ADMIN_PASSWORD` and a long random `ADMIN_SESSION_SECRET` in `.env`, then open:

- Site: `http://localhost:5173`
- Admin: `http://localhost:5173/admin`

The `@netlify/vite-plugin` emulates Functions, Blobs, and other Netlify primitives inside `npm run dev`. Netlify Database is provisioned automatically when the site is linked and deployed (and typically when using the Netlify CLI locally). Until a database exists, the public site still renders starter copy; the admin save action needs the database.

## Netlify setup

1. Push this repo and create a Netlify site from it (or run `npx netlify init`).
2. Build command: `npm run build`. Publish directory: `dist`. These are already in `netlify.toml`.
3. Enable **Netlify Database** on the site. Migrations in `netlify/database/migrations/` are applied automatically on deploy.
4. In **Site configuration → Environment variables**, set:
   - `ADMIN_PASSWORD`
   - `ADMIN_SESSION_SECRET` (long random string)
   - `EVENTBRITE_API_KEY` (private token from Eventbrite → Account Settings → Developer Links → API Keys)
   - `EVENTBRITE_ORGANIZER_ID` (defaults to `114391829571` if omitted)
5. Deploy, then visit `https://your-site.netlify.app/admin`, sign in, and click **Save and publish** once so the public snapshot exists.

Starter copy is already in the first migration, so the pages have real placeholder text and testimonials ready to replace.

## Editing the site

From `/admin` the owner can change:

- Site name, tagline, footer, email, phone, address, social links
- Each page’s SEO text and an ordered list of sections
- Section types: optional hero, text, image block, image gallery, and testimonial

**Save and publish** writes the database once, then refreshes the Blob snapshot the public site reads.

The **Events** page intro is editable in admin. The listing itself is loaded from Eventbrite when `/events` opens: `/api/events` caches the response in Netlify Blobs for a few minutes so visitors do not hit Eventbrite (or the database) on every view. Upcoming events are shown first; there is a Past toggle. If nothing is scheduled, the page says **No upcoming events**. Each card links out to the Eventbrite event page.

## Later: shop

The project is shaped so a shop can be added without re-platforming:

- **SumUp shop** — product table is already in the first migration (`products`, with `digital` and `physical` kinds). Types live in `shared/shop.ts`. Env vars to add later: `SUMUP_API_KEY`, `SUMUP_MERCHANT_CODE`, `SUMUP_PAY_TO_EMAIL`.

Suggested route when you add it: `/shop`.
