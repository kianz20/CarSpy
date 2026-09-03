CREATE TABLE "search_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"filters" jsonb NOT NULL,
	"sort" text NOT NULL,
	"result_count" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "search_log" ADD CONSTRAINT "search_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;