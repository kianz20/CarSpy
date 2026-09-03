import { db } from "./client";
import { vehicleModelDescriptions } from "./schema";
import { and, eq } from "drizzle-orm";

// Replaces generic "electrical faults, transmission problems" boilerplate
// with the actual documented failure points for each engine/transmission
// family, based on fact-checked research.
const corrections: { make: string; model: string; reliabilityIssues: string }[] = [
  // --- Audi: EA888 2.0 TFSI timing chain tensioner (2008-2012 Gen1, cold-start
  // rattle, can cause valve/piston damage if ignored) is the headline issue
  // across this era of Audi's small/mid petrol range. Diesel V6s get their own note.
  {
    make: "Audi",
    model: "A1",
    reliabilityIssues:
      "Pre-2015 1.4 TFSI models share VW's EA111 timing chain tensioner weakness — listen for a rattle on cold start, which signals tensioner wear. Otherwise generally reliable. Service costs higher than mainstream.",
  },
  {
    make: "Audi",
    model: "A3",
    reliabilityIssues:
      "2.0 TFSI models from roughly 2008-2012 (Gen1/2 EA888 engine) are prone to timing chain tensioner wear causing a cold-start rattle — left unaddressed it can lead to valve damage. S-tronic (DSG) mechatronic unit is another repair cost to budget for. Later engines resolved this.",
  },
  {
    make: "Audi",
    model: "A4",
    reliabilityIssues:
      "B8-generation (2008-2012) 2.0 TFSI models are known for timing chain tensioner wear (EA888 Gen1) causing a cold-start rattle — have this checked, as ignoring it risks valve damage. Later revisions fixed the design. Regular servicing critical.",
  },
  {
    make: "Audi",
    model: "A5",
    reliabilityIssues:
      "2008-2012 2.0 TFSI models carry the same EA888 Gen1 timing chain tensioner weakness as the A4 of that era — cold-start rattle is the warning sign. Later engines revised the tensioner design. Regular servicing critical.",
  },
  {
    make: "Audi",
    model: "A6",
    reliabilityIssues:
      "3.0 TDI V6 models can suffer timing chain and injector wear at high mileage, plus EGR/AdBlue system faults on later Euro 6 diesels. Regular servicing and full history are important given the complexity of these systems.",
  },
  {
    make: "Audi",
    model: "Q3",
    reliabilityIssues:
      "First-generation (2011-2018) 2.0 TFSI models can suffer the EA888 timing chain tensioner rattle common to this era of VW Group engine. Diesel variants generally more durable. Regular servicing important.",
  },
  {
    make: "Audi",
    model: "Q5",
    reliabilityIssues:
      "First-generation (2009-2017) 2.0 TFSI models are affected by the EA888 Gen1 timing chain tensioner issue — cold-start rattle is the tell. 3.0 TDI models are generally more durable but watch for injector and EGR wear.",
  },
  {
    make: "Audi",
    model: "Q7",
    reliabilityIssues:
      "First-generation (2006-2015) 3.0 TDI V6 is the common engine and can develop injector, EGR, and timing chain wear at higher mileage. AdBlue system issues possible on later Euro 6 units. Regular maintenance critical given repair complexity.",
  },
  {
    make: "Audi",
    model: "TT",
    reliabilityIssues:
      "Mk2 (2006-2014) 2.0 TFSI models share the EA888 Gen1 timing chain tensioner weakness — cold-start rattle signals wear that can lead to valve damage if ignored. DSG models add mechatronic unit as a service item.",
  },

  // --- Mercedes-Benz: front-drive A/CLA/GLA (2013+) share the Getrag 7G-DCT
  // dual-clutch, which has documented clutch/mechatronic failures; M270/M274
  // 4-cyl petrol engines across the range share a timing chain/tone-ring fault.
  {
    make: "Mercedes-Benz",
    model: "A",
    reliabilityIssues:
      "7G-DCT dual-clutch automatic (2013-2018 W176) has documented clutch wear and mechatronic unit failures, often from 70,000km — sensitive to correct oil level. M270 petrol engines can develop a timing chain rattle/tone-ring fault at higher mileage.",
  },
  {
    make: "Mercedes-Benz",
    model: "CLA",
    reliabilityIssues:
      "Shares the A-Class's 7G-DCT dual-clutch automatic, which has documented clutch wear and mechatronic unit failures from around 70,000km. M270 petrol engines can develop a timing chain rattle/tone-ring fault at higher mileage.",
  },
  {
    make: "Mercedes-Benz",
    model: "GLA",
    reliabilityIssues:
      "Shares the A-Class's 7G-DCT dual-clutch automatic, which has documented clutch wear and mechatronic unit failures from around 70,000km. M270/M274 petrol engines can develop a timing chain rattle/tone-ring fault at higher mileage.",
  },
  {
    make: "Mercedes-Benz",
    model: "C",
    reliabilityIssues:
      "M274 petrol engines (2014+) can develop a timing chain rattle from a worn camshaft tone ring, usually by 80,000-100,000 miles. Conventional 7G-Tronic torque-converter auto (not DCT) is comparatively robust. Parts and labor costs are high regardless.",
  },
  {
    make: "Mercedes-Benz",
    model: "C-Class",
    reliabilityIssues:
      "M274 petrol engines (2014+) can develop a timing chain rattle from a worn camshaft tone ring, usually by 80,000-100,000 miles. Conventional 7G-Tronic torque-converter auto (not DCT) is comparatively robust. Parts and labor costs are high regardless.",
  },
  {
    make: "Mercedes-Benz",
    model: "E",
    reliabilityIssues:
      "M270/M274 petrol engines can develop a timing chain rattle from a worn camshaft tone ring at higher mileage. AIRMATIC air suspension (where fitted) is a common and costly failure point — check for warning lights and ride height sagging.",
  },
  {
    make: "Mercedes-Benz",
    model: "GLC",
    reliabilityIssues:
      "M274 petrol engines can develop a timing chain rattle from a worn camshaft tone ring at higher mileage. 9G-Tronic conventional automatic is generally robust. AIRMATIC air suspension, where fitted, is a costly failure point to check.",
  },
  {
    make: "Mercedes-Benz",
    model: "GLE",
    reliabilityIssues:
      "AIRMATIC air suspension is a common and expensive failure point on this model — check for ride height sagging or warning lights. M276/M274 petrol engines can develop timing chain rattle at higher mileage. Regular maintenance critical.",
  },

  // --- Mini: N12/N14 "Prince" engine plastic timing chain guides are a
  // well-documented, litigated defect.
  {
    make: "Mini",
    model: "Cooper",
    reliabilityIssues:
      "2007-2010 models (N12/N14 engine) have a well-documented plastic timing chain guide defect causing a cold-start \"death rattle\" — failures reported from as low as 15,000 miles, and BMW issued a TSB but never a recall. Have the timing chain checked before buying; later engines revised the design.",
  },
  {
    make: "Mini",
    model: "Clubman",
    reliabilityIssues:
      "Early models (2008-2010, N12/N14 engine) share the well-documented plastic timing chain guide defect causing a cold-start \"death rattle\" — have this checked before buying. Later engines revised the design. Parts and labor are more expensive than mainstream brands.",
  },
  {
    make: "Mini",
    model: "Countryman",
    reliabilityIssues:
      "Early models (from 2010, N16/N18 engine) are less prone to the original N14 timing chain defect but can still show chain wear at high mileage — have it checked. Parts and labor are more expensive than mainstream brands.",
  },

  // --- Land Rover / Jaguar: air suspension and electrical faults are the
  // headline, consistently-surveyed issues (WhatCar/Consumer Reports place
  // JLR near the bottom of reliability rankings).
  {
    make: "Land Rover",
    model: "Range Rover",
    reliabilityIssues:
      "Air suspension is the standout weak point — leaking air springs, failing height sensors, and compressor failures are all common and can leave the vehicle sitting low or refusing to rise. Electrical faults (infotainment, sensors) are also frequent. Full service history and a pre-purchase inspection are essential.",
  },
  {
    make: "Land Rover",
    model: "Range",
    reliabilityIssues:
      "Air suspension is the standout weak point — leaking air springs, failing height sensors, and compressor failures are all common and can leave the vehicle sitting low or refusing to rise. Electrical faults (infotainment, sensors) are also frequent. Full service history and a pre-purchase inspection are essential.",
  },
  {
    make: "Land Rover",
    model: "Discovery",
    reliabilityIssues:
      "Air suspension leaks and compressor failures are common and costly. Diesel models can develop injector and EGR issues at higher mileage. Electrical faults (climate control, infotainment) are frequently reported. Specialist service and full history essential.",
  },
  {
    make: "Jaguar",
    model: "F-Pace",
    reliabilityIssues:
      "Ingenium diesel engines (2016+) have had reported timing chain and EGR issues in early production years. Electrical faults — particularly infotainment/touchscreen glitches — are commonly reported across the range. Full service history is critical.",
  },

  // --- Porsche: PDK's mechanical gearset is robust; failures are almost
  // always the mechatronic control unit, and both SUVs share VW-Group-style
  // plastic coolant pipes that crack with age.
  {
    make: "Porsche",
    model: "Cayenne",
    reliabilityIssues:
      "Plastic coolant pipes (especially on V8 models) become brittle with age/heat and crack, causing sudden coolant loss — a very common and well-known issue on older Cayennes. PDK's mechanical gearset is robust; failures that do occur are almost always the mechatronic control unit, not the gears/clutches themselves.",
  },
  {
    make: "Porsche",
    model: "Macan",
    reliabilityIssues:
      "Plastic coolant pipes and expansion tanks can crack with age, especially past 60,000 miles, causing coolant loss and overheating warnings. PDK's mechanical gearset is robust; the mechatronic control unit is the actual failure point when transmission issues occur.",
  },
];

async function fixDescriptionAccuracy2() {
  console.log("Replacing generic reliability boilerplate with specific, verified detail...");

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

fixDescriptionAccuracy2()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
