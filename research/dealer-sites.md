# NZ Used-Car Dealer Site Research (CarValue)

Compiled 2026-08-29. Sources: AutoTrader NZ dealer directory (autotrader.co.nz/car-dealers), Motorcentral portfolio pages, AdTorque Edge marketing pages, direct footer inspection of ~15 dealer sites, Armstrong's/Colonial Motor Company corporate sites, and general web search.

---

## 1. Platform-Consolidation Finding (read this first)

**Bottom line: a large share of small-to-mid NZ dealer sites are NOT bespoke — they are built on a small number of shared white-label DMS/website platforms. This changes the scraping strategy from "100 bespoke scrapers" to roughly 3-4 platform adapters plus a smaller number of one-offs for the big chains.**

### Confirmed platform vendors (verified by fetching live footers)

| Platform | Evidence | Confirmed NZ dealers using it (sample, not exhaustive) | What it means for scraping |
|---|---|---|---|
| **Motorcentral** (motorcentral.co.nz, Christchurch-based, founded 2001) | Exact footer text `© [dealer] | powered by Motorcentral` found verbatim on multiple, unrelated independent dealer sites | AJ Motors (10 branches nationwide), Genuine Vehicle Imports (GVI), Trust Motors (Manukau), Copping Motor Company (Tauranga), Autoline Cars, Click Cars, Southern Cross Autos, NZ Autos, Feilding Motor Group, RJ Wilton Cars, J&H Autos, Fusion Cars, Nelson Cars, 80 Motors, JE Imports, Cheapies Cars (Timaru), Wheeler Motors, EV City, Impact Off Road, Pearce Brothers, Southern Specialist Cars, Waggs, Mexted Motors, Industry Motors, Scotts Auto Sales (Dunedin), Any Car (Christchurch), Team Hutchinson All Makes (Christchurch, used-car arm of Colonial Motor Company) | **This is the single highest-value target.** Motorcentral is a NZ-only DMS + website vendor that is explicitly designed to publish the same inventory data to Trade Me, Auto Trader, Need A Car, DealerBase, Driven, etc. via a shared vehicle-listing schema. Dealer sites built on it share the same underlying stock-search markup/URL patterns (templated per Motorcentral "Premium" or "Custom" tier). One scraper adapter targeting Motorcentral's HTML/JS structure (or its underlying feed) likely covers 20-40+ of the independent yards in the list below, and probably more not yet identified — Motorcentral's own portfolio pages (`/dealer-websites/portfolio/premium` and `/custom`) list only their showcased examples, not their full client roster. |
| **AdTorque Edge** (adtorqueedge.com, AU/NZ/Asia digital agency, ~700 dealerships across all three markets) | Exact footer text "Site design by AdTorque Edge" found on multiple sites | NZ Cheap Cars, Andrew Simms (multi-region franchise group) | AdTorque Edge is an AU-headquartered full-service agency (websites + ads + lead-gen "ALICE" platform) rather than a pure NZ DMS vendor, and per public reporting has partnered with Trade Me on a data-sharing arrangement — worth checking ToS carefully before scraping any AdTorque Edge site. Their sites appear more custom-designed per client than Motorcentral's, but likely share a common front-end framework/stock-locator widget. |
| **CarUpdater** (via webdesign.co.nz, "100% NZ owned") | Vendor's own case-study page names these dealers as clients | Blackwells, Blackwells Isuzu, Blackwells GMSV, Macaulay Motors, Southern Lakes Motors, Fagan Motors, Gluyas Nissan, Grant Johnstone (plus unnamed "Mazda NZ Dealers") | Smaller footprint than Motorcentral, but the vendor explicitly says CarUpdater exports the same inventory data to TradeMe and Auto Trader — implying a standard underlying data model per dealer site, likely a worthwhile 3rd adapter. |
| **eMarketingEye** | Footer credit "Website Designed and Developed by eMarketingEye" | Sterling Cars | Only one confirmed instance found — likely a bespoke build-per-client agency rather than a repeating template, lower priority. |

### Sites that appear to be genuinely bespoke / in-house
- **Turners** — NZ's largest used-car chain; own listed public company (Turners Automotive Group) with its own in-house tech arm (Turners Group IT). Site structure is custom.
- **2 Cheap Cars** — footer had no third-party design credit; robots.txt shows a bespoke, purpose-built inventory search structure (see below) — appears to be an in-house/custom platform, not a shared template.
- **MotorCo** — no design/platform credit found in footer; likely bespoke or an agency build not otherwise seen elsewhere in this sample.
- **Armstrong's Motor Group** and **Colonial Motor Company (CMC)** — both are large corporate groups running their own centralized multi-brand dealership-locator sites (armstrongs.co.nz, colmotor.co.nz) that then link out to individual franchise sub-sites (e.g. teamhutchinsonford.com, southaucklandmotors.co.nz, southaucklandford.co.nz). These sub-sites' underlying platform wasn't independently confirmed for all brands, but the group-level "dealership finder" page structure is shared *within* each group, so a per-group adapter (rather than per-location) is the efficient approach for Armstrong's (~60+ locations) and CMC (~19 dealerships).
- **Silver Star** — referenced by the user as a well-known chain but a working, current website for a dealer of this name could not be conclusively identified during this research pass (a historic NZR passenger train dominates search results for the term). Recommend the user supply the URL directly, or treat as low priority.
- **Nichibo NZ** — operates as a wholesale/import connector (nichibojapan.com) rather than a public used-car-for-sale storefront in the same sense as the retail yards below; likely not a scraping target for retail listings in the same way.

### Practical implication for the scraper architecture
Rather than building ~90 bespoke scrapers:
1. Build **one Motorcentral adapter** first — highest dealer count identified, consistent markup, explicit feed/export design intent (their own marketing says they push to TradeMe/AutoTrader/etc., implying a clean structured data source may exist or be inferable from the HTML).
2. Build **one AdTorque Edge adapter** — check their ToS/Trade Me partnership terms carefully first given the explicit Trade Me tie-in.
3. Build **one CarUpdater adapter** as a smaller third target.
4. Treat **Turners, 2 Cheap Cars, Armstrong's, and Colonial Motor Company** as bespoke, individually-justified scrapers given their scale (each is worth the dedicated engineering effort).
5. For the long tail of small independents with no identifiable shared platform, either fingerprint their footer/page source at crawl time to auto-detect a known platform (many more than the ones confirmed here are likely on Motorcentral or CarUpdater — this list is a sample, not exhaustive) or deprioritize them.

**Recommended next step:** write a lightweight "platform fingerprinter" that fetches each candidate dealer homepage, checks for the "powered by Motorcentral" / "AdTorque Edge" / "CarUpdater" footer strings (or their characteristic JS/CSS asset URLs), and buckets each dealer automatically before deciding whether it needs a bespoke scraper.

---

## 2. robots.txt / ToS findings for major chains

| Chain | robots.txt findings | ToS notes |
|---|---|---|
| **Turners** (turners.co.nz) | Permissive: `User-agent: *` / `Allow: /` for the whole site, plus a sitemap reference (`/main-sitemap.xml`). No inventory/search paths are disallowed. | Did not locate an explicit anti-scraping clause in a quick pass; given the fully-open robots.txt, technical crawling is not blocked, but check Turners' website Terms of Use page directly before building a production scraper — public companies commonly include a general "no automated extraction of data" clause in site ToS even when robots.txt is open. |
| **2 Cheap Cars** (2cheapcars.co.nz) | More restrictive: disallows `/admin/`, `/account/`, `/home/search`, `/s/`, `/buy-now/`, `/finance/application/`, `/finance/calculator/`, `/test-drive/`, `/home/similar/`, `/BannerLink/`, and vehicle-parameter query strings (`?vehicle=`, `&vehicle=`, `?keywords...`). Two sitemaps are declared: `/sitemap.xml` and `/sitemap-inventory.xml`. **The dedicated `sitemap-inventory.xml` is notable** — it suggests the general vehicle listing/detail pages themselves are intended to be crawled (not blocked), while only the *interactive search UI, forms, and transactional flows* are disallowed. This is a reasonable, scraper-friendly signal for the inventory pages specifically. | Not checked in detail this pass — recommend reviewing 2 Cheap Cars' Terms of Use before scraping, since robots.txt permissiveness on listing pages doesn't override a ToS restriction if one exists. |
| **JMC** | Could not confidently identify a live NZ used-car dealer chain website under this name — searches for "JMC" NZ used cars returned only unrelated results (a South African listings aggregator, an Australian dealer, and used-car-lift equipment company). Possible this is a lesser-known/regional or rebranded dealer, or a misremembered name (e.g. could be confused with JMJ Cars, JK Cars, or J&H Autos, all of which do exist in NZ and are included in the table below). Recommend the user confirm the exact name/URL so robots.txt can be checked directly. |

### 2a. robots.txt findings across the 3 shared platforms — policy is per-dealer, NOT per-platform

A follow-up check fetched robots.txt directly from 7 sample dealer sites spanning all three shared platforms identified above. **Finding: robots.txt is configured per individual dealer site, not templated by the underlying platform** — two dealers on the exact same platform can have opposite policies. This means the platform-adapter strategy still saves real engineering work on parsing code, but does **not** grant a blanket scraping clearance per platform — every dealer site needs its own robots.txt check regardless of which platform it runs on.

| Site | Platform | robots.txt for a generic/custom crawler |
|---|---|---|
| AJ Motors (ajmotors.co.nz) | Motorcentral | Fully open (`Disallow:` empty) |
| GVI (gvi.kiwi) | Motorcentral | Fully open |
| Team Hutchinson All Makes (tham.co.nz) | Motorcentral | Listing pages open; blocks `/Admin`, `/BuyNow`, `/SaleMap`, and a `/VehicleService.asmx` endpoint (a backend web-service path — off-limits, but structurally notable) |
| **NZ Cheap Cars** (nzcheapcars.co.nz) | AdTorque Edge | **`Disallow: /stock` for `User-agent: *`** — the listing pages themselves are blocked for generic crawlers. `Allow: /stock` is carved out *only* for Googlebot, Bingbot, and Yandexbot by name. Also explicitly disallows GPTBot, anthropic-ai, CCBot, Amazonbot, and ChatGPT-User site-wide. |
| Andrew Simms (andrewsimms.co.nz) | AdTorque Edge | Fully open (only standard CMS-internals paths blocked) |
| Blackwells (blackwells.co.nz) | CarUpdater | Fully open (only image/media directories blocked) |
| **Macaulay Motors** (macaulaymotors.co.nz) | CarUpdater | **`Disallow: /` for `User-agent: *`** — the entire site is blocked by default. Explicitly `Allow`s only a named list of major search/AI crawlers (Googlebot, Bingbot, Slurp, ClaudeBot, Claude-SearchBot, GPTBot, OAI-SearchBot, PerplexityBot). A custom scraper isn't on that list and is blocked from the whole site. |

**Implication:** at least two of the seven sampled sites (NZ Cheap Cars and Macaulay Motors) are deliberately distinguishing "trusted" named crawlers from everything else and blocking generic/custom scrapers outright — not an oversight, a considered anti-scraping posture. The scraper build needs a **per-dealer robots.txt check as a standing pipeline step** (not a one-time platform-level clearance) — fetch and respect robots.txt for every dealer site individually before crawling it, and skip/flag any site (like Macaulay Motors) that disallows generic crawlers.

---

## 3. Dealer site list (90 entries)

Legend — Type: **Chain** = multi-branch used-car chain; **Franchise** = new-car franchise/dealer group with used stock; **Independent** = single/few-branch used-car yard. Platform is left "Unknown" where not verified in this research pass (absence of a footer credit does not prove a bespoke build — see note above).

| Name | URL | Region | Type | Platform (if known) |
|---|---|---|---|---|
| Turners Cars | https://www.turners.co.nz | National | Chain | Bespoke / in-house (Turners Group IT) |
| 2 Cheap Cars | https://www.2cheapcars.co.nz | National (11 branches: Auckland, Hamilton, Tauranga, Palmerston North, Wellington, Christchurch) | Chain | Bespoke / in-house |
| NZ Cheap Cars | https://www.nzcheapcars.co.nz | National | Chain | AdTorque Edge |
| Genuine Vehicle Imports (GVI) | https://www.gvi.kiwi | Auckland | Independent (large importer/yard) | Motorcentral |
| AJ Motors (10 locations) | https://www.ajmotors.co.nz | National (Auckland, Hamilton, Christchurch) | Chain | Motorcentral |
| Armstrong's Motor Group | https://www.armstrongs.co.nz | Auckland, Wellington, Christchurch, Dunedin | Franchise group (30+ dealerships, 18+ brands) | Unknown (corporate custom) |
| Auckland City Toyota – Grey Lynn | https://www.armstrongs.co.nz/dealership/auckland-city-toyota-grey-lynn/ | Auckland | Franchise (Armstrong's/Toyota) | Unknown |
| Auckland City Toyota – Mt Wellington | https://www.armstrongs.co.nz/dealership/auckland-city-toyota-mt-wellington/ | Auckland | Franchise (Armstrong's/Toyota) | Unknown |
| Auckland City Toyota – Greenlane | https://www.armstrongs.co.nz/dealership/auckland-city-toyota-greenlane/ | Auckland | Franchise (Armstrong's/Toyota) | Unknown |
| Lexus of East Auckland | https://www.armstrongs.co.nz/dealership/lexus-of-east-auckland/ | Auckland | Franchise (Armstrong's) | Unknown |
| Mercedes-Benz Botany | https://www.armstrongs.co.nz/dealership/mercedes-benz-botany/ | Auckland | Franchise (Armstrong's) | Unknown |
| Armstrong's Jaguar Wellington | https://www.armstrongs.co.nz/dealership/jaguar-wellington/ | Wellington | Franchise (Armstrong's) | Unknown |
| Armstrong's Range Rover Wellington | https://www.armstrongs.co.nz/dealership/range-rover-wellington/ | Wellington | Franchise (Armstrong's) | Unknown |
| Porsche Centre Wellington | https://www.armstrongs.co.nz/dealership/porsche-wellington/ | Wellington | Franchise (Armstrong's) | Unknown |
| Volvo Cars Wellington | https://www.armstrongs.co.nz/dealership/volvo-wellington/ | Wellington | Franchise (Armstrong's) | Unknown |
| Mercedes-Benz Christchurch | https://www.armstrongs.co.nz/dealership/armstrongs-mercedes-benz-christchurch/ | Christchurch | Franchise (Armstrong's) | Unknown |
| Armstrong's Subaru Christchurch | https://www.armstrongs.co.nz/dealership/subaru-christchurch/ | Christchurch | Franchise (Armstrong's) | Unknown |
| Armstrong's Jaguar Dunedin | https://www.armstrongs.co.nz/dealership/jaguar-dunedin/ | Dunedin | Franchise (Armstrong's) | Unknown |
| Mercedes-Benz Dunedin | https://www.armstrongs.co.nz/dealership/mercedes-benz-dunedin/ | Dunedin | Franchise (Armstrong's) | Unknown |
| Volvo Cars Dunedin | https://www.armstrongs.co.nz/dealership/volvo-dunedin/ | Dunedin | Franchise (Armstrong's) | Unknown |
| Colonial Motor Company (CMC, group site) | https://www.colmotor.co.nz | National (19 dealerships) | Franchise group holding co | Unknown (corporate custom) |
| Team Hutchinson Ford | http://www.teamhutchinsonford.com | Christchurch | Franchise (CMC/Ford) | Unknown |
| Team Hutchinson All Makes (used cars) | https://tham.co.nz | Christchurch | Independent/used arm (CMC) | Motorcentral |
| South Auckland Motors | https://southaucklandmotors.co.nz | Manukau, Botany, Takanini, Airport, Pukekohe | Franchise (CMC/Ford) | Unknown |
| South Auckland Ford | https://www.southaucklandford.co.nz | Auckland | Franchise (CMC/Ford) | Unknown |
| Andrew Simms (multi-branch group) | https://www.andrewsimms.co.nz | Auckland, Wellington, Hawke's Bay, Dunedin | Franchise group | AdTorque Edge |
| Andrew Simms Dunedin | https://andrewsimmsdunedin.co.nz | Dunedin | Franchise (Andrew Simms) | AdTorque Edge |
| Coutts | https://www.coutts.co.nz | Auckland, Wellington, Hawke's Bay, New Plymouth | Franchise group (multi-brand) | Unknown (could not confirm via fetch — site unreachable during this pass) |
| Blackwells | (not directly fetched — see webdesign.co.nz case study) | Gisborne/Hawke's Bay area | Franchise | CarUpdater |
| Blackwells Isuzu | (see above) | Gisborne/Hawke's Bay area | Franchise | CarUpdater |
| Blackwells GMSV | (see above) | Gisborne/Hawke's Bay area | Franchise | CarUpdater |
| Macaulay Motors | (see webdesign.co.nz case study) | Unknown region | Franchise/Independent | CarUpdater |
| Southern Lakes Motors | (see webdesign.co.nz case study) | Queenstown/Wanaka area | Independent | CarUpdater |
| Fagan Motors | (see webdesign.co.nz case study) | Unknown region | Franchise/Independent | CarUpdater |
| Gluyas Nissan | (see webdesign.co.nz case study) | Unknown region | Franchise (Nissan) | CarUpdater |
| Grant Johnstone | (see webdesign.co.nz case study) | Unknown region | Independent | CarUpdater |
| Sterling Cars | https://www.sterlingcars.co.nz | Auckland | Independent | eMarketingEye |
| MotorCo | https://motorco.co.nz | Penrose/East Tamaki/Manukau, Auckland | Independent | Unknown (no credit found) |
| Trust Motors | https://www.trustmotors.co.nz | Manukau, Auckland | Independent | Motorcentral |
| Copping Motor Company | https://www.copping.co.nz | Tauranga | Independent | Motorcentral |
| Autoline Cars | https://autolinecars.co.nz | Unknown region | Independent | Motorcentral |
| Click Cars | https://clickcars.co.nz | Unknown region | Independent | Motorcentral |
| Southern Cross Autos | https://southerncrossautos.co.nz | Unknown region | Independent | Motorcentral |
| NZ Autos | https://nzautos.co.nz | Unknown region | Independent | Motorcentral |
| Feilding Motor Group | https://feildingmotorgroup.co.nz | Feilding, Manawatu | Independent | Motorcentral |
| RJ Wilton Cars | https://wiltoncars.co.nz | Unknown region | Independent | Motorcentral |
| J & H Autos | https://jandhautos.co.nz | Unknown region | Independent | Motorcentral |
| Fusion Cars | https://fusioncars.co.nz | Unknown region | Independent | Motorcentral |
| Nelson Cars | https://www.nelsoncars.nz | Nelson | Independent | Motorcentral |
| 80 Motors | https://www.80motors.co.nz | Wigram, Christchurch | Independent | Motorcentral |
| JE Imports | https://www.jeimports.co.nz | Unknown region | Independent | Motorcentral |
| Cheapies Cars (Timaru) | https://www.timarucheapies.co.nz | Timaru | Independent | Motorcentral |
| Wheeler Motors | https://www.wheelermotors.co.nz | Christchurch | Independent | Motorcentral |
| EV City | https://www.evcity.kiwi | Auckland | Independent (EV specialist) | Motorcentral |
| Impact Off Road | https://www.impactoffroad.co.nz | Unknown region | Independent (4x4 specialist) | Motorcentral |
| Pearce Brothers | https://www.pearcebrothers.co.nz | Unknown region | Independent | Motorcentral |
| Southern Specialist Cars | https://www.southernspecialistcars.co.nz | Unknown region | Independent | Motorcentral |
| Waggs | https://www.waggs.co.nz | Unknown region | Independent | Motorcentral |
| Mexted Motors | https://www.mexted.co.nz | Masterton | Independent | Motorcentral |
| Industry Motors | https://www.industrymotors.co.nz | Unknown region | Independent | Motorcentral |
| Scotts Auto Sales | https://scottsautosales.co.nz | Dunedin | Independent | Motorcentral |
| Any Car | https://anycar.co.nz | Christchurch | Independent | Motorcentral |
| 0800 Best Deal Cars | (URL not captured — see AutoTrader dealer directory) | Panmure, Auckland | Independent | Unknown |
| 0800 Best Deal Cars Christchurch | (URL not captured) | Wigram, Christchurch | Independent | Unknown |
| 1 Stop Motors | (URL not captured) | Otahuhu, Auckland | Independent | Unknown |
| 13 Autos Auckland | (URL not captured) | New Lynn, Auckland | Independent | Unknown |
| 13 Autos Hamilton | (URL not captured) | Frankton, Hamilton | Independent | Unknown |
| 1st AUTOMALL | (URL not captured) | East Tamaki, Auckland | Independent | Unknown |
| A T New Cars | (URL not captured) | Otahuhu, Auckland | Independent | Unknown |
| A2Z Cars | (URL not captured) | Onehunga, Auckland | Independent | Unknown |
| Absolute Auto | (URL not captured) | Penrose, Auckland | Independent | Unknown |
| AC Autos | (URL not captured) | North Shore, Auckland | Independent | Unknown |
| Ace Motors Group | (URL not captured) | New Lynn, Auckland | Independent | Unknown |
| Advance Motors | (URL not captured) | North Shore, Auckland | Independent | Unknown |
| Advantage Cars | (URL not captured) | Botany, Auckland | Independent | Unknown |
| 4E Japan Direct | (URL not captured) | Sydenham, Christchurch | Independent | Unknown |
| 4 Guys Autobarn | (URL not captured) | Hamilton | Independent | Unknown |
| Affordable Car Sales | (URL not captured) | Burnside, Christchurch | Independent | Unknown |
| A1 Cars | (URL not captured) | Lower Hutt, Wellington | Independent | Unknown |
| JK Cars | https://www.jkcars.co.nz | Auckland | Independent | Unknown |
| JP Autos | https://www.jpautos.co.nz | Auckland | Independent | Unknown |
| JR's Motors | https://www.jrsmotors.co.nz | Auckland | Independent | Unknown |
| Jan Japan | https://www.janjapan.co.nz | Auckland | Independent | Unknown |
| Tristram Auckland | https://www.tristramauckland.co.nz | North Shore, Auckland | Franchise (multi-brand) | Unknown |
| NZC Cars | https://nzc.kiwi | Auckland (North Shore) | Independent | Unknown |
| Portage Cars | https://portagecars.co.nz | Auckland | Independent | Unknown |
| Enterprise Cars | https://www.enterprisecars.co.nz | Auckland, Hamilton, Gisborne | Chain (small) | Unknown |
| JMJ Cars Ltd | https://www.jmjcarsltd.co.nz | Timaru | Independent | Unknown |
| Fairview Motors | https://www.fairview.co.nz | Hamilton, Cambridge, Matamata, Te Awamutu, Thames | Franchise (Ford/Mazda) | Unknown |
| Waikato Kia | https://www.kia.co.nz/find-a-dealer/dealer/waikato-kia/ | Te Rapa, Hamilton | Franchise (Kia) | Unknown |
| Mazda of Hamilton | https://www.mazdaofhamilton.com | Hamilton | Franchise (Mazda) | Unknown |
| Tauranga Motor Company | https://tmccars.co.nz | Tauranga | Franchise (Honda + others) | Unknown |
| Honda Cars Wellington | https://autotrader.co.nz/car-dealers/honda-cars-wellington/10721 (dealer profile; primary site not separately captured) | Wellington | Franchise (Honda) | Unknown |
| Nichibo NZ | https://nichibojapan.com/new-zealand/ | National (import broker) | Import/wholesale connector, not a retail yard | Unknown |

*Note: rows marked "URL not captured" were sourced from the AutoTrader NZ dealer directory (autotrader.co.nz/car-dealers), which lists name + suburb but the individual dealer homepage URLs were not exposed by the directory's static markup during this research pass — AutoTrader's dealer-profile pages (e.g. `autotrader.co.nz/car-dealers/<slug>/<id>`) can be used to resolve each one's outbound website link in a follow-up pass, and this directory itself (17 pages deep) is a good ongoing source for expanding the target list well past 100 sites.*

---

## 4. Suggested follow-up work
1. Resolve the ~20 "URL not captured" independents via AutoTrader's individual dealer-profile pages, and run the platform fingerprint check (Motorcentral / AdTorque Edge / CarUpdater footer strings) against every URL in this table to convert "Unknown" into a confirmed bucket.
2. Page through the full AutoTrader dealer directory (17 pages) and Trade Me's dealer directory (trademe.co.nz/a/motors/dealerships) — both list far more than 100 dealers and would round out regional coverage (Northland, Gisborne, Hawke's Bay, Nelson/Marlborough, Southland were only lightly covered here).
3. Confirm Coutts' platform (site was unreachable during this pass) and pin down "JMC" and "Silver Star" with the user before assuming they don't exist.
4. Before scraping any AdTorque Edge site, review their Trade Me partnership terms — there may be data-sharing exclusivity or reuse restrictions relevant to a competing deal-finder product.
