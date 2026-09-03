import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  timestamp,
  boolean,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// A dealer/yard site we crawl. One row per dealer, not per site-platform —
// e.g. each Motorcentral-powered yard is still its own dealer row here.
export const dealers = pgTable(
  "dealers",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    url: text("url").notNull(),
    region: text("region"),
    type: text("type").notNull(), // 'chain' | 'franchise' | 'independent'
    platform: text("platform"), // 'motorcentral' | 'adtorque_edge' | 'carupdater' | 'bespoke' | null (unknown)
    robotsAllowed: boolean("robots_allowed").notNull().default(true),
    active: boolean("active").notNull().default(true), // false = excluded (e.g. reactive takedown request)
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("dealers_url_idx").on(table.url)],
);

// A vehicle listing as currently seen on a dealer site. Updated in place as
// the crawler re-confirms it; price changes are recorded separately in
// listingPriceHistory so the depreciation model has a full timeline.
export const listings = pgTable(
  "listings",
  {
    id: serial("id").primaryKey(),
    dealerId: integer("dealer_id")
      .notNull()
      .references(() => dealers.id),
    externalId: text("external_id").notNull(), // dealer's own listing id/slug, for dedup within a dealer
    url: text("url").notNull(),

    make: text("make").notNull(),
    model: text("model").notNull(),
    year: integer("year"),
    variant: text("variant"),
    engine: text("engine"),
    transmission: text("transmission"), // 'automatic' | 'manual' | null
    bodyType: text("body_type"), // 'ute' | 'suv' | 'hatch' | 'sedan' | ... (feeds the category taxonomy)
    powertrain: text("powertrain"), // 'petrol' | 'diesel' | 'hybrid' | 'ev' | ...
    mileageKm: integer("mileage_km"),
    condition: text("condition"),
    importStatus: text("import_status"), // 'nz_new' | 'import' | null — display badge only, not used in valuation math (see PLAN.md §2)
    vin: text("vin"), // used for cross-site dedup when a dealer exposes it (rare)
    imageUrl: text("image_url"), // dealer's own primary listing photo, hotlinked — null falls back to a stock photo on the frontend

    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    priceIncludesAddOns: boolean("price_includes_add_ons").notNull().default(false), // true if addOnsJson below was parsed out of an itemized price
    addOnsJson: jsonb("add_ons_json"), // itemized extras (e.g. warranty) when the dealer listing breaks them out — see PLAN.md §2

    status: text("status").notNull().default("active"), // 'active' | 'unconfirmed' | 'delisted' — see PLAN.md §5a
    missedCrawls: integer("missed_crawls").notNull().default(0),

    rawJson: jsonb("raw_json"), // full scraped payload for this listing, for debugging/reprocessing without re-crawling

    firstSeenAt: timestamp("first_seen_at").notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("listings_dealer_external_id_idx").on(table.dealerId, table.externalId)],
);

// Append-only price snapshots. Never deleted — this is the raw material for
// the depreciation-curve model, independent of whether the listing is still active.
export const listingPriceHistory = pgTable("listing_price_history", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id")
    .notNull()
    .references(() => listings.id),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  observedAt: timestamp("observed_at").notNull().defaultNow(),
});

// Canonical body-type / powertrain values, used to populate search dropdowns
// and to constrain what listings.bodyType / listings.powertrain can contain.
// See PLAN.md Phase 2 — decided to back dropdowns with this table rather than
// free-text/synonym matching, since structured filters remove the ambiguity
// a "find me a good hybrid" text box would otherwise need to resolve.
export const vehicleCategories = pgTable(
  "vehicle_categories",
  {
    id: serial("id").primaryKey(),
    kind: text("kind").notNull(), // 'body_type' | 'powertrain'
    value: text("value").notNull(), // matches listings.bodyType / listings.powertrain, e.g. 'ute'
    label: text("label").notNull(), // dropdown display text, e.g. 'Ute'
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [uniqueIndex("vehicle_categories_kind_value_idx").on(table.kind, table.value)],
);

// Vehicle model descriptions with reliability notes and common issues
export const vehicleModelDescriptions = pgTable(
  "vehicle_model_descriptions",
  {
    id: serial("id").primaryKey(),
    make: text("make").notNull(), // e.g. 'Toyota'
    model: text("model").notNull(), // e.g. 'Corolla'
    description: text("description").notNull(), // overview of the model
    reliabilityIssues: text("reliability_issues"), // common issues and reliability concerns
    notes: text("notes"), // additional notes (e.g. popular variants, features)
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("vehicle_model_descriptions_make_model_idx").on(table.make, table.model)],
);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)],
);

// Opaque bearer token in an httpOnly cookie, validated against this table on
// every request that needs to know who's signed in — no JWT/signing library,
// consistent with the rest of the app being DB-driven rather than
// stateless-token-driven.
export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const watchlistItems = pgTable(
  "watchlist_items",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    listingId: integer("listing_id")
      .notNull()
      .references(() => listings.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("watchlist_items_user_listing_idx").on(table.userId, table.listingId)],
);

// Free-text feedback submitted from the nav's feedback button. userId is
// nullable — anonymous visitors can submit too, with an optional email if
// they want a reply. readAt null = unread, drives the admin nav's bell badge.
export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  email: text("email"),
  message: text("message").notNull(),
  pageUrl: text("page_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  readAt: timestamp("read_at"),
});

// A signed-in user's saved ownership-cost defaults (Settings page) — applied
// wherever the search/listing pages don't already have an explicit value
// from the URL, so a search "remembers" what a user told it once instead of
// asking every time. Logged-out visitors get the equivalent via a cookie
// (see lib/settings.ts) rather than a DB row, since there's no user to key on.
export const userSettings = pgTable("user_settings", {
  userId: integer("user_id")
    .primaryKey()
    .references(() => users.id),
  ownershipYears: integer("ownership_years").notNull().default(3),
  annualKm: integer("annual_km").notNull().default(12000),
  financeEnabled: boolean("finance_enabled").notNull().default(false),
  deposit: numeric("deposit", { precision: 10, scale: 2 }),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Search log for a future "popular searches" query (see
// popular-search-chips.tsx's static seed list, which this is meant to
// eventually replace). userId is nullable — logged-out visitors are
// captured too, keyed on nothing. Admin searches are deliberately never
// inserted here (see logSearch in lib/searchAnalytics.ts) so testing/QA
// browsing doesn't skew what counts as "popular".
export const searchLog = pgTable("search_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  filters: jsonb("filters").notNull(),
  sort: text("sort").notNull(),
  resultCount: integer("result_count").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
