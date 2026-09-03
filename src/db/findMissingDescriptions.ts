import { db } from "./client";
import { listings, vehicleModelDescriptions } from "./schema";
import { sql, count, and, eq } from "drizzle-orm";

async function findMissingDescriptions() {
  // Get top 50 popular models
  const popularModels = await db
    .select({
      make: listings.make,
      model: listings.model,
      count: count(),
    })
    .from(listings)
    .where(sql`${listings.make} IS NOT NULL AND ${listings.model} IS NOT NULL`)
    .groupBy(listings.make, listings.model)
    .orderBy(sql`count(*) DESC`)
    .limit(50);

  console.log("Checking which popular models have descriptions...\n");

  const missingDescriptions: Array<{ make: string | null; model: string | null; count: number }> = [];

  for (const model of popularModels) {
    const description = await db.select().from(vehicleModelDescriptions)
      .where(
        and(
          eq(vehicleModelDescriptions.make, model.make || ""),
          eq(vehicleModelDescriptions.model, model.model || "")
        )
      );

    const hasDesc = description.length > 0;
    const make = (model.make || "").padEnd(20);
    const modelName = (model.model || "").padEnd(25);
    const countStr = (model.count || "").toString().padEnd(10);
    const status = hasDesc ? "✓" : "✗";
    console.log(`${status} ${make}${modelName}${countStr}`);

    if (!hasDesc) {
      missingDescriptions.push({ make: model.make, model: model.model, count: model.count });
    }
  }

  console.log("\n\n=== MODELS WITHOUT DESCRIPTIONS ===\n");
  missingDescriptions.forEach(m => {
    console.log(`${m.make} ${m.model} (${m.count} listings)`);
  });
}

findMissingDescriptions().then(() => {
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
