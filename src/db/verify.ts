import { db } from "./client";
import { vehicleModelDescriptions } from "./schema";
import { eq, or, like, and } from "drizzle-orm";

async function verify() {
  const results = await db.select()
    .from(vehicleModelDescriptions)
    .where(
      or(
        and(eq(vehicleModelDescriptions.make, "Nissan"), like(vehicleModelDescriptions.model, "%March%")),
        and(eq(vehicleModelDescriptions.make, "Toyota"), like(vehicleModelDescriptions.model, "%SAI%"))
      )
    );

  console.log("Newly added descriptions:\n");
  results.forEach(r => {
    console.log(`${r.make} ${r.model}`);
    console.log(`Description: ${r.description}\n`);
  });

  process.exit(0);
}

verify().catch(err => {
  console.error(err);
  process.exit(1);
});
