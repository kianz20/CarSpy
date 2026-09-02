import { db } from "./client";
import { listings } from "./schema";
import { sql, count } from "drizzle-orm";

async function findPopularModels() {
  const results = await db
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

  console.log("Top 50 most popular models in database:\n");
  console.log("Make".padEnd(20) + "Model".padEnd(25) + "Count");
  console.log("─".repeat(50));

  results.forEach((row: any) => {
    const make = (row.make || "").padEnd(20);
    const model = (row.model || "").padEnd(25);
    console.log(`${make}${model}${row.count}`);
  });
}

findPopularModels().then(() => {
  process.exit(0);
});
