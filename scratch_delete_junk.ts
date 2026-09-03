import { db } from "@/db/client";
import { listings } from "@/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const rows = await db.select().from(listings).where(eq(listings.make, "Factory Built"));
  console.log(JSON.stringify(rows, null, 2));
}
main();
