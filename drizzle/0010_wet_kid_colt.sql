CREATE TABLE "search_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"filters" jsonb NOT NULL,
	"filters_hash" text NOT NULL,
	"frequency" text NOT NULL,
	"unsubscribe_token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_notified_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "search_subscriptions" ADD CONSTRAINT "search_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "search_subscriptions_user_filters_idx" ON "search_subscriptions" USING btree ("user_id","filters_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "search_subscriptions_unsubscribe_token_idx" ON "search_subscriptions" USING btree ("unsubscribe_token");