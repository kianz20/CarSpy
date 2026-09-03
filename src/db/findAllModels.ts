import { db } from "./client";
import { listings, vehicleModelDescriptions } from "./schema";
import { sql, count } from "drizzle-orm";

async function findAllModels() {
  // Search for specific models the user mentioned
  const searchModels = ["March", "Sai"];

  console.log("=== SEARCHING FOR SPECIFIC MODELS ===\n");

  for (const searchModel of searchModels) {
    const results = await db
      .select({
        make: listings.make,
        model: listings.model,
        count: count(),
      })
      .from(listings)
      .where(sql`LOWER(${listings.model}) LIKE LOWER(${'%' + searchModel + '%'})`)
      .groupBy(listings.make, listings.model)
      .orderBy(sql`count(*) DESC`);

    console.log(`Models containing "${searchModel}":`);
    if (results.length === 0) {
      console.log("  (none found)");
    }
    results.forEach(r => {
      console.log(`  ${r.make} ${r.model} (${r.count} listings)`);
    });
    console.log();
  }

  // Get all models with their description status
  console.log("\n=== ALL MODELS WITHOUT DESCRIPTIONS (ordered by popularity) ===\n");

  const allModels = await db
    .select({
      make: listings.make,
      model: listings.model,
      count: count(),
    })
    .from(listings)
    .where(sql`${listings.make} IS NOT NULL AND ${listings.model} IS NOT NULL`)
    .groupBy(listings.make, listings.model)
    .orderBy(sql`count(*) DESC`)
    .limit(500);

  const missingDescriptions = [];

  for (const model of allModels) {
    const description = await db.select().from(vehicleModelDescriptions)
      .where(
        sql`LOWER(${vehicleModelDescriptions.make}) = LOWER(${model.make}) AND LOWER(${vehicleModelDescriptions.model}) = LOWER(${model.model})`
      );

    if (description.length === 0) {
      missingDescriptions.push({ make: model.make, model: model.model, count: model.count });
    }
  }

  console.log(`Total models without descriptions: ${missingDescriptions.length}\n`);
  missingDescriptions.forEach(m => {
    console.log(`${m.make} ${m.model} (${m.count} listings)`);
  });
}

findAllModels().then(() => {
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
