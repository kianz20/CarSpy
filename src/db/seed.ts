import { db } from "./client";
import { vehicleCategories } from "./schema";
import { CATEGORY_SEED } from "../lib/taxonomy/data";
import { sql } from "drizzle-orm";

async function seedVehicleCategories() {
  for (const category of CATEGORY_SEED) {
    await db
      .insert(vehicleCategories)
      .values(category)
      .onConflictDoUpdate({
        target: [vehicleCategories.kind, vehicleCategories.value],
        set: {
          label: sql`excluded.label`,
          sortOrder: sql`excluded.sort_order`,
        },
      });
  }
  console.log(`Seeded ${CATEGORY_SEED.length} vehicle categories.`);
}

seedVehicleCategories()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
