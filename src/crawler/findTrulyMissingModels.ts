import { db } from "../db/client";
import { listings, vehicleModelDescriptions } from "../db/schema";
import { sql, count } from "drizzle-orm";

async function findTrulyMissingModels() {
  console.log("Finding truly missing model descriptions (case-insensitive)...\n");

  // Get all descriptions
  const allDescriptions = await db.select().from(vehicleModelDescriptions);
  const descriptionMap = new Map<string, boolean>();

  for (const desc of allDescriptions) {
    const key = `${(desc.make || "").toLowerCase()}|${(desc.model || "").toLowerCase()}`;
    descriptionMap.set(key, true);
  }

  // Get top 200 popular models
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
    .limit(200);

  const missingModels = [];

  for (const model of popularModels) {
    const make = model.make || "";
    const modelName = model.model || "";
    const key = `${make.toLowerCase()}|${modelName.toLowerCase()}`;

    if (!descriptionMap.has(key)) {
      missingModels.push(model);
    }
  }

  const topMissing = missingModels.slice(0, 30);

  console.log(`Found ${topMissing.length} truly missing models:\n`);
  topMissing.forEach((m, i) => {
    console.log(`${i + 1}. ${m.make} ${m.model} - ${m.count} listings`);
  });

  if (topMissing.length === 0) {
    console.log("All popular models already have descriptions!");
  }

  console.log("\n\nJSON format for seeding:");
  console.log(JSON.stringify(topMissing, null, 2));
}

findTrulyMissingModels()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
