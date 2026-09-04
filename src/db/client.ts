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

// DATABASE_URL is Neon's pooled (-pooler) endpoint, which routes through
// PgBouncer in transaction mode — that doesn't support session-scoped
// server-side prepared statements (a later query can land on a different
// backend connection than the one that prepared it). postgres-js defaults to
// using them, and Neon/postgres-js both call out disabling this as required
// for the pooled endpoint (see .agents/skills/neon-postgres/SKILL.md's
// pooled-vs-direct gotcha) — left on, failures show up as unpredictable
// multi-second stalls rather than a clean error, since the driver has to
// detect the mismatch and recover rather than just failing fast.
const clientOptions = { prepare: false } as const;

// Next.js dev-mode hot-module-reload re-executes this module on every edit.
// Without caching the client on globalThis, each reload created a brand new
// connection pool on top of the still-open previous one(s) — connections
// (and their sockets/listeners) leaked for the life of the dev server
// instead of just the life of the module, which is what surfaced as a
// growing MaxListenersExceededWarning and increasingly erratic query timing
// the longer a dev session ran. Production has one module evaluation per
// process, so this is a no-op there.
const globalForDb = globalThis as unknown as { queryClient?: ReturnType<typeof postgres> };

const queryClient = globalForDb.queryClient ?? postgres(process.env.DATABASE_URL, clientOptions);
if (process.env.NODE_ENV !== "production") globalForDb.queryClient = queryClient;

export const db = drizzle(queryClient, { schema });
