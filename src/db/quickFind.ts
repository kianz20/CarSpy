import { db } from "./client";
import { listings } from "./schema";
import { sql } from "drizzle-orm";

async function quickFind() {
  // Search for March
  const march = await db
    .select({
      make: listings.make,
      model: listings.model,
    })
    .from(listings)
    .where(sql`LOWER(${listings.model}) LIKE LOWER(${'%March%'})`)
    .distinct()
    .limit(10);

  console.log("Models with 'March':");
  march.forEach(m => console.log(`  ${m.make} ${m.model}`));
  console.log();

  // Search for Sai
  const sai = await db
    .select({
      make: listings.make,
      model: listings.model,
    })
    .from(listings)
    .where(sql`LOWER(${listings.model}) LIKE LOWER(${'%Sai%'})`)
    .distinct()
    .limit(10);

  console.log("Models with 'Sai':");
  sai.forEach(m => console.log(`  ${m.make} ${m.model}`));
}

quickFind().then(() => {
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
