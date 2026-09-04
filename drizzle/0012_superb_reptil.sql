CREATE INDEX "listings_active_price_idx" ON "listings" USING btree ("price") WHERE "listings"."status" = 'active' and "listings"."price" > 0;--> statement-breakpoint
CREATE INDEX "listings_active_mileage_idx" ON "listings" USING btree ("mileage_km") WHERE "listings"."status" = 'active' and "listings"."price" > 0;--> statement-breakpoint
CREATE INDEX "listings_make_idx" ON "listings" USING btree ("make");--> statement-breakpoint
CREATE INDEX "listings_body_type_idx" ON "listings" USING btree ("body_type");--> statement-breakpoint
CREATE INDEX "listings_powertrain_idx" ON "listings" USING btree ("powertrain");--> statement-breakpoint
CREATE INDEX "listings_transmission_idx" ON "listings" USING btree ("transmission");--> statement-breakpoint
CREATE INDEX "listings_year_idx" ON "listings" USING btree ("year");