import { db } from "../db/client";
import { listings, vehicleModelDescriptions } from "../db/schema";
import { sql, count } from "drizzle-orm";

async function findNextMissingModels() {
  console.log("Finding next 50 most popular models without descriptions...\n");

  // Get all descriptions
  const allDescriptions = await db.select().from(vehicleModelDescriptions);
  const descriptionMap = new Map<string, boolean>();

  for (const desc of allDescriptions) {
    const key = `${(desc.make || "").toLowerCase()}|${(desc.model || "").toLowerCase()}`;
    descriptionMap.set(key, true);
  }

  // Get top 300 popular models to filter for missing ones
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
    .limit(300);

  const missingModels = [];

  for (const model of popularModels) {
    const make = model.make || "";
    const modelName = model.model || "";
    const key = `${make.toLowerCase()}|${modelName.toLowerCase()}`;

    if (!descriptionMap.has(key)) {
      missingModels.push(model);
    }
  }

  const nextBatch = missingModels.slice(0, 50);

  console.log(`Found ${nextBatch.length} models needing descriptions:\n`);
  nextBatch.forEach((m, i) => {
    console.log(`${i + 1}. ${m.make} ${m.model} - ${m.count} listings`);
  });

  console.log("\n\nJSON format for seeding:");
  console.log(JSON.stringify(nextBatch, null, 2));
}

findNextMissingModels()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
