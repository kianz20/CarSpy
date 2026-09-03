import { db } from "./client";
import { vehicleModelDescriptions } from "./schema";
import { and, eq } from "drizzle-orm";

// The 2.2L Skyactiv-D diesel (offered in CX-5, Mazda3, Mazda6/Atenza and CX-8)
// is a distinct, well-documented problem engine — separate from the 2.5L
// Skyactiv-G Turbo petrol oil-consumption issue added in
// fixDescriptionAccuracy6.ts. Models offered with both engines get both notes.
const corrections: { make: string; model: string; reliabilityIssues: string }[] = [
  {
    make: "Mazda",
    model: "CX-5",
    reliabilityIssues:
      "2.2L Skyactiv-D diesel (common in NZ) has a well-documented soft camshaft fault in early production that can damage the vacuum pump/turbo, plus DPF/EGR carbon buildup and oil dilution if driven mostly short trips — needs regular extra-urban running. Separately, 2021 2.5L Skyactiv-G Turbo petrol models had an exhaust valve seal fault causing low-oil warnings (Mazda later revised the seal). Check which engine and generation before buying.",
  },
  {
    make: "Mazda",
    model: "3",
    reliabilityIssues:
      "2014-2018 models offered with the 2.2L Skyactiv-D diesel share the well-documented soft camshaft fault (can damage vacuum pump/turbo) plus DPF/EGR carbon buildup on short trips. Separately, 2021-2022 2.5L Skyactiv-G Turbo petrol models had an exhaust valve seal fault causing low-oil warnings (later revised). Non-turbo petrol models avoid both issues and are generally reliable.",
  },
  {
    make: "Mazda",
    model: "Mazda3",
    reliabilityIssues:
      "2014-2018 models offered with the 2.2L Skyactiv-D diesel share the well-documented soft camshaft fault (can damage vacuum pump/turbo) plus DPF/EGR carbon buildup on short trips. Separately, 2021-2022 2.5L Skyactiv-G Turbo petrol models had an exhaust valve seal fault causing low-oil warnings (later revised). Non-turbo petrol models avoid both issues and are generally reliable.",
  },
  {
    make: "Mazda",
    model: "6",
    reliabilityIssues:
      "Models with the 2.2L Skyactiv-D diesel share the well-documented soft camshaft fault (can damage vacuum pump/turbo) plus DPF/EGR carbon buildup on short trips. Separately, 2021 2.5L Skyactiv-G Turbo petrol models had an exhaust valve seal fault causing low-oil warnings (later revised). Non-turbo petrol models generally reliable.",
  },
  {
    make: "Mazda",
    model: "Atenza",
    reliabilityIssues:
      "Models with the 2.2L Skyactiv-D diesel share the well-documented soft camshaft fault (can damage vacuum pump/turbo) plus DPF/EGR carbon buildup on short trips. Non-turbo petrol models avoid this and are generally reliable.",
  },
  {
    make: "Mazda",
    model: "CX-8",
    reliabilityIssues:
      "Predominantly sold in NZ with the 2.2L Skyactiv-D diesel, which has a well-documented soft camshaft fault in early production (can damage vacuum pump/turbo) plus DPF/EGR carbon buildup if driven mostly short trips — needs regular extra-urban running. Turbo petrol variants (where fitted) generally more reliable.",
  },
];

async function fixDescriptionAccuracy8() {
  console.log("Adding Mazda 2.2 Skyactiv-D diesel issues alongside the turbo-petrol notes...");

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

fixDescriptionAccuracy8()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
