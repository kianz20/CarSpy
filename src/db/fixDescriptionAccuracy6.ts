import { db } from "./client";
import { vehicleModelDescriptions } from "./schema";
import { and, eq } from "drizzle-orm";

const corrections: { make: string; model: string; reliabilityIssues: string }[] = [
  {
    make: "Toyota",
    model: "Prado",
    reliabilityIssues:
      "2009-2014 (150-series) 3.0L 1KD-FTV diesel has a documented piston cracking issue, typically appearing 100,000-150,000km. 2015-2020 2.8L 1GD-FTV models were subject to a class action over dust ingress corrupting the mass air flow sensor and cutting engine power/traction control. Check recall/repair history for the relevant generation.",
  },
  {
    make: "Toyota",
    model: "Hilux",
    reliabilityIssues:
      "Older (pre-2015) 3.0L 1KD-FTV diesels have a documented piston cracking issue, typically appearing 100,000-150,000km. 2015-2020 2.8L 1GD-FTV models were subject to a class action over dust ingress corrupting the mass air flow sensor and cutting engine power/traction control. Petrol models avoid both issues.",
  },
  {
    make: "Mazda",
    model: "CX-5",
    reliabilityIssues:
      "2021 models with the 2.5L Skyactiv-G Turbo had a documented oil consumption issue from damaged exhaust valve seals, triggering low-oil warnings around 3,000-5,000 miles — Mazda later revised the seal design. 2018-2019 models had a separate fuel pump impeller recall. Otherwise generally reliable.",
  },
  {
    make: "Mazda",
    model: "CX-9",
    reliabilityIssues:
      "2021 models with the 2.5L Skyactiv-G Turbo had a documented oil consumption issue from damaged exhaust valve seals, triggering low-oil warnings around 3,000-5,000 miles — Mazda later revised the seal design. 2018-2019 models had a separate fuel pump impeller recall. Otherwise generally reliable.",
  },
  {
    make: "Mazda",
    model: "3",
    reliabilityIssues:
      "2021-2022 models with the 2.5L Skyactiv-G Turbo had a documented oil consumption issue from damaged exhaust valve seals, triggering low-oil warnings around 3,000-5,000 miles — Mazda later revised the seal design. Non-turbo models unaffected and generally reliable.",
  },
  {
    make: "Mazda",
    model: "Mazda3",
    reliabilityIssues:
      "2021-2022 models with the 2.5L Skyactiv-G Turbo had a documented oil consumption issue from damaged exhaust valve seals, triggering low-oil warnings around 3,000-5,000 miles — Mazda later revised the seal design. Non-turbo models unaffected and generally reliable.",
  },
  {
    make: "Mazda",
    model: "CX-30",
    reliabilityIssues:
      "2021-2022 models with the 2.5L Skyactiv-G Turbo had a documented oil consumption issue from damaged exhaust valve seals, triggering low-oil warnings around 3,000-5,000 miles — Mazda later revised the seal design. Non-turbo models unaffected and generally reliable.",
  },
];

async function fixDescriptionAccuracy6() {
  console.log("Correcting Toyota diesel and Mazda turbo engine reliability claims...");

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

fixDescriptionAccuracy6()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
