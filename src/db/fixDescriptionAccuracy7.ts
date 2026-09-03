import { db } from "./client";
import { vehicleModelDescriptions } from "./schema";
import { and, eq } from "drizzle-orm";

const corrections: { make: string; model: string; reliabilityIssues: string }[] = [
  {
    make: "Nissan",
    model: "Navara",
    reliabilityIssues:
      "Older D22/D40 generations with the YD25 engine have documented injector issues causing black smoke, poor economy, and rough idling. All common-rail diesel generations can suffer EGR carbon buildup leading to DPF regeneration problems if not addressed early. Check for oil leaks and rear diff bearing noise too.",
  },
  {
    make: "Isuzu",
    model: "D-Max",
    reliabilityIssues:
      "Turbo diesels are generally very durable, but like most modern common-rail diesel utes can suffer EGR carbon buildup leading to DPF regeneration problems if not addressed early. Check transmission oil and diff condition. Later models have fewer issues overall.",
  },
  {
    make: "Mitsubishi",
    model: "Triton",
    reliabilityIssues:
      "4N15 diesel engines have documented injector issues (often triggered by frequent DPF regenerations) and EGR carbon buildup that can lead to repeat DPF problems if not addressed early. Check transmission oil and diff condition. Later models improved.",
  },
  {
    make: "Mazda",
    model: "BT-50",
    reliabilityIssues:
      "Diesel engines (shared with Ford Ranger on newer generations) are generally robust, but like most modern common-rail diesel utes can suffer EGR carbon buildup leading to DPF regeneration problems if not addressed early. Check transmission oil and diff condition.",
  },
];

async function fixDescriptionAccuracy7() {
  console.log("Correcting ute diesel reliability claims...");

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

fixDescriptionAccuracy7()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
