import { db } from "./client";
import { vehicleModelDescriptions } from "./schema";
import { and, eq } from "drizzle-orm";

const corrections: { make: string; model: string; reliabilityIssues: string }[] = [
  {
    make: "BMW",
    model: "3 Series",
    reliabilityIssues:
      "Diesel variants (e.g. 320d, 2007-2014) built on the N47 engine have a well-known timing chain that can stretch or snap, typically between 60,000-120,000 miles — BMW revised the crankshaft sprocket in late 2011 but never issued a full recall. Petrol models are prone to plastic cooling system component failures (water pump, thermostat) and valve cover leaks instead.",
  },
  {
    make: "BMW",
    model: "X1",
    reliabilityIssues:
      "Diesel variants (18d/20d/23d, 2009-2014, E84) use the N47 engine, which has a well-documented timing chain that can stretch or snap between 60,000-120,000 miles — no full recall was issued, only a revised crankshaft sprocket from late 2011. Petrol models are more prone to cooling system component failures.",
  },
  {
    make: "BMW",
    model: "X3",
    reliabilityIssues:
      "Diesel variants (18d/20d, 2011-2014, F25) use the N47 engine, which has a well-documented timing chain that can stretch or snap between 60,000-120,000 miles. Petrol models are more prone to plastic cooling system component failures (water pump, thermostat) and electrical gremlins.",
  },
  {
    make: "Ford",
    model: "Ranger",
    reliabilityIssues:
      "PX-series (2011-2022) 6R80 six-speed automatic has a documented torque converter shudder issue, especially under load — this is a conventional torque-converter auto, not the troubled dual-clutch PowerShift used in Ford's smaller cars. 3.2L diesel is generally durable; check for oil leaks and rear diff bearing noise on higher-mileage examples.",
  },
  {
    make: "Ford",
    model: "Everest",
    reliabilityIssues:
      "Shares the Ranger's 6R80 six-speed automatic, which has a documented torque converter shudder issue under load. 3.2L/2.0L diesel engines are generally durable with regular servicing. Check for oil leaks on higher-mileage examples.",
  },
  {
    make: "Volkswagen",
    model: "Tiguan",
    reliabilityIssues:
      "2008-2013 2.0 TSI/TFSI models (shared with Audi Q3/Q5 of the same era) have a documented plastic timing chain tensioner that wears and causes a cold-start rattle — left unaddressed it can lead to valve damage. DSG-equipped Allspace/7-seat models can show mechatronic judder from around 60,000km.",
  },
  {
    make: "Volkswagen",
    model: "Touareg",
    reliabilityIssues:
      "First and second generation (2002-2018) share Audi Q7's 3.0 TDI V6, which can develop injector, EGR, and timing chain wear at higher mileage. AdBlue system issues possible on later Euro 6 diesels. Regular maintenance critical given repair complexity and cost.",
  },
  {
    make: "Volkswagen",
    model: "Amarok",
    reliabilityIssues:
      "Diesel engines can develop timing chain and tensioner wear over time, plus turbo wear from sustained towing or heavy loads — have both checked on higher-mileage examples. Otherwise robust German engineering; service costs higher than Japanese/Korean utes.",
  },
  {
    make: "Skoda",
    model: "Kodiaq",
    reliabilityIssues:
      "Shares VW Tiguan Allspace mechanicals — the 7-speed DQ381 DSG automatic (2.0 TDI 200PS models) has reported judder and delayed shifts from around 60,000km. 2.0 TSI petrol can show the timing chain tensioner wear common to this VW Group engine family. Regular maintenance important.",
  },
  {
    make: "Peugeot",
    model: "3008",
    reliabilityIssues:
      "1.6 THP petrol (developed jointly with BMW/Mini) has a well-documented timing chain stretch/tensioner problem causing cold-start rattle — Peugeot revised the design four times trying to fix it. The BSI electrical control module can also develop random faults, often triggered by a weak battery or damp. Carbon buildup on intake valves is common too.",
  },
];

async function fixDescriptionAccuracy3() {
  console.log("Replacing more generic reliability boilerplate with specific, verified detail...");

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

fixDescriptionAccuracy3()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
