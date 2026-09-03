# CarValue

A used-car deal-finder for the NZ market. It crawls dealer inventory
nationwide and lets you search/filter/sort listings by what actually
matters when buying a car — not just asking price, but the full estimated
**3-year cost of ownership** (finance, fuel/electricity, servicing,
insurance, repairs, registration & WOF).

Every result carries a visible disclaimer: these are estimates built from
published NZ reference rates and bracket assumptions (by body type,
powertrain, age), not professional valuations or financial advice.

## Features

- **Search & filter** dealer listings by body type, powertrain, make,
  model, transmission, region, price range, mileage, and year
- **3-year ownership cost estimate** per listing — finance interest, fuel/
  electricity + road user charges (adjusted for engine size where known),
  servicing, insurance, repairs, and registration/WOF — with an itemized,
  expandable breakdown, a distribution chart comparing it against similar
  listings, and an adjustable 1–5 year horizon slider
- **Sort** by total cost, asking price, or mileage, with real pagination
- **Real listing photos**, scraped per-dealer, falling back to a stock
  make/model/year photo when unavailable
- Mileage-bracket average pricing (low/medium/high km) computed from the
  current search's own results
- **Accounts** — sign up/log in, a **watchlist** to save listings, and a
  **Settings** page for theme and saved ownership-cost defaults
  (annual km, finance on/off, deposit) that pre-fill future searches;
  logged-out visitors get the same defaults via a cookie
- **Pre-search home page** teasers: a "recent price drops" list and a
  "popular searches" quick-link box (currently a static seed list — see
  `search_log` below), plus a headline count of vehicles/dealers searched
- Every real search is logged to a `search_log` table (skipped for admin
  accounts) for a future data-driven popular-searches query
- **Feedback button** for any visitor, with an admin-only inbox and
  unread-count badge in the nav

See [PLAN.md](./PLAN.md) for the full design rationale and build phases.

## Tech stack

- **Next.js** (App Router) + React + TypeScript
- **Postgres** via [Neon](https://neon.tech), queried with
  [Drizzle ORM](https://orm.drizzle.team)
- **Tailwind CSS**, charts via [Recharts](https://recharts.org)
- DB-backed sessions (opaque token cookie, no JWT) with `bcryptjs` password
  hashing — no third-party auth provider
- A custom crawler (Cheerio-based, no headless browser) with a
  per-platform adapter for each dealer-site template (Motorcentral,
  AdTorque Edge, CarUpdater, Turners, 2 Cheap Cars, Armstrong's)

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up the database

Copy the env template and fill in a real Neon connection string:

```bash
cp .env.example .env.local
```

```
DATABASE_URL=postgres://user:password@ep-xxxx.region.aws.neon.tech/dbname?sslmode=require
```

An optional `DATABASE_URL_UNPOOLED` (the non-`-pooler` direct connection
string) can also be set — migrations prefer it when present, but fall back
to `DATABASE_URL` otherwise, so one variable is enough to get started.

Then run migrations and seed the static taxonomy (body types/powertrains)
and dealer list:

```bash
npm run db:migrate
npm run db:seed
npm run db:seed:dealers
```

### 3. Crawl some listings

```bash
npm run crawl
```

This fetches every active dealer's current inventory and upserts it into
the database (safe to re-run — it updates existing listings and marks
missing ones as delisted rather than duplicating anything).

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm run start` | Production build/serve |
| `npm run lint` | Lint |
| `npm run db:generate` | Generate a Drizzle migration from schema changes |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:seed` | Seed the body-type/powertrain taxonomy |
| `npm run db:seed:dealers` | Seed the list of dealers to crawl |
| `npm run crawl` | Crawl all active dealers |
| `npm run crawl:backfill-body-type` | Re-check body type for listings that came back unclassified on first crawl |
| `npm run crawl:backfill-make-casing` | Normalize inconsistent make casing on existing listings |
| `npm run crawl:backfill-industry-motors-images` | Backfill images for Industry Motors listings scraped before image support was added |

## Scheduled crawling

[.github/workflows/crawl.yml](./.github/workflows/crawl.yml) runs `npm run
crawl` daily via GitHub Actions (free — public repos get unlimited minutes,
private repos 2,000/month, and a daily crawl here takes a couple of
minutes). To enable it, add a `DATABASE_URL` repository secret (Settings →
Secrets and variables → Actions) with your pooled Neon connection string.
You can also trigger it manually from the Actions tab.

## Deployment

[render.yaml](./render.yaml) deploys the web app to [Render](https://render.com)'s
free tier. It intentionally does **not** include the crawler — Render's
cron job type has no free tier — hence the GitHub Actions workflow above
instead.

## License

MIT — see [LICENSE](./LICENSE).
