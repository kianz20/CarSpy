import { db } from "./client";
import { vehicleModelDescriptions } from "./schema";
import { and, eq } from "drizzle-orm";

// Nissan's Jatco CVT overheating problem (fluid overheats under sustained
// load/stop-start traffic, triggering limp mode; belt/chain wear and valve
// body faults follow) specifically and disproportionately affects Note,
// March, Sylphy, Juke, Dualis and X-Trail T31 — several of our entries
// claimed these CVTs "perform well," which contradicts the well-documented
// pattern. Tiida's CVT uses a different cooling design and is genuinely
// less affected, so that entry was left alone.
const corrections: { make: string; model: string; reliabilityIssues: string }[] = [
  {
    make: "Nissan",
    model: "March",
    reliabilityIssues:
      "CVT is one of the models most affected by Nissan/Jatco's known overheating issue — fluid overheats under sustained load or stop-start traffic, triggering limp mode, with slipping/shuddering and valve body faults following. Have CVT fluid condition and service history checked carefully before buying.",
  },
  {
    make: "Nissan",
    model: "Sylphy",
    reliabilityIssues:
      "CVT (badged Bluebird Sylphy in Japan) is one of the models most affected by Nissan/Jatco's known overheating issue — fluid overheats under sustained load or stop-start traffic, triggering limp mode. Have CVT fluid condition and service history checked carefully before buying.",
  },
  {
    make: "Nissan",
    model: "Note",
    reliabilityIssues:
      "CVT is one of the models most affected by Nissan/Jatco's known overheating issue — fluid overheats under sustained load or stop-start traffic, triggering limp mode, with slipping/shuddering following. Have CVT fluid condition and service history checked carefully before buying.",
  },
  {
    make: "Nissan",
    model: "Juke",
    reliabilityIssues:
      "CVT is one of the models most affected by Nissan/Jatco's known overheating issue — fluid overheats under sustained load or stop-start traffic, triggering limp mode. Have CVT fluid condition and service history checked carefully before buying.",
  },
  {
    make: "Nissan",
    model: "Dualis",
    reliabilityIssues:
      "CVT is one of the models most affected by Nissan/Jatco's known overheating issue (shared with the related X-Trail T31/Qashqai) — fluid overheats under sustained load, triggering limp mode. Have CVT fluid condition and service history checked carefully before buying.",
  },
];

async function fixDescriptionAccuracy5() {
  console.log("Correcting Nissan CVT reliability claims...");

  let updated = 0;
  let notFound = 0;

  for (const correction of corrections) {
    const result = await db
      .update(vehicleModelDescriptions)
      .set({ reliabilityIssues: correction.reliabilityIssues })
      .where(
        and(
          eq(vehicleModelDescriptions.make, correction.make),
          eq(vehicleModelDescriptions.model, correction.model),
        ),
      )
      .returning({ id: vehicleModelDescriptions.id });

    if (result.length === 0) {
      console.warn(`✗ No row found for ${correction.make} ${correction.model}`);
      notFound++;
    } else {
      console.log(`✓ Updated ${correction.make} ${correction.model}`);
      updated++;
    }
  }

  console.log(`\n✓ Updated ${updated} descriptions, ${notFound} not found`);
}

fixDescriptionAccuracy5()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
