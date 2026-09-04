CREATE TABLE IF NOT EXISTS "vehicle_specs" (
	"id" serial PRIMARY KEY NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"year_from" integer NOT NULL,
	"year_to" integer,
	"engine" text,
	"powertrain" text,
	"fuel_economy_l_100km" numeric(4, 1),
	"co2_grams_km" integer,
	"safety_stars" numeric(2, 1),
	"safety_test" text,
	"veeel_reference" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "email_on_price_drop_alerts" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "listing_price_history_listing_observed_idx" ON "listing_price_history" USING btree ("listing_id","observed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "listings_active_price_idx" ON "listings" USING btree ("price") WHERE "listings"."status" = 'active' and "listings"."price" > 0;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "listings_active_mileage_idx" ON "listings" USING btree ("mileage_km") WHERE "listings"."status" = 'active' and "listings"."price" > 0;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "listings_make_idx" ON "listings" USING btree ("make");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "listings_body_type_idx" ON "listings" USING btree ("body_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "listings_powertrain_idx" ON "listings" USING btree ("powertrain");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "listings_transmission_idx" ON "listings" USING btree ("transmission");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "listings_year_idx" ON "listings" USING btree ("year");
