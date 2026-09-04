import { db } from "../db/client";
import { listings, vehicleModelDescriptions } from "../db/schema";
import { sql, count, and, eq } from "drizzle-orm";

async function findTopMissingModels() {
  console.log("Finding top 30 most popular models without descriptions...\n");

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
    const description = await db
      .select()
      .from(vehicleModelDescriptions)
      .where(
        and(
          eq(vehicleModelDescriptions.make, model.make || ""),
          eq(vehicleModelDescriptions.model, model.model || ""),
        ),
      );

    if (description.length === 0) {
      missingModels.push(model);
    }
  }

  const topMissing = missingModels.slice(0, 30);

  console.log("Top 30 models needing descriptions:\n");
  topMissing.forEach((m, i) => {
    console.log(`${i + 1}. ${m.make} ${m.model} - ${m.count} listings`);
  });

  console.log("\n\nJSON format for seeding:");
  console.log(JSON.stringify(topMissing, null, 2));
}

findTopMissingModels()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
