import { db } from "./client";
import { vehicleModelDescriptions } from "./schema";
import { and, eq } from "drizzle-orm";

// Corrections found by fact-checking seedBatch2ModelDescriptions.ts,
// seedAdditionalModelDescriptions.ts, and fixBatch2ModelDescriptions.ts
// against real-world reliability data.
const corrections = [
  {
    // Honda's documented piston-ring/oil-consumption issue centers on
    // 2010-11 CR-Vs (Honda extended piston/ring warranty to 8yr/125,000mi
    // for those model years via TSB), not 2007-2012 broadly.
    make: "Honda",
    model: "CR-V",
    reliabilityIssues:
      "Excellent reliability record overall. 2010-2011 models had a documented piston ring issue causing excessive oil consumption — Honda extended warranty coverage to 8 years/125,000 miles for affected units. Otherwise very dependable.",
  },
  {
    make: "Honda",
    model: "CRV",
    reliabilityIssues:
      "Excellent reliability record overall. 2010-2011 models had a documented piston ring issue causing excessive oil consumption — Honda extended warranty coverage to 8 years/125,000 miles for affected units. Otherwise very dependable.",
  },
  {
    // 2009-2012 RAV4 (XA30) used a conventional automatic transmission
    // (2AR-FE / 4-speed), not a CVT — Toyota didn't fit CVTs to RAV4
    // until the 2019+ (XA50) generation.
    make: "Toyota",
    model: "RAV4",
    reliabilityIssues:
      "Very reliable overall. Uses a conventional automatic transmission (not CVT) through to the 2018 model — later generations introduced CVT. Check rear diff/AWD coupling condition on higher-mileage examples.",
  },
  {
    // No well-documented "oil sludge" issue for the Swift; the actual
    // known problem is timing chain stretch/wear on the 1.3L/1.4L engines
    // causing rattling and oil consumption, especially past 100,000km.
    make: "Suzuki",
    model: "Swift",
    reliabilityIssues:
      "Generally reliable. 1.3L/1.4L engines can develop timing chain stretch/wear past 100,000km, causing cold-start rattle and increased oil consumption — check for this on inspection. CVT transmission may need attention.",
  },
];

async function fixDescriptionAccuracy() {
  console.log("Correcting factual inaccuracies in vehicle model descriptions...");

  let updated = 0;

  for (const correction of corrections) {
    const result = await db
      .update(vehicleModelDescriptions)
      .set({ reliabilityIssues: correction.reliabilityIssues })
      .where(
        and(
          eq(vehicleModelDescriptions.make, correction.make),
          eq(vehicleModelDescriptions.model, correction.model),
        ),
      );

    console.log(`✓ Updated ${correction.make} ${correction.model}`);
    updated++;
  }

  console.log(`\n✓ Updated ${updated} descriptions`);
}

fixDescriptionAccuracy()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
