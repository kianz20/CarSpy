import { db } from "./client";
import { vehicleModelDescriptions } from "./schema";
import { and, eq } from "drizzle-orm";

// The Theta II 2.4L engine bearing-failure saga is one of the largest and
// best-documented reliability issues in the industry (multi-million vehicle
// recall, $200m+ in NHTSA penalties) — replacing vague "some older units had
// engine issues" boilerplate with the actual facts is a significant accuracy
// improvement for these models.
const corrections: { make: string; model: string; reliabilityIssues: string }[] = [
  {
    make: "Hyundai",
    model: "Santa Fe",
    reliabilityIssues:
      "2010-2013 models with the 2.4L Theta II engine were subject to a major recall for connecting rod bearing failure caused by manufacturing debris blocking oil flow — can lead to engine seizure. Check recall completion status on any 2010-2013 example. Later/newer engines unaffected and warranty coverage is strong.",
  },
  {
    make: "Hyundai",
    model: "Santa",
    reliabilityIssues:
      "2010-2013 models with the 2.4L Theta II engine were subject to a major recall for connecting rod bearing failure caused by manufacturing debris blocking oil flow — can lead to engine seizure. Check recall completion status on any 2010-2013 example. Later/newer engines unaffected and warranty coverage is strong.",
  },
  {
    make: "Hyundai",
    model: "Tucson",
    reliabilityIssues:
      "2010-2013 models with the 2.4L Theta II engine were subject to a major recall for connecting rod bearing failure caused by manufacturing debris blocking oil flow — can lead to engine seizure. Check recall completion status on these years. Newer models (post-2015) are much improved with strong warranty coverage.",
  },
  {
    make: "Kia",
    model: "Sportage",
    reliabilityIssues:
      "2011-2013 models with the 2.4L Theta II engine were subject to a major recall for connecting rod bearing failure caused by manufacturing debris blocking oil flow — can lead to engine seizure. Check recall completion status on these years. Newer models are much improved with strong warranty coverage.",
  },
  {
    make: "Kia",
    model: "Sorento",
    reliabilityIssues:
      "2012-2014 models with the 2.4L Theta II engine were subject to a major recall for connecting rod bearing failure caused by manufacturing debris blocking oil flow — can lead to engine seizure. Check recall completion status on these years. Newer models are much improved with strong warranty coverage.",
  },
  {
    make: "MG",
    model: "HS",
    reliabilityIssues:
      "Automatic (DCT) models have documented jerky, hesitant low-speed pull-away — most noticeable in stop-start traffic. MG has issued ECU recalibrations that help but don't fully resolve it. Otherwise a newer brand in NZ with limited long-term data; warranty coverage is the main reassurance.",
  },
];

async function fixDescriptionAccuracy4() {
  console.log("Correcting Theta II / MG DCT reliability claims...");

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

fixDescriptionAccuracy4()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
