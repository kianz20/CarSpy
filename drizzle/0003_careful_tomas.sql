CREATE TABLE "vehicle_model_descriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"description" text NOT NULL,
	"reliability_issues" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_model_descriptions_make_model_idx" ON "vehicle_model_descriptions" USING btree ("make","model");