import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { vehicleCategories } from "@/db/schema";

/** Dropdown options for one taxonomy kind (body_type/powertrain), read from
 * the seeded vehicle_categories table (PLAN.md Phase 2) rather than
 * hardcoded in the UI — single source of truth for value/label pairs. */
export async function getCategoryOptions(kind: "body_type" | "powertrain") {
  return db
    .select({ value: vehicleCategories.value, label: vehicleCategories.label })
    .from(vehicleCategories)
    .where(eq(vehicleCategories.kind, kind))
    .orderBy(asc(vehicleCategories.sortOrder));
}
