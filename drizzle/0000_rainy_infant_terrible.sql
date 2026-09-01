CREATE TABLE "dealers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"region" text,
	"type" text NOT NULL,
	"platform" text,
	"robots_allowed" boolean DEFAULT true NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_price_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"observed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"dealer_id" integer NOT NULL,
	"external_id" text NOT NULL,
	"url" text NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"year" integer,
	"variant" text,
	"engine" text,
	"transmission" text,
	"body_type" text,
	"powertrain" text,
	"mileage_km" integer,
	"condition" text,
	"import_status" text,
	"vin" text,
	"price" numeric(10, 2) NOT NULL,
	"price_includes_add_ons" boolean DEFAULT false NOT NULL,
	"add_ons_json" jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"missed_crawls" integer DEFAULT 0 NOT NULL,
	"raw_json" jsonb,
	"first_seen_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"value" text NOT NULL,
	"label" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "listing_price_history" ADD CONSTRAINT "listing_price_history_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "listings_dealer_external_id_idx" ON "listings" USING btree ("dealer_id","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_categories_kind_value_idx" ON "vehicle_categories" USING btree ("kind","value");