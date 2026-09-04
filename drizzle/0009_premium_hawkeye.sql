CREATE TABLE "vehicle_specs" (
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
