ALTER TABLE "user_settings" ADD COLUMN "email_on_price_drop_alerts" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "watchlist_items" DROP COLUMN "email_on_price_drop";