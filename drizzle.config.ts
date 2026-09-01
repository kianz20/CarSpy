import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

// Migrations need the direct (unpooled) connection — Neon's pooled connection
// runs through PgBouncer in transaction mode, which drizzle-kit's migrator
// doesn't support (see .agents/skills/neon-postgres/SKILL.md "Gotchas").
const migrationUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!migrationUrl) {
  throw new Error(
    "DATABASE_URL_UNPOOLED (or DATABASE_URL) is not set — copy .env.example to .env.local and fill it in",
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: migrationUrl,
  },
});
