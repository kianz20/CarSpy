CREATE TABLE "feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"email" text,
	"message" text NOT NULL,
	"page_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"read_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;