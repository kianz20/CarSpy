CREATE TABLE "user_settings" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"ownership_years" integer DEFAULT 3 NOT NULL,
	"annual_km" integer DEFAULT 12000 NOT NULL,
	"finance_enabled" boolean DEFAULT false NOT NULL,
	"deposit" numeric(10, 2),
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;