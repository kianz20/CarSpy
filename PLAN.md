# CarValue — Project Plan

## 0. Revision note

This plan pivoted from its original design. **v1 design:** paste a specific listing, get a fair-value/overpayment verdict, sourced from a large live-scraped database spanning TradeMe, Facebook Marketplace, and dealer sites. **Why it changed:** TradeMe locked its Developer API to in-trade sellers only from April 2026 and explicitly excludes "buyer-side tools" and "price monitoring" as a use case (see §3a); their Terms & Conditions and robots.txt also block scraping as a workaround. Facebook Marketplace remained technically scrapeable but only via a login-gated session with real ToS/ban exposure (see §3b) — usable, but not something to build the whole product's foundation on.

**v2 design (current):** a **deal-finder**, not a single-listing evaluator. The user gives loose or specific criteria ("a good hybrid," "I want a ute," "2018 Toyota Corolla under $15k") and the tool searches **dealer/yard inventories** (the one source that's actually open to scraping), scores every matching listing with the same fair-value + 3-year-ownership-cost model as before, and returns a ranked list of the best deals. TradeMe/Facebook listings can still be added into the comparison manually — pasted in by the user — just not scraped automatically.

**Scale & risk posture (decided):** this is a **personal project, eventually shared with friends and family** — not a public or commercial product. Non-commercial, small/known user base. This is the assumption underpinning every legal risk call made in §3/§3a/§3b/§3c — if the scope ever grows beyond friends and family (public launch, monetization, resale), those risk calls need to be revisited, especially TradeMe's ToS which specifically targets commercial resale.

## 1. What we're building

A hosted web app for the **NZ used-car market**. The user describes what they want — a specific model, or a loose category ("hybrid," "ute," "reliable family car under $20k") — and the tool searches dealer inventories for matching listings and returns a **ranked list of the best deals**, each with:

- **Fair value** — a market-derived estimate of what that car is actually worth
- **Asking price** — as listed by the dealer
- **Estimated overpayment/underpayment** — the gap between the two
- **Expected 3-year ownership cost** — finance + insurance + servicing + fuel + expected repairs, projected forward

This is the thing normal car-buying sites don't do: they let you filter by spec, but never tell you which result is actually the *best deal*, and never show total cost of ownership.

A secondary feature: a user can paste in a **specific listing** (including a TradeMe or Facebook Marketplace one, entered manually) to get the same fair-value/ownership-cost breakdown on it directly — useful once they've found a candidate through the deal-finder or elsewhere.

**Disclaimer (product requirement, not just legal boilerplate):** every result — deal-finder rankings and single-listing evaluations alike — carries a visible disclaimer that fair-value and ownership-cost figures are estimates, not professional valuations or financial advice, with confidence explicitly shown per result (see §7's confidence-scoring item). This is the agreed mitigation for model inaccuracy, in place of a formal backtesting/validation program — friends/family users are expected to treat outputs as a strong starting estimate, not a guarantee.

## 2. Inputs the valuation model uses

**Search criteria (new — drives the deal-finder)**
- Specific: make/model/year range, or
- Loose/categorical: body type (ute, SUV, hatch...), powertrain (hybrid, EV, diesel...), or a rough intent ("reliable family car")
- Budget range, mileage cap, transmission preference, region

**Vehicle (per listing)**
- Year, make/model, engine, transmission, mileage, condition
- WOF/rego status
- Import history (NZ-new vs. Japanese/UK import) — captured and **displayed as a badge/bonus indicator only**; not factored numerically into the fair-value/depreciation model for v1 (decided: not worth the modeling complexity right now)

**Market**
- Comparable active dealer listings (same/similar make, model, year, spec)
- Historical prices observed across our own accumulated dealer-site crawl
- Depreciation curve for that make/model/segment

**Financial (for 3-year ownership cost)**
- Finance cost (loan amount, term, live NZ interest rates)
- Insurance (comprehensive quote estimate by value/age/driver profile bracket)
- Servicing (by make/model service schedule + NZ labour rates)
- Fuel (mileage × real-world consumption × current NZ fuel price)
- Expected repairs (reliability-adjusted, by make/model/age/mileage bracket)

**Asking-price handling:** dealer prices aren't always apples-to-apples (some bundle warranty or finance-package costs into the headline price). **Decided:** when a listing explicitly itemizes an add-on cost (e.g. "includes 12-month warranty, $XXX value"), parse and use that breakdown; when it doesn't, treat the headline asking price as-is rather than trying to estimate hidden bundling. Opportunistic, not a hard requirement.

## 3. Data sources & sourcing strategy

| Source | Method | Role | Risk/reliability |
|---|---|---|---|
| **Used-car dealer/yard sites** | Scraping public listing pages (no login wall) | **Primary, automated backbone** — this is now the main source the deal-finder searches | Low-moderate risk — check robots.txt per site, scrape politely (rate-limited, cached). Caveat: dealer asking prices skew above true private-sale market value — factor that into the fair-value model, don't treat dealer price as ground truth |
| **TradeMe Motors** | Manual paste-in only — no automated ingestion | Supplementary — lets a user include a specific TradeMe listing they found in a one-off evaluation | See §3a — automated access is closed to this use case |
| **Facebook Marketplace** | Manual paste-in only for now; automated scraping deferred to a later phase if ever pursued | Supplementary | See §3b |
| **Depreciation/historical pricing** | Derived from our own accumulated dealer-site data over time (price observed per make/model/year over time), supplemented by NZTA/import data if available | Core input to fair-value model | Builds up as the crawler runs longer — early on, depreciation curves will be rougher; may need to bootstrap from published industry depreciation reports initially |
| **Finance rates** | Scrape/pull published rates from NZ banks/finance companies (ANZ, Westpac, Motor Trade Finance, etc.) | Ownership-cost model | Public rate-card data, low risk |
| **Insurance estimates** | Attempt live quote scraping from NZ insurers with public online quote flows (AA Insurance, Cove, State, etc.) where feasible; fall back to formula-based bracket estimates (value/age/region) where a live quote flow isn't scrapable | Ownership-cost model | Insurer quote forms often require personal details (DOB, address) to quote — likely only partially automatable; document this limitation early |
| **Fuel prices** | NZ fuel price APIs/scrapers (e.g. MBIE weekly fuel price data, or regional price-comparison sites) | Ownership-cost model | Low risk, public data |
| **Reliability/repair cost data** | Aggregate from owner forums, reliability survey data, and our own accumulated listing notes (e.g. "high mileage variant known for X") | Ownership-cost model | Fuzziest input — treat as a bracket/heuristic modifier, not precise |

### 3a. TradeMe — research findings (why it's no longer an automated source)

TradeMe's own developer documentation confirms a real, dated policy change, not a rumor:
- **From 10 April 2026**, new production API registrations for Marketplace access are restricted to **in-trade sellers listing their own inventory**. Per their help docs: *"The service will not respond to requests for personal or non-commercial use (including casual selling, price monitoring, or buyer-side tools)."* A deal-finder is explicitly named as unsupported.
- Their Terms & Conditions independently prohibit reselling, resupplying, or combining their data with other sources — a rule that applies regardless of how the data was collected, so scraping isn't a clean workaround either.
- Their robots.txt disallows crawling most listing/search pages directly.
- **Likely reason (inference, not stated):** TradeMe bought 51% of AutoGrab NZ, a vehicle-valuation company, and integrated it with their own MotorWeb platform to sell valuations to dealers/insurers/financiers — they now own a commercial product in the same category as this project.
- **Sanctioned alternative:** licensing through AutoGrab/MotorWeb as a paid B2B product — worth a pricing inquiry someday, but not assumed viable at this stage.
- **Decision:** TradeMe is manual-paste-in only for now. Don't revisit automated ingestion unless a licensing deal materializes.

### 3b. Facebook Marketplace — research findings

**Official Meta API — ruled out.** The Content Library API (`facebook/marketplace-listings/preview`) requires ICPSR/CASD academic vetting, runs inside a controlled research cleanroom with no bulk export, and is built for academic research, not commercial products. Confirmed dead end.

**Reference scraper reviewed** — [`the-data-circle/facebook-marketplace-webscraping`](https://github.com/the-data-circle/facebook-marketplace-webscraping), a tutorial repo (Selenium/Splinter + BeautifulSoup, no login handling, no anti-detection, brittle atomic-CSS-class selectors). Validates the general technique but isn't reusable code.

**Broader landscape research:**
- Commercial scraper APIs exist and are cheap — Bright Data has a dedicated Marketplace scraper (~$0.75/1K requests) and a pre-built dataset; Apify has several community scrapers including one vehicle-specific one, at $0.45–$1.50/1,000 listings.
- **Legal precedent:** *Meta v. Bright Data* (2024) found logged-*out* scraping of public Facebook data doesn't breach ToS — Meta dropped the suit. But Marketplace now effectively requires login to browse, which reopens ToS/contract exposure (the theory that sank *hiQ v. LinkedIn* on remand even after hiQ won the CFAA question). Meta's actual enforcement pattern has been technical (bans, rate-limits) rather than litigation against small players.
- **Current DIY best practice:** extract the embedded JSON payload in the page's `<script>` tags rather than parsing CSS classes or calling GraphQL directly — more stable release-to-release.
- **Decision:** not worth building now. Manual paste-in only for v1. If FB coverage becomes valuable later, a commercial scraper (e.g. Apify's vehicle scraper, ~$1/1K listings) is the pragmatic option over an in-house scraper — offloads login/anti-detection maintenance for a low per-listing cost.

### 3c. Dealer site research — 90 sites catalogued, and a key architecture finding

Full research written to [`research/dealer-sites.md`](research/dealer-sites.md). Headline finding: **most small-to-mid NZ dealer sites are not bespoke — they run on a handful of shared white-label DMS/website platforms.** Confirmed by fetching live site footers:

| Platform | Confirmed dealers (sample) | Notes |
|---|---|---|
| **Motorcentral** (Christchurch-based, NZ-only DMS) | ~28+ independents, incl. AJ Motors (10 branches), GVI, Trust Motors, Team Hutchinson All Makes, and many more | **Highest-value target.** Explicitly designed to push the same inventory data to TradeMe/AutoTrader/Need A Car/DealerBase — implies a clean, consistent underlying data model. One adapter likely covers 25-40+ dealers, probably more not yet identified. |
| **AdTorque Edge** (AU/NZ agency, ~700 dealerships across AU/NZ/Asia) | NZ Cheap Cars, Andrew Simms | Has a reported TradeMe data-sharing partnership — check ToS carefully before scraping any site on this platform. |
| **CarUpdater** (NZ-owned, via webdesign.co.nz) | Blackwells, Macaulay Motors, Southern Lakes Motors, Fagan Motors, and others | Smaller footprint, same "exports to TradeMe/AutoTrader" pattern as Motorcentral — worthwhile third adapter. |

**Bespoke/in-house (worth individual scrapers given their scale):** Turners (fully open robots.txt, `Allow: /`), 2 Cheap Cars (search/transaction paths disallowed, but a dedicated `sitemap-inventory.xml` signals listing pages are meant to be crawled), Armstrong's Motor Group (~30+ dealerships). *(Colonial Motor Company was on this list at research time but turned out not to belong here at all — see Phase 3's CMC note: its corporate site has no inventory of its own, and its dealerships run on platforms already covered above, not a bespoke system.)*

**This changes the scraping strategy from "80-100 bespoke scrapers" to roughly 3-4 platform adapters + a handful of dedicated scrapers for the big chains**, plus a lightweight fingerprinter (check each candidate dealer homepage for known platform footer/asset signatures) to auto-bucket the long tail of remaining independents instead of hand-building each one.

**Important correction — robots.txt is per-dealer, not per-platform.** A follow-up check of robots.txt across 7 sample sites spanning all three platforms found policy varies dealer-by-dealer even on the same platform: e.g. NZ Cheap Cars (AdTorque Edge) blocks `/stock` for all generic crawlers while Andrew Simms (also AdTorque Edge) is fully open; Macaulay Motors (CarUpdater) blocks the entire site (`Disallow: /`) except for a named allowlist of major search/AI crawlers, while Blackwells (also CarUpdater) is fully open. **The platform adapter saves parsing-code effort, not legal clearance** — every individual dealer site still needs its own robots.txt check before crawling, and the crawler pipeline needs a standing per-site robots.txt check (with a skip/flag for disallowed sites) rather than a one-time platform-level decision. Full findings in [`research/dealer-sites.md`](research/dealer-sites.md) §2a.

**Coverage target (decided): NZ-wide**, not regional-first — Phase 3 should aim to bring in dealers across all regions rather than starting with one city and expanding.

**Legal/ethical guardrails baked into the plan:**
- Dealer sites: respect robots.txt, identify with a real user agent, rate-limit requests, cache aggressively so we don't hammer any one site.
- **Sites that disallow generic crawlers (e.g. Macaulay Motors) are skipped by the automated crawler entirely** — no User-Agent spoofing to bypass an explicit exclusion. If a specific dealer's listings are valuable enough to chase, the fallback is manual paste-in (robots.txt governs bots, not a human browsing and pasting details) or asking the dealer directly for permission/a data feed.
- **No proactive opt-out list.** Decided: don't pre-emptively exclude or seek consent from every dealer site before crawling it (impractical at this scale for a friends/family project). **Reactive takedown policy:** if a dealer contacts us objecting to being crawled, remove them from the crawl targets promptly. This should be a quick manual process (a config-level exclusion list the crawler respects), not something requiring an engineering sprint to action.
- TradeMe/Facebook: no automated scraping in v1 — manual paste-in only, and never redistribute/resell any data.
- Store only what's needed for the valuation model (price, spec, mileage, date) — not seller personal info.

## 4. Tech stack

- **Language:** TypeScript across the whole project (one language, one skillset)
- **Web app:** Next.js (frontend + API routes)
- **Database:** Postgres (listings, historical price snapshots, vehicle spec/category taxonomy)
- **Background jobs:** Node-based scheduled crawlers (cron-triggered) that populate the DB continuously from dealer sites — the web app queries the DB, it never scrapes live on request
- **Scraping:** Playwright (headless browser) for JS-heavy dealer sites; simple HTTP + HTML parsing for static ones
- **Hosting:** TBD in setup phase (e.g. Vercel for the app + a small VPS or Railway/Render worker for the always-on crawler, Postgres via a managed provider like Neon/Supabase)

## 5. Architecture overview

```
┌──────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│  Dealer-site       │──▶│   Postgres DB     │◀──│   Web app (UI)      │
│  crawlers/jobs     │   │ listings, price   │   │ Next.js frontend    │
│  (Playwright,      │   │ history, vehicle  │   │ + API routes:       │
│  rate scrapers,    │   │ category taxonomy,│   │  search/match engine│
│  fuel/finance       │   │ finance/fuel/     │   │  + valuation engine │
│  scrapers)          │   │ insurance refs    │   └───────────────────┘
└──────────────────┘     └──────────────────┘
```

Deal-finder flow when a user submits search criteria:
1. Parse criteria (specific make/model, or a loose category/intent mapped via the vehicle taxonomy) + budget/mileage/region constraints
2. Query DB for all matching **active** dealer listings (see §5a freshness policy)
3. For each match, run the fair-value model (comparables + depreciation curve) → **fair value** and **overpayment/underpayment**
4. Run the ownership-cost model (finance/insurance/servicing/fuel/repairs) over 3 years for each match → **3-year ownership cost**
5. Rank matches by best overall deal (a composite of underpayment + low ownership cost, weighted) and return the ranked list, each with a visible disclaimer + confidence indicator

Single-listing evaluation flow (secondary feature, manual entry):
1. User pastes in vehicle details (including from a TradeMe/FB listing, entered manually)
2. Same fair-value + ownership-cost pipeline as above, run on that one vehicle
3. Return the breakdown with disclaimer + confidence indicator

### 5a. Listing lifecycle & dedup (recommendation, since asked)

**Freshness/delisting:** crawl each dealer source once every 24 hours. If a previously-seen listing isn't found on the next crawl, don't remove it immediately (transient site hiccups happen) — mark it "unconfirmed" and only mark it "delisted/sold" after **2 consecutive missed crawls** (~48 hours). Delisted listings drop out of deal-finder results but their price history is kept permanently — that history is exactly what feeds the depreciation-curve model over time, so nothing gets deleted, it just stops being "active."

**Cross-site/relist dedup:** the same car can appear on multiple dealer sites, or get relisted after failing to sell. Dedup approach: use VIN when a listing exposes one (rare but some do); when it doesn't, fall back to a fuzzy match on (make, model, year, mileage within a small tolerance, region, price within a small tolerance) to flag likely-duplicate listings across sources. Treat a fuzzy match as "probably the same car" for display purposes (show once, note it's listed at multiple dealers) rather than silently discarding — false-positive dedup is worse than showing an occasional duplicate.

## 6. Build phases (full build, no MVP-first shortcut — per your steer)

**Phase 1 — Foundations** ✅ done
- Next.js + TypeScript + Tailwind app scaffolded; Drizzle ORM + Neon Postgres connected and migrated (`dealers`, `listings`, `listing_price_history`, `vehicle_categories` tables live)
- Neon CLI linked to the project (`.neon`), `npm run db:generate`/`db:migrate`/`db:studio`/`db:seed` wired up
- Hosting/deploy pipeline still TBD (see §7 open items) — local dev only so far

**Phase 2 — Vehicle category taxonomy** ✅ done
- **Decided: structured dropdowns, not free-text/synonym parsing.** A "find me a good hybrid" text box would need to resolve ambiguity (synonyms, typos, intent); a Body Type / Powertrain dropdown has none — the user picks a value directly, same as every other car search UI. Subjective quality words ("reliable," "good") were never going to be modelled as filters anyway — those are ranking signals for Phase 5, not search criteria.
- `vehicle_categories` table holds the canonical body-type/powertrain values + display labels that populate the dropdowns (seeded via `npm run db:seed`, see `src/lib/taxonomy/data.ts`) — single source of truth instead of hardcoded frontend option lists.
- `src/lib/search/listings.ts` provides the structured-filter query (body type, powertrain, make, model, transmission, region, price range, max mileage) against `listings` + `dealers`, ready for Phase 6 to call once Phase 3 has real data to query.
- Make/model dropdown values aren't seeded here — they'll be derived from distinct values in the scraped `listings` data once Phase 3 exists, not from static taxonomy.

**Phase 3 — Dealer/yard site ingestion (primary source)** 🚧 in progress

Done:
- `src/lib/crawler/robots.ts` — **per-dealer robots.txt check as a standing pipeline step**, run before every crawl (fails closed on fetch errors, open only on a genuinely missing robots.txt)
- `src/lib/crawler/fingerprint.ts` — **platform fingerprinter** for the three known platform signatures (Motorcentral, AdTorque Edge, CarUpdater)
- `src/lib/crawler/adapters/motorcentral.ts` — **Motorcentral adapter**, built and verified against a real site (AJ Motors), not guessed. Turned out to be server-rendered ASP.NET WebForms HTML with static CSS classes — plain HTTP + cheerio is enough, no headless browser needed for this platform. Cost/politeness design: the listing page alone gives price/mileage/transmission/powertrain; body type only exists on the detail page, so the detail page is only fetched once per listing (on first sighting), not on every re-crawl, since body type never changes for a given car.
- `src/lib/crawler/normalize.ts` — shared text→canonical-value mapping (title→year/make/model/variant with a multi-word-make list, price, mileage, transmission, powertrain, body type)
- `src/lib/crawler/ingest.ts` — the §5a freshness/delisting/price-history logic: new listings get an initial price-history row, price changes get a new row (unchanged prices don't), and listings missing from a crawl go `active` → `unconfirmed` → `delisted` over 2 consecutive misses rather than disappearing immediately
- `src/crawler/run.ts` — orchestrator (`npm run crawl`): iterates active dealers, robots-checks each one, runs the matching adapter, ingests results
- End-to-end verified against live AJ Motors data (`npm run db:seed:dealers` seeds AJ Motors + GVI + Blackwells): confirmed correct field extraction, correct create/update behavior, no duplicate price-history rows on unchanged prices, and `bodyType` persisting across re-crawls without re-fetching. One real parsing bug was caught and fixed during this: the mileage figure's thousands-separator comma (`"80,678km"`) was corrupting a naive comma-split of the specs line, shifting every field after it by one.
  - **A second Motorcentral dealer (Team Hutchinson All Makes, found via the Colonial Motor Company investigation below) returned 0 listings despite a 200 response** — different template tier, same platform: its card wrapper is `<div class="cell vehicle ...">`, not AJ Motors' `<li class="vehicle featured">`, so the `li.vehicle` selector silently matched nothing. Generalized to a bare `.vehicle` class selector (safe — CSS class matching is exact-token, so it doesn't also match `.vehicle-inner`/`.vehicle-specs`), and removed a redundant `hasNextPage` helper that duplicated the same stale selector in a second place — the exact kind of drift that caused this bug, now structurally impossible. Also found the specs line isn't always comma-separated (this dealer uses spaces: `"120,466km Automatic Petrol 1986cc"`) and that body-type detail pages aren't all built the same way (this dealer embeds a schema.org JSON-LD `bodyType` field; AJ Motors has no JSON-LD at all) — both adapters now try the richer source first and fall back to the original approach, rather than switching wholesale and silently breaking the dealer that worked before.
  - This prompted extracting `classifySpecLine` into `normalize.ts` — a shared "classify each token by pattern, not position" helper, since the exact same class of bug (assuming a fixed field order/delimiter) had already been hit once on 2 Cheap Cars. One shared, well-tested implementation now closes off that whole failure mode instead of relying on each adapter to reinvent it correctly.
- `src/lib/crawler/adapters/carupdater.ts` — **CarUpdater adapter**, built and verified against a real site (Blackwells). Turned out to be a client-side-rendered shell, unlike Motorcentral's server-rendered HTML — but rather than reaching for a headless browser, used Playwright once, interactively, to capture network traffic and find the actual data source: a plain `POST /PUApi/vehicle/getlist` endpoint returning an HTML fragment inside a JSON envelope. Once found, the adapter itself is just a POST + cheerio-on-the-fragment, same cost profile as Motorcentral (no per-request browser overhead). Same detail-page-only-on-first-sighting design for body type + fuel type.
  - Two more real bugs caught by testing against live data, not assumptions: (1) CarUpdater's title format puts the year *last* ("Chevrolet Silverado 1500 Ltz 2021"), opposite of Motorcentral's year-first — generalized `parseVehicleTitle` in `normalize.ts` to detect either position instead of assuming one; (2) discounted listings' `data-price` attribute embeds raw markup (`"<span>Now $31,990</span> <span>Was $33,990</span>"`), and naively stripping non-digit characters concatenated both prices into garbage (`3199033990`) — fixed `parsePrice` to prefer the first `$`-prefixed amount instead of blindly stripping the whole string.
  - Also confirmed a real (not buggy) data-completeness limit: some listings simply don't have a "Body" row in their spec table at all — the adapter correctly returns `undefined` rather than guessing, and the dropdown filter will just not match that listing on body type, which is the correct behavior.

- `src/lib/crawler/adapters/adtorqueedge.ts` — **AdTorque Edge adapter**, built and verified against a real site (Andrew Simms). Richest data source of the three platforms: year/make/model/variant/price/mileage/fuel type/body type/**VIN** are all directly on the listing card — no title-string parsing needed at all — and there's no pagination to loop, since `/stock/list-all?condition=Used` returns the dealer's entire used inventory (415 listings, in this case) in one response. Only transmission is missing from the card; the detail page carries a clean schema.org `Car` JSON-LD block with everything, including transmission, fetched only on first sighting per the same cost/politeness pattern as the other two adapters.
  - Checked the ToS concern flagged when this platform was first identified (§3c): Andrew Simms has no Terms of Use page at all, only a privacy policy covering personal customer data (finance applications, warranty) — nothing about scraping or reuse of the published vehicle listings. Combined with the open robots.txt, treated as clear to proceed, same bar as the other confirmed-open dealers.
  - Verified against the **entire live inventory**, not a sample — this surfaced a real normalization bug that a small sample wouldn't have: 35 of 415 listings (8.4%) had their transmission come back blank. Investigated by fetching all 415 detail pages' raw `vehicleTransmission` values directly rather than guessing, which found the field is never actually absent — 16 listings say `"CVT"` / `"0-step CVT"` (a type of automatic transmission, but doesn't contain the substring "auto") and 19 say `"hybrid drivetrain"` (describes the powertrain, not the transmission, but every hybrid sold new in NZ is automatic/CVT — no manual-transmission hybrids exist in the NZ used market). Fixed `normalizeTransmission` to handle both cases explicitly, with the reasoning documented inline since the "hybrid drivetrain" case is an inference, not a literal reading.
  - Added a `vin` field to `NormalizedListing` and wired it through `ingest.ts` (previously defined on the `listings` schema per §5a's dedup design but never actually populated by any adapter) — AdTorque Edge is the first source that reliably exposes it (413/415 had one).

- `src/lib/crawler/adapters/turners.ts` — **Turners adapter** (NZ's largest used-car chain), built and verified against the real, full live inventory (2,783 listings), not a sample. Richest data source of all four adapters: every card carries full schema.org `Car` microdata (make, model, year, body type, fuel type, odometer, and a price `content` attribute clean of any discount-text formatting) — no detail-page fetch needed at all, for any listing.
  - **Pagination was genuinely broken via the obvious approach and worth documenting**: the page's own `?pagesize=&pageno=` query-string parameters looked plausible (the URL bar shows them, other adapters' equivalents worked) but don't drive real pagination at all — the page's pagination links render as `href="#"`, and the static GET returns the same first page byte-for-byte regardless of the query string. This was caught by testing, not assumed to work from how the URL looked. Found the real mechanism the same way as CarUpdater: captured network traffic with Playwright while clicking a page link, revealing `POST /Client/car/SearchList`, which needs an ASP.NET Core anti-forgery double-submit cookie (read the `XSRF-TOKEN` cookie from an initial GET, echo it back as an `X-XSRF-TOKEN` header on the POST). `pagesize: 120` works correctly through this real endpoint (unlike the dead query-string version), cutting the crawl to ~24 requests.
  - **Verifying against the full inventory (not a sample) caught a real, initially-alarming discrepancy**: the first full run returned 2,176 listings against an API-reported total of 2,783 — a 607-listing gap. Rather than assume a bug, traced it by checking for cross-page duplicate IDs (found none) and then surveying which required fields were missing on the dropped cards, which isolated it to `price` specifically and matched Turners' `block-type-live-auction`/`block-type-online-auction` CSS classes exactly. Conclusion: this isn't a bug — Turners sells via auction as well as fixed price, and an auction listing with no disclosed starting bid has no stated asking price to compare fair value against, so it's correctly out of scope for this product regardless of how well the scraper works.

- `src/lib/crawler/adapters/twocheapcars.ts` — **2 Cheap Cars adapter**, built and verified against the full live inventory (640/640 listings, near-zero missing fields). Structurally different from every other adapter: their robots.txt disallows the interactive search UI (`/home/search`, `/s/`) but explicitly maintains a dedicated `/sitemap-inventory.xml` — a direct signal that detail pages are meant to be crawled, just not via the search form — so this adapter reads that sitemap for URLs instead of a listing/search page.
  - Each detail page embeds a `const carSchema = {...}` object with everything needed (VIN, make, model, year, body type, transmission, fuel type, odometer, price) — but it's a JS object literal with single-quoted strings, not valid JSON (it's only turned into real JSON-LD at runtime by client-side JS that `JSON.stringify`s it into the DOM, which a plain HTTP fetch never sees). Deliberately did not `eval`/`Function()` this to parse it — running arbitrary code lifted from a third-party page's source is a real supply-chain risk not worth taking even for a currently-trusted site — each field is pulled out with its own targeted regex instead.
  - Cost tradeoff worth noting: because there's no cheap listing/index page available (search UI is off-limits), every one of the ~640 listings needs a fresh detail-page fetch on every crawl, unlike the other adapters' "detail page only for new listings" pattern. The sitemap's `<lastmod>` per URL could support skipping unchanged listings later, once something tracks a last-fetched timestamp per listing — noted as a future optimization, not built now.

- `src/lib/crawler/adapters/armstrongs.ts` — **Armstrong's Motor Group adapter**, initially investigated as blocked (see below for what that dead end looked like), then unblocked by the user finding `/content/json/vehicles.json` — a public, unauthenticated ~17MB raw DMS export of the group's entire inventory (818 used, priced listings), no WAF, no widget, one plain GET. Not disallowed by robots.txt, and a `sitemap-vehicles.xml` is published alongside it — both signal this feed is meant to be fetched, same reasoning as 2 Cheap Cars' sitemap. Verified against the full dataset: zero duplicates, VIN on 783/818, and after one fix (below), transmission on 816/818.
  - **What made it look blocked initially, for the record:** their rendered pages (`/our-vehicles/`, individual dealership pages) carry no vehicle data at all in static HTML — everything defers to a third-party widget on a CNAME-cloaked subdomain (`fbtugtrz.armstrongs.co.nz`, resolving to CloudFront) that itself returns empty to a plain fetch, and rendering it with a headless browser got an outright 403 from their WAF before the page even loaded, while the identical URL succeeded via plain `curl`. That's active bot detection targeting browser automation specifically — a real barrier, not an oversight — and per our own guardrails (no evasion of an explicit block) that path was correctly abandoned rather than fought. The JSON export is a completely separate, unguarded surface the WAF apparently doesn't cover.
  - **Bonus find:** one record's `@LISTING_CIN_URL` field points at `dataapi.autoplay.co.nz` — the same "AutoPlay" product behind the AdTorque Edge adapter. Armstrong's runs on the same underlying platform as Andrew Simms; it just exposes a raw data export instead of (or alongside) the page-scraping surface AdTorque Edge sites usually offer, and guards its rendered pages far more aggressively. Still needed its own adapter, since this export's `@LISTING_*` field format shares nothing with AdTorque Edge's schema.org markup.
  - **Real bug caught by full-inventory verification, same pattern as before:** transmission was initially missing on 277/818 (34%) — far too high to hand-wave. Traced to raw values our normalizer didn't recognize: `"Continuous Variable"` (261 — a CVT spelled out in full rather than abbreviated), `"final drive only"` and `"BEV eAxle"` (13 combined — EV single-speed drive units, no gears, effectively automatic), and `"intelligent variable"` (1 — a manufacturer's branded CVT name). Fixed `normalizeTransmission` to handle all four, closing 275 of the 277 gaps — the remaining 2 (an empty string and an ambiguous trim-level-looking value, `"SLT"`) are genuine data gaps, correctly left blank rather than guessed.
  - URL construction note: the real detail URL includes a dealership-name path segment not cleanly derivable from this feed (the feed's yard-name values like "Used Vehicles" or "APD Used" don't match the sitemap's dealership slugs) — tested and confirmed the site 302-redirects to the canonical page even with that segment wrong or omitted, so it's left out rather than guessed at.

**Colonial Motor Company (CMC) — resolved, no new adapter needed.** Investigated and found `colmotor.co.nz` is a pure corporate/investor-relations site — no vehicle inventory anywhere on it, not even on its "Directory" or "Dealerships" pages (those turned out to be a registered-office address and nav chrome respectively). CMC is a holding company; its ~19 dealerships each run their own separate website. Checked two we already knew about from the original research (research/dealer-sites.md): **Team Hutchinson All Makes** (tham.co.nz) is Motorcentral, **South Auckland Motors** (southaucklandmotors.co.nz) is AdTorque Edge — both confirmed via footer signature and a live endpoint check, both robots.txt-open, both added straight to `seedDealers.ts` with zero new adapter code. Team Hutchinson All Makes is what surfaced the Motorcentral template-tier bugs described above. The Ford-branded sibling sites (teamhutchinsonford.com, southaucklandford.co.nz) didn't match any known platform footer and weren't investigated further — likely new-vehicle-focused franchise pages, lower priority for a used-car deal-finder.

**Dealer list expansion (round 1) — done.** Added 25 more dealers from the research/dealer-sites.md candidate list: 24 Motorcentral independents (Trust Motors, Copping Motor Company, Autoline Cars, Click Cars, Southern Cross Autos, NZ Autos, Feilding Motor Group, RJ Wilton Cars, J & H Autos, Fusion Cars, Nelson Cars, 80 Motors, JE Imports, Cheapies Cars, Wheeler Motors, EV City, Impact Off Road, Pearce Brothers, Southern Specialist Cars, Waggs, Mexted Motors, Industry Motors, Scotts Auto Sales, Any Car) plus Andrew Simms Dunedin (AdTorque Edge) — 34 dealers total now seeded. Each was independently fingerprinted live (not just trusted from the research doc's "expected" platform column) and robots.txt-checked against its actual listings path before being added, then spot-checked with a real crawl (5 sampled sites, 0 missing make/price across all). Excluded, with reasons: Macaulay Motors, Blackwells Isuzu, Blackwells GMSV, Southern Lakes Motors (robots.txt disallows a generic crawler outright); Fagan Motors, Gluyas Nissan, Grant Johnstone (platform fingerprint didn't confirm CarUpdater live, or the site was unreachable — didn't just trust the research doc's guess); NZ Cheap Cars (robots.txt specifically disallows `/stock`, the AdTorque Edge listings path).

**Dealer list expansion (round 2) — done.** Resolved two more sources of candidates: (1) research/dealer-sites.md already listed several dealers with real URLs that were simply never fingerprinted in the original research pass (marked "Unknown" for lack of a check, not because they're confirmed bespoke) — fingerprinting these live found 3 more matches: Jan Japan (Motorcentral), Tristram Auckland and Fairview Motors (both AdTorque Edge); (2) the ~20 "URL not captured" AutoTrader-directory independents — AutoTrader's own dealer-profile pages don't expose an outbound website link, so these were resolved by searching name+region directly instead, which found 4 more matches: 0800 Best Deal Cars, A2Z Cars, AC Autos, 4E Japan Direct (all Motorcentral). All 7 were fingerprinted live, robots.txt-checked against their real listings path, and spot-check crawled before being added — 41 dealers total now seeded. Excluded, with reasons: 1 Stop Motors, 13 Autos, 4 Guys Autobarn, Affordable Car Sales, Ace Motors Group (fingerprinted, no known platform — genuinely bespoke); Advantage Cars, Absolute Auto, Advance Motors (unreachable/404 on every URL form tried); Coutts (Mercedes-Benz franchise, no confirmed platform or working URL found); JK Cars, JP Autos, JR's Motors, NZC Cars, Portage Cars, Enterprise Cars, JMJ Cars, Waikato Kia, Mazda of Hamilton, Tauranga Motor Company (fingerprinted, came back unknown).

Still to do:
- Further expansion beyond round 2 — page through the full AutoTrader dealer directory (17 pages) and TradeMe's dealer directory for more regional independents (Northland, Gisborne, Hawke's Bay, Nelson/Marlborough, Southland are still thin), per research/dealer-sites.md §4
- Cross-dealer VIN-based dedup (§5a) — VIN is now captured, but nothing yet checks for the same VIN appearing across different dealers
- Manual dealer-exclusion list the crawler respects, for reactive takedown requests (currently `dealers.active` exists in schema but nothing sets it besides manual DB edits)
- Actual scheduling (24h cadence, always-on host) — `npm run crawl` is manual-invoke only right now; needs the VPS from §4/open items
- See [`research/dealer-sites.md`](research/dealer-sites.md) for the full 90-site list and per-chain robots.txt findings

**Phase 4 — Financial model** ✅ done

Built as `src/lib/ownership/`, five pure calculation modules combined by `estimate3YearOwnershipCost()`:
- `constants.ts` — **decided against live scrapers for finance/fuel/electricity/insurance/labour rates**, unlike the dealer crawlers. These figures move slowly (weekly to yearly) relative to a friends-and-family project's update cadence, so building 4-5 separate scraper+schema+job pipelines for a handful of numbers wasn't a good cost/effort tradeoff. Instead: a small set of constants, each sourced and dated (2026-08-31) with its origin documented inline (MBIE weekly fuel monitoring, NZTA/Waka Kotahi RUC rates, Quashed Q2 2026 insurance index, published bank/finance-company car-loan rate ranges, NZ workshop labour-rate surveys) — refreshed by re-checking the citation, not by guessing. Flagged as needing periodic manual refresh, especially fuel prices given 2026's Middle East-conflict-driven volatility.
- `consumption.ts` — L/100km (petrol/diesel/hybrid) or kWh/100km (EV) estimates by body type + powertrain — a bracket estimate, not a per-model fuel-economy database (none exists yet).
- `finance.ts` — proper reducing-balance loan amortization (not a flat-rate approximation), returning interest paid within the 3-year ownership horizon even though a typical loan term (60 months) runs longer — interest is the actual cost of financing, principal is money that buys the car either way. Accepts the user's actual deposit as an absolute dollar amount (`deposit`), not just a percentage of the listing price — a user knows what cash they have, not what fraction that is of whatever car they're looking at. Handles the deposit covering the whole price (or exceeding it) as buying outright, not an error: loan amount clamps to $0 rather than going negative, and the breakdown surfaces `loanAmount` so a $0-finance result is visible, not just an absence of interest cost.
- `fuel.ts` — fuel/electricity cost **plus NZ Road User Charges**, a real and easy-to-miss cost: diesel and EVs pay RUC directly ($76/1000km, not baked into the pump price like petrol's fuel excise duty is), PHEVs pay a reduced rate ($38/1000km) since they also burn taxed petrol. Left out, a diesel or EV listing would look artificially cheap to run.
- `servicing.ts` — one annual service (NZ's common interval), cost = labour hours × workshop rate + parts estimate, both varying by powertrain (EVs need far fewer service items — no oil, filters, spark plugs, timing belt).
- `insurance.ts` — formula-based bracket model, not a live quote (per §7's expectation that insurer quote flows likely aren't automatable without DOB/address/driving history) — national-average comprehensive premium scaled by price vs. a reference insured value, square-root (not linear) since a $60k car isn't 4x the premium of a $15k car.
- `repairs.ts` — the fuzziest input by design (per §2) — annual unscheduled-repair cost bracket by vehicle age, multiplied by a brand-tier factor (budget-reliable/mainstream/premium/exotic). Caught and fixed during testing: McLaren initially fell through to the default 1.0× tier since only "ordinary" European luxury brands (BMW, Audi, etc.) were classified — added a separate, higher exotic-marque tier (McLaren, Ferrari, Lamborghini, etc.) after testing against a real McLaren 570S listing from our own crawled data (Trust Motors) exposed the gap.
- Sanity-checked against 5 real listings pulled from the actual DB/crawl output spanning petrol SUV, diesel ute, EV hatch, an old cheap hybrid, and the McLaren outlier — all five produced directionally sensible 3-year totals (e.g. the diesel ute costs more to run than the petrol SUV of similar price, the EV noticeably less, the old hybrid's cost is dominated by its age-repair bracket rather than fuel).

Not built (deliberately deferred, not forgotten): a per-make/model fuel-economy or service-schedule database — Phase 4 uses bracket estimates by body type/powertrain instead, consistent with the "confidence indicator, not precision" approach decided in §1's disclaimer requirement. Revisit if bracket accuracy turns out to be a real complaint once Phase 6's UI is in front of actual users.

**Phase 5 — Valuation & ranking engine — skipped for now (decided)**
Full fair-value/depreciation-curve modelling and composite "best deal" ranking were deliberately not built yet. **Decided instead:** Phase 6 shows a mileage-bracketed average price (low/under 60k, medium 60-120k, high over 120k km) computed only from the listings currently matching a search — real signal from real data, with no model or comparables logic behind it. This is honest about what it is (a same-search comparison, not a market-wide valuation) and ships something useful now rather than waiting on the harder ranking/depreciation work. Revisit full Phase 5 later if the simpler approach proves insufficient.

**Phase 6 — Web app / UX** ✅ done
- Built as Next.js Server Components against real crawled data (no client-side fetching/state needed for v1): `src/app/page.tsx` reads filters from `searchParams` (this Next.js version makes both `params` and `searchParams` promises — checked the bundled docs before writing this, per this repo's Next.js-breaking-changes warning) and renders everything server-side.
- `src/components/search-form.tsx` — uses `next/form` with a string `action=""`, which does a GET-style client-side navigation encoding fields into the URL's query string (not a Server Action/mutation) — the standard Next.js pattern for a filter form that should produce shareable/bookmarkable URLs. Fields: body type + powertrain (dropdowns backed by `vehicle_categories`, Phase 2), make (dropdown from distinct live DB values — model/make were never seeded as static taxonomy, see Phase 2), model (free-text `ilike` match — dealers don't share consistent casing/spacing), transmission, region (best-effort — some franchise groups store one multi-region string per dealer rather than one row per region), min/max price, max mileage, plus deposit ($) and annual driving (km) inputs that feed the ownership-cost estimate.
- `src/lib/search/mileageStats.ts` — the mileage-bracket average-price computation described above, run against whatever `searchListings()` returns for the active filters.
- `src/lib/search/listings.ts` — extended with `getDistinctMakes()`/`getDistinctRegions()` for the dropdowns, and `model` changed from exact match to `ilike` partial match.
- `src/components/listing-card.tsx` — asking price, 3-year ownership cost (via Phase 4's `estimate3YearOwnershipCost`), mileage/transmission/powertrain/body-type chips, dealer name+region, NZ-new/import badge, outbound link to the actual dealer listing.
- `src/components/disclaimer.tsx` — the visible disclaimer required by §1, always shown, explicit that mileage-bracket prices aren't a market valuation and ownership costs are bracket estimates.
- Verified against the real, fully-crawled database (not a sample): a `?bodyType=ute&maxPrice=40000` search rendered hundreds of real listing cards with prices, mileage, ownership-cost figures, and populated mileage-bracket averages.
- Not built (deliberately out of scope per the user's steer): fair-value/overpayment figures (that's Phase 5, skipped for now) and the manual single-listing paste-in flow (secondary feature, not prioritized yet).

**Phase 3 addendum — crawler performance.** Two real problems surfaced while backfilling the full 41-dealer database and were fixed, not just worked around:
- `ingestDealerListings` did one DB round-trip per listing (a ~2,150-listing dealer took minutes on the DB step alone, separate from crawl time). Rewritten to batch: one multi-row `INSERT ... ON CONFLICT (dealer_id, external_id) DO UPDATE` per 500 listings, using the `xmax = 0` Postgres trick to tell a fresh insert apart from an update within the same `RETURNING` clause instead of a second query, and coalescing detail-page-only fields (`bodyType`, `transmission`, etc.) against the existing row so a re-confirm of an already-known listing doesn't blank them out.
- Request concurrency, not threading: Node's I/O is already non-blocking and page-parsing is cheap at this scale, so the actual lever was how many requests are in flight, not OS threads. Added `src/lib/crawler/concurrency.ts` (`mapWithConcurrency`, a bounded worker-pool) and used it for: Motorcentral/CarUpdater/AdTorque Edge's per-new-listing detail-page fetches (previously sequential), Turners' pagination (page 1 reveals the total result count, so every remaining page is fetched concurrently instead of one after another), and 2 Cheap Cars' full listing set (640 independent detail-page fetches every crawl — the single biggest per-adapter win, ~30s down from several minutes). `run.ts` also crawls up to 6 dealers concurrently instead of one at a time, since each hits a completely different server.
- The per-request artificial delay (500ms, originally a politeness convention — no dealer's robots.txt actually specifies a `Crawl-delay`) was removed for the one-time cold-start backfill at the user's explicit direction. Bounded concurrency now does the throttling instead of a sleep.
- One real bug this surfaced and fixed: killing the original slow backfill mid-run and restarting it raced against itself on Turners specifically (both processes briefly in flight at once), causing a duplicate-key crash that left Turners' ingest incomplete. The batched-upsert rewrite makes this failure mode structurally impossible going forward (`ON CONFLICT` is atomic per-row; there's no separate "does this exist?" check to race against). Re-ran Turners alone afterward to complete the interrupted ingest.
- Also confirmed Southern Specialist Cars returning 0 listings is real (its results container is genuinely empty right now), not an adapter bug.

**Phase 7 — Hardening & maintenance**
- Monitoring for scraper breakage across dealer sites
- Data quality checks (outlier detection on scraped prices)
- Ongoing tuning of depreciation/repair-cost models as data accumulates

## 7. Open items to nail down during build

- Hosting provider choice for the DB + always-on crawler worker
- Whether insurer quote flows are actually automatable once we test them (may end up formula-only)
- How to define the "best deal" composite ranking (weighting underpayment vs. ownership cost vs. condition) — will need tuning once real data flows in
- Whether/when a commercial FB Marketplace scraper (e.g. Apify) becomes worth paying for, once dealer-only coverage's limitations are clearer
- Exact wording/placement of the disclaimer and confidence indicator in the UI
