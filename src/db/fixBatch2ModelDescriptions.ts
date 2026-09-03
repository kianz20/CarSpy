import { db } from "./client";
import { vehicleModelDescriptions } from "./schema";
import { and, eq } from "drizzle-orm";

const correctionsNeeded = [
  {
    make: "Jaguar",
    model: "E-Pace",
    description:
      "Compact luxury SUV with performance styling and modern design. Spacious interior with advanced technology.",
    reliabilityIssues:
      "Known reliability issues: transmission problems, electrical faults, engine issues. Poor reliability record for this model.",
    notes: "Luxury brand maintenance costs high. Full service history critical. Consider alternative compact luxury SUVs.",
  },
  {
    make: "Jaguar",
    model: "XF",
    description:
      "Luxury mid-size sedan with performance and contemporary design. Spacious and stylish with advanced features.",
    reliabilityIssues:
      "Mixed reliability: transmission issues common, electrical gremlins reported, some engine problems. Can be expensive to repair.",
    notes: "Luxury sedan with premium features. Service costs higher than mainstream. Full history important.",
  },
  {
    make: "Jaguar",
    model: "XE",
    description:
      "Luxury compact sedan with performance styling and modern technology. Quality interior and engaging driving.",
    reliabilityIssues:
      "Mixed reliability: transmission and electrical issues reported, some suspension concerns. Service costs premium.",
    notes: "Luxury sedan requiring specialist service. Full service history critical. Premium maintenance costs.",
  },
  {
    make: "Audi",
    model: "TT",
    description:
      "Premium compact sports car with distinctive design and performance orientation. Fun driving dynamics with quality interior.",
    reliabilityIssues:
      "Mixed reliability: some transmission issues, potential cooling system problems, electrical concerns. Service costs high.",
    notes: "Performance sports car. Service costs significantly higher than mainstream. Full history important.",
  },
  {
    make: "Mercedes-Benz",
    model: "GLC",
    description:
      "Premium mid-size SUV with luxury features and contemporary design. Spacious interior with advanced technology.",
    reliabilityIssues:
      "Mixed reliability: some transmission issues reported, electrical faults possible, varying quality across model years. Newer versions improved.",
    notes: "Premium SUV with luxury features. Service costs high. Full history important. Check specific model year.",
  },
  {
    make: "Mercedes-Benz",
    model: "GLA",
    description:
      "Compact luxury SUV with contemporary design and premium features. Practical crossover with quality interior.",
    reliabilityIssues:
      "Mixed reliability: DCT transmission issues reported in some years, electrical faults possible. Requires regular servicing.",
    notes: "Premium compact SUV. Service costs higher than mainstream. Full service history important.",
  },
  {
    make: "Nissan",
    model: "Teana",
    description:
      "Mid-size luxury sedan with comfortable ride and modern features. Practical family vehicle imported from Japan.",
    reliabilityIssues:
      "Mixed reliability: CVT transmission can be problematic, engine issues reported, electrical concerns. Check transmission condition carefully.",
    notes: "Comfortable luxury sedan. CVT requires attention. Parts availability through specialists. Regular maintenance critical.",
  },
  {
    make: "Nissan",
    model: "Pathfinder",
    description:
      "Mid-size SUV with good space and off-road capability. Practical family vehicle with decent power.",
    reliabilityIssues:
      "Major CVT transmission issues: premature failures common, expensive repairs ($3-5k). Thoroughly inspect transmission before purchase.",
    notes: "Good mid-size family SUV. CRITICAL: Check CVT condition carefully. Many premature failures reported.",
  },
  {
    make: "Holden",
    model: "Cruze",
    description:
      "Australian compact sedan with practical layout and decent fuel economy. Good value family car from Australian engineering.",
    reliabilityIssues:
      "Mixed reliability: some transmission issues reported, check for electrical concerns and mechanical wear. Quality varies.",
    notes: "Australian-built compact sedan. Check service history carefully. Transmission condition important.",
  },
  {
    make: "Holden",
    model: "Trax",
    description:
      "Australian compact SUV with practical layout and decent ground clearance. Good value family vehicle.",
    reliabilityIssues:
      "Mixed reliability: transmission issues reported in some units, check for electrical issues. Build quality variable.",
    notes: "Australian-built compact SUV. Check service history carefully. Transmission condition important.",
  },
  {
    make: "Holden",
    model: "Trailblazer",
    description:
      "Australian large SUV with practical layout and good towing capacity. Spacious family vehicle.",
    reliabilityIssues:
      "Mixed reliability: transmission issues possible, check for electrical concerns and general wear. Quality varies by year.",
    notes: "Australian-built large SUV. Check service history carefully. Pre-purchase inspection recommended.",
  },
  {
    make: "SsangYong",
    model: "Korando",
    description:
      "Compact SUV with practical layout and decent ground clearance. Good value budget SUV option.",
    reliabilityIssues:
      "Relatively new brand so long-term reliability uncertain. Mixed early reports. Build quality variable. Regular maintenance critical.",
    notes: "Budget-friendly option but reliability unproven. Warranty period important to check. Service network limited.",
  },
  {
    make: "Ford",
    model: "Puma",
    description:
      "Compact performance SUV with modern styling and decent features. Fun driving dynamics for the segment.",
    reliabilityIssues:
      "Mixed reliability: some transmission issues reported in certain years, engine concerns possible. Regular maintenance important.",
    notes: "Fun-to-drive compact SUV. Check transmission smooth operation. Pre-purchase inspection recommended.",
  },
  {
    make: "Volkswagen",
    model: "Passat",
    description:
      "Mid-size European sedan with quality engineering and practical design. Good balance of comfort and performance.",
    reliabilityIssues:
      "Generally reliable but mixed reports on DSG transmission in some years. Service costs higher than Asian brands. Regular maintenance critical.",
    notes: "European quality build. Service costs moderate but higher than Asian. Check transmission type and condition.",
  },
  {
    make: "Ford",
    model: "Mondeo",
    description:
      "Mid-size sedan with practical layout and decent performance. European engineering with modern features.",
    reliabilityIssues:
      "Mixed reliability: transmission issues reported in some years, some engine concerns. Check for electrical problems.",
    notes: "Practical family sedan. Check transmission smooth operation. Pre-purchase inspection recommended.",
  },
];

async function fixBatch2Descriptions() {
  console.log("Correcting batch 2 vehicle model descriptions with better research...");

  let updated = 0;
  let errors = 0;

  for (const correction of correctionsNeeded) {
    try {
      // Delete old entry
      await db
        .delete(vehicleModelDescriptions)
        .where(
          and(
            eq(vehicleModelDescriptions.make, correction.make),
            eq(vehicleModelDescriptions.model, correction.model),
          ),
        );

      // Insert corrected entry
      await db.insert(vehicleModelDescriptions).values({
        make: correction.make,
        model: correction.model,
        description: correction.description,
        reliabilityIssues: correction.reliabilityIssues,
        notes: correction.notes,
      });

      console.log(`✓ Fixed ${correction.make} ${correction.model}`);
      updated++;
    } catch (e) {
      console.error(`✗ Error fixing ${correction.make} ${correction.model}:`, e);
      errors++;
    }
  }

  console.log(`\n✓ Fixed ${updated} descriptions, ${errors} errors`);
}

fixBatch2Descriptions()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
