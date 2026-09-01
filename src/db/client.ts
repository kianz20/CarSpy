import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Next.js loads .env.local into process.env before any app code runs, so
// this is a no-op there. Standalone scripts (seed.ts, future crawler jobs)
// run outside Next and need it loaded explicitly — doing it here, once, at
// the shared DB entry point, means every caller gets it for free instead of
// each script needing its own dotenv setup (and getting the import-hoisting
// order wrong, since a config() call written after an import always runs
// after that import's module body, regardless of source order).
config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set — copy .env.example to .env.local and fill it in");
}

const queryClient = postgres(process.env.DATABASE_URL);

export const db = drizzle(queryClient, { schema });
