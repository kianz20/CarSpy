import { db } from "./client";
import { vehicleModelDescriptions } from "./schema";

const batch2ModelDescriptions = [
  {
    make: "LDV",
    model: "T60",
    description:
      "Chinese compact pickup truck offering good value and practical work capability. Spacious cab and decent towing capacity. Affordable work vehicle.",
    reliabilityIssues:
      "Newer brand to NZ market so long-term data limited. Early reports acceptable. Regular maintenance important. Parts availability still developing.",
    notes: "Budget-friendly work ute. Modern features. Good towing capacity. Warranty period varies by dealer.",
  },
  {
    make: "Audi",
    model: "A5",
    description:
      "Premium compact coupe/sedan with sporty styling and sophisticated design. Quality interior and strong performance. German luxury appeal.",
    reliabilityIssues:
      "Generally reliable but service costs high. Common issues: electrical faults, transmission problems, suspension wear. Regular servicing critical.",
    notes: "Premium coupe with luxury features. Service costs higher than mainstream. Full history important. Quality build throughout.",
  },
  {
    make: "Mercedes-Benz",
    model: "GLA",
    description:
      "Compact luxury SUV with contemporary design and premium features. Practical crossover with quality interior. Entry-level Mercedes SUV.",
    reliabilityIssues:
      "Generally reliable but service costs high. Common issues: electrical faults, transmission problems. Regular servicing important.",
    notes: "Premium compact SUV. Service costs higher than mainstream. Full service history important. Quality build.",
  },
  {
    make: "BMW",
    model: "116i",
    description:
      "Compact luxury hatchback with engaging driving dynamics and quality features. Fun to drive with premium interior. Entry-level BMW.",
    reliabilityIssues:
      "Can have expensive repairs. Common issues: cooling system failures, electrical gremlins. High maintenance costs.",
    notes: "Luxury compact with premium features. Parts and labor are expensive. Full service history important.",
  },
  {
    make: "Porsche",
    model: "Macan",
    description:
      "Performance luxury compact SUV with exceptional driving dynamics. Powerful engine options and advanced technology. High-performance family vehicle.",
    reliabilityIssues:
      "Generally reliable but expensive repairs. Common issues: transmission problems, suspension wear, electrical issues. Premium service costs.",
    notes: "Luxury performance with associated costs. Full service history essential. Specialist service critical. Premium parts.",
  },
  {
    make: "Nissan",
    model: "Fuga",
    description:
      "Upscale mid-size sedan imported from Japan. Premium features and smooth ride. Comfortable daily driver with good power.",
    reliabilityIssues:
      "Generally reliable but check CVT transmission condition. Engine typically solid. Parts availability through specialists.",
    notes: "Luxury sedan imported from Japan. Comfortable interior. Good fuel economy. Parts availability varies.",
  },
  {
    make: "BMW",
    model: "X3",
    description:
      "Premium compact SUV with luxury features and strong performance. Spacious interior and advanced technology. High-quality driving dynamics.",
    reliabilityIssues:
      "Expensive repairs possible. Common issues: cooling system failures, electrical gremlins, suspension wear. High maintenance costs.",
    notes: "Luxury features but parts and labor are expensive. Full service history important. Specialist service recommended.",
  },
  {
    make: "Toyota",
    model: "Voxy",
    description:
      "Compact 7-seater minivan with flexible seating and practical layout. Good fuel efficiency and modern features. Family-focused MPV.",
    reliabilityIssues:
      "Generally reliable. Regular maintenance important. Engine generally solid. Transmission fluid condition should be checked.",
    notes: "Practical family minivan. Good fuel economy. Flexible seating options. Space-efficient design.",
  },
  {
    make: "Audi",
    model: "A6",
    description:
      "Premium mid-size sedan with sophisticated design and advanced technology. Quality interior and smooth performance. German luxury at higher level.",
    reliabilityIssues:
      "Generally reliable but service costs high. Common issues: electrical faults, transmission problems, suspension wear. Regular servicing critical.",
    notes: "Premium sedan with luxury features. Service costs higher than mainstream. Full history important. Quality build.",
  },
  {
    make: "Holden",
    model: "Trax",
    description:
      "Australian compact SUV with practical layout and decent ground clearance. Good value family vehicle. Australian engineering.",
    reliabilityIssues:
      "Generally reliable. Some transmission issues reported. Check for electrical issues and wear. Regular maintenance important.",
    notes: "Australian-built compact SUV. Practical for families. Manual and automatic options. Good fuel economy.",
  },
  {
    make: "Audi",
    model: "Q3",
    description:
      "Premium compact SUV with quality interior and good driving dynamics. Practical crossover with luxury features. German engineering.",
    reliabilityIssues:
      "Generally reliable but service costs high. Common issues: electrical faults, transmission problems. Regular servicing important.",
    notes: "Premium compact SUV. Service costs higher than mainstream. Full history important. Quality build throughout.",
  },
  {
    make: "Daihatsu",
    model: "Hijet",
    description:
      "Compact commercial van/truck with practical design and good fuel economy. Versatile workhorse for small business. Affordable entry.",
    reliabilityIssues:
      "Generally reliable. Mechanical simplicity aids longevity. Engine typically durable. Regular maintenance important.",
    notes: "Practical compact commercial vehicle. Good fuel economy. Parts affordable. Workhorse reputation.",
  },
  {
    make: "Audi",
    model: "A1",
    description:
      "Premium compact hatchback with quality materials and engaging driving experience. Fun-to-drive character with luxury features. Entry-level Audi.",
    reliabilityIssues:
      "Generally reliable but service costs high. Common issues: electrical faults, transmission problems. Regular servicing critical.",
    notes: "Premium compact with luxury features. Service costs higher than mainstream. Quality build throughout.",
  },
  {
    make: "Nissan",
    model: "Pathfinder",
    description:
      "Mid-size SUV with good space and off-road capability. Practical family vehicle with decent power. American-influenced design.",
    reliabilityIssues:
      "Generally reliable. CVT transmission requires monitoring. Engine typically solid. Regular maintenance important.",
    notes: "Good mid-size family SUV. Practical interior. Available petrol options. Check transmission condition.",
  },
  {
    make: "Mitsubishi",
    model: "Pajero Sport",
    description:
      "Compact 7-seater SUV with off-road capability and practical layout. Fun driving experience with good value. Sporty variant.",
    reliabilityIssues:
      "Generally reliable. Diesel engines robust. Check transmission oil and diff condition. Regular servicing important.",
    notes: "Good value compact SUV. Sporty performance. Towing capability solid. Available petrol and diesel.",
  },
  {
    make: "Ford",
    model: "Puma",
    description:
      "Compact performance SUV with engaging driving dynamics and modern styling. Fun factor appeals to active drivers. European design.",
    reliabilityIssues:
      "Generally reliable. Some transmission issues reported in certain years. Engine typically solid. Regular maintenance important.",
    notes: "Fun-to-drive compact SUV. Modern features. Good fuel economy. Available AWD option.",
  },
  {
    make: "Honda",
    model: "CRV",
    description:
      "Compact crossover with spacious interior and reliable performance. One of the original crossovers. Great for families and active lifestyles.",
    reliabilityIssues:
      "Excellent reliability record. Some 2007-2012 models reported engine piston ring issues causing oil consumption. Generally very dependable.",
    notes: "Available FWD and AWD. Hybrid models offer good value. Spacious and practical.",
  },
  {
    make: "Kia",
    model: "Stonic",
    description:
      "Compact budget SUV with modern styling and practical features. Good value entry to SUV market. Growing reliability reputation.",
    reliabilityIssues:
      "Newer model with improving reliability. Warranty is major advantage. Regular maintenance recommended. Parts availability improving.",
    notes: "Good value compact SUV. Strong warranty coverage. Modern features. Available FWD and AWD.",
  },
  {
    make: "Mini",
    model: "Clubman",
    description:
      "Compact premium crossover with Mini's distinctive styling and fun character. Practical layout with modern features. Lifestyle choice.",
    reliabilityIssues:
      "Service costs can be high. Common issues: turbocharger problems, transmission issues, electrical gremlins. Parts more expensive.",
    notes: "Fun driving character. Stylish and distinctive. Parts and labor pricey. Extended warranty recommended.",
  },
  {
    make: "Jaguar",
    model: "E-Pace",
    description:
      "Luxury compact SUV with performance and sophisticated design. Spacious interior with advanced technology. Premium driving experience.",
    reliabilityIssues:
      "Generally reliable but service costs high. Common issues: electrical faults, transmission problems. Regular servicing important.",
    notes: "Luxury performance SUV. Service costs higher than mainstream. Full history important. Specialist service recommended.",
  },
  {
    make: "Ford",
    model: "Mondeo",
    description:
      "Mid-size sedan with practical layout and decent performance. European engineering with modern features. Good family car.",
    reliabilityIssues:
      "Generally reliable. Transmission issues possible in some years. Engine typically solid. Regular maintenance important.",
    notes: "Practical family sedan. Good fuel economy. Available petrol options. Parts availability good.",
  },
  {
    make: "Nissan",
    model: "Caravan",
    description:
      "Compact commercial van with spacious cargo area and practical design. Versatile workhorse for trades and small business.",
    reliabilityIssues:
      "Generally reliable. Engine typically durable. Check transmission condition. Mechanical simplicity aids longevity.",
    notes: "Practical work vehicle. Good fuel economy. Parts availability good. Workhorse reputation.",
  },
  {
    make: "Subaru",
    model: "Exiga",
    description:
      "Compact 7-seater wagon-MPV with standard all-wheel drive. Practical family vehicle with good ground clearance. Unique layout.",
    reliabilityIssues:
      "Good reliability overall. Head gasket concerns possible. Oil leaks can occur. Check service history carefully.",
    notes: "Standard all-wheel drive. Good ground clearance. Practical family vehicle. Good for NZ conditions.",
  },
  {
    make: "Mercedes-Benz",
    model: "GLC",
    description:
      "Premium mid-size SUV with luxury features and sophisticated design. Spacious interior and refined driving experience. High-quality materials.",
    reliabilityIssues:
      "Generally reliable but service costs high. Common issues: electrical faults, transmission problems. Regular servicing critical.",
    notes: "Premium SUV with luxury features. Service costs higher than mainstream. Full history important. Quality build.",
  },
  {
    make: "Toyota",
    model: "Auris",
    description:
      "Compact hatchback/sedan with reliable Toyota engineering and practical features. Good fuel economy and affordable operation.",
    reliabilityIssues:
      "Generally reliable. Hybrid option very dependable. Engine typically solid. Regular maintenance keeps these running well.",
    notes: "Good value compact car. Practical interior. Good fuel economy. Available hybrid option.",
  },
  {
    make: "Jaguar",
    model: "XF",
    description:
      "Luxury mid-size sedan with performance and sophisticated design. Spacious and comfortable with advanced technology. Premium driving experience.",
    reliabilityIssues:
      "Generally reliable but service costs high. Common issues: electrical faults, transmission problems. Regular servicing important.",
    notes: "Luxury sedan with premium features. Service costs higher than mainstream. Full history important. Quality build.",
  },
  {
    make: "Mitsubishi",
    model: "Mirage",
    description:
      "Affordable compact hatchback with excellent fuel economy. Practical size for city driving and urban commuting. Budget-friendly option.",
    reliabilityIssues:
      "Generally reliable. CVT transmission performs well. Engine typically sound. Regular maintenance keeps these running well.",
    notes: "Excellent value compact car. Good fuel economy. Parts affordable. Popular budget option.",
  },
  {
    make: "Toyota",
    model: "Avensis",
    description:
      "Mid-size sedan combining comfort and reliability. Spacious interior and practical design. Proven family car with good resale value.",
    reliabilityIssues:
      "Generally reliable. Engine typically solid. Regular maintenance keeps these running well. Very few common issues.",
    notes: "Comfortable family sedan. Good fuel economy. Reliable Toyota engineering. Parts affordable.",
  },
  {
    make: "SsangYong",
    model: "Korando",
    description:
      "Compact SUV with practical layout and decent ground clearance. Good value proposition. Growing market presence in NZ.",
    reliabilityIssues:
      "Relatively newer brand so long-term data limited. Early reports positive. Regular maintenance important. Parts availability improving.",
    notes: "Good value compact SUV. Modern features. Warranty varies by dealer. Service network developing.",
  },
  {
    make: "Mazda",
    model: "MPV",
    description:
      "Compact minivan with flexible seating and good fuel economy. Practical for families needing extra seats. Reliable Mazda engineering.",
    reliabilityIssues:
      "Generally reliable. Transmission fluid condition important. Engine usually solid. Regular maintenance key. Check service history.",
    notes: "Practical family minivan. Good fuel economy. Flexible seating options. Mazda reliability.",
  },
  {
    make: "Toyota",
    model: "Wish",
    description:
      "Compact 7-seater minivan with efficient space utilization. Fuel-efficient for a family vehicle. Practical daily transport.",
    reliabilityIssues:
      "Generally reliable. Regular maintenance important. Engine generally solid. Transmission fluid should be checked.",
    notes: "Practical family minivan. Good fuel economy. Space-efficient design. Growing in NZ market.",
  },
  {
    make: "Audi",
    model: "TT",
    description:
      "Premium compact sports car with distinctive design and performance. Fun driving dynamics with quality interior. Lifestyle vehicle.",
    reliabilityIssues:
      "Generally reliable but service costs high. Common issues: electrical faults, transmission problems. Regular servicing critical.",
    notes: "Premium sports car with luxury features. Service costs higher than mainstream. Full history important.",
  },
  {
    make: "Nissan",
    model: "Teana",
    description:
      "Mid-size luxury sedan with comfortable ride and modern features. Practical family vehicle with good value. Imported from Japan.",
    reliabilityIssues:
      "Generally reliable. CVT transmission requires monitoring. Engine typically solid. Regular maintenance important.",
    notes: "Comfortable luxury sedan. Imported from Japan. Good fuel economy. CVT requires attention.",
  },
  {
    make: "Volkswagen",
    model: "Passat",
    description:
      "Mid-size European sedan with quality engineering and practical design. Good balance of comfort and performance. Solid family car.",
    reliabilityIssues:
      "Generally reliable but service costs higher than Asian brands. Regular maintenance critical. Parts availability good.",
    notes: "European quality build. Service costs moderate but higher than Asian. Fuel-efficient. Good value.",
  },
  {
    make: "Mercedes-Benz",
    model: "GLE",
    description:
      "Premium large SUV with luxury appointments and strong performance. Spacious interior perfect for families. High-quality materials throughout.",
    reliabilityIssues:
      "Expensive repairs possible. Common issues: electrical faults, transmission problems, suspension wear. Regular maintenance critical.",
    notes: "Luxury brand with premium maintenance costs. Full service history essential. Specialist service recommended.",
  },
  {
    make: "Nissan",
    model: "Sylphy",
    description:
      "Compact sedan with practical interior and good fuel economy. Reliable Nissan engineering at affordable price. Comfortable daily driver.",
    reliabilityIssues:
      "Generally reliable. CVT transmission performs well. Engine typically sound. Regular maintenance keeps these running well.",
    notes: "Good value compact sedan. Practical interior. Good fuel economy. Parts affordable.",
  },
  {
    make: "Honda",
    model: "Grace",
    description:
      "Compact luxury sedan imported from Japan. Premium features and comfortable ride. Good value upscale transport. Growing NZ presence.",
    reliabilityIssues:
      "Generally reliable. Engine typically solid. Regular maintenance important. Parts availability through specialists.",
    notes: "Luxury sedan imported from Japan. Comfortable and practical. Good fuel economy. Parts availability improving.",
  },
  {
    make: "BMW",
    model: "X2",
    description:
      "Premium compact crossover with modern design and engaging driving dynamics. Spacious interior with quality features. Fun factor appealing.",
    reliabilityIssues:
      "Expensive repairs possible. Common issues: cooling system failures, electrical gremlins. High maintenance costs.",
    notes: "Luxury compact with premium features. Parts and labor are expensive. Full history important.",
  },
  {
    make: "Holden",
    model: "Cruze",
    description:
      "Australian compact sedan with practical layout and decent fuel economy. Good value family car. Australian engineering.",
    reliabilityIssues:
      "Generally reliable. Some transmission issues reported. Engine typically solid. Regular maintenance important.",
    notes: "Australian-built compact sedan. Practical for families. Manual and automatic options. Good fuel economy.",
  },
  {
    make: "Honda",
    model: "HR-V",
    description:
      "Compact crossover with practical interior and good ground clearance. Spacious for its size with reliable Honda engineering.",
    reliabilityIssues:
      "Generally reliable. Some transmission issues reported in certain years. Engine generally solid. Regular maintenance recommended.",
    notes: "Practical compact crossover. Good interior space. Honda reliability reputation. Available petrol and hybrid.",
  },
  {
    make: "Kia",
    model: "Niro",
    description:
      "Compact crossover with hybrid option and modern styling. Good fuel economy with practical features. Growing market presence.",
    reliabilityIssues:
      "Newer model with improving reliability. Warranty is major advantage. Hybrid option proven. Regular maintenance important.",
    notes: "Good value compact crossover. Strong warranty coverage. Hybrid available. Available FWD and AWD.",
  },
  {
    make: "Honda",
    model: "STEPWAGON",
    description:
      "Compact 7-seater MPV with flexible interior and practical layout. Good fuel efficiency for a family vehicle. Reliable Honda engineering.",
    reliabilityIssues:
      "Generally reliable. Engine typically solid. Occasional CVT issues but uncommon. Regular maintenance keeps these running well.",
    notes: "Practical family minivan. Good fuel economy. Flexible seating options. Honda reliability.",
  },
  {
    make: "Lexus",
    model: "GS",
    description:
      "Premium mid-size sedan with luxury features and excellent reliability. Spacious and comfortable with quality interior. High-quality build.",
    reliabilityIssues:
      "Excellent reliability overall. Very dependable for a luxury brand. Occasional electrical issues. Service premium. Parts expensive.",
    notes: "Luxury reliability. Premium features throughout. Excellent resale value. Full service history important.",
  },
  {
    make: "Mazda",
    model: "MX-30",
    description:
      "New compact electric crossover with modern design and fun driving dynamics. Zero emissions with decent range. Growing EV market.",
    reliabilityIssues:
      "New model so long-term reliability not established. Early reports positive. Battery warranty typically 8+ years.",
    notes: "Modern EV technology. Growing charging infrastructure. Electric operation low running costs. Premium pricing.",
  },
  {
    make: "Jaguar",
    model: "XE",
    description:
      "Luxury compact sedan with performance and sophisticated design. Spacious interior with advanced technology. Premium driving experience.",
    reliabilityIssues:
      "Generally reliable but service costs high. Common issues: electrical faults, transmission problems. Regular servicing important.",
    notes: "Luxury sedan with premium features. Service costs higher than mainstream. Full history important. Quality build.",
  },
  {
    make: "Toyota",
    model: "Land Cruiser",
    description:
      "Legendary large SUV known for durability and off-road excellence. Excellent build quality and reliability. Status symbol with strong resale.",
    reliabilityIssues:
      "Outstanding reliability. Diesel engines nearly bulletproof. Some rust on very old models. Fuel consumption high but durability compensates.",
    notes: "Expensive to buy but maintains value exceptionally well. Diesel unbeatable for longevity.",
  },
  {
    make: "Volvo",
    model: "XC60",
    description:
      "Premium mid-size SUV with Scandinavian design and safety focus. Spacious and comfortable with modern features. Quality craftsmanship.",
    reliabilityIssues:
      "Generally reliable. Service costs reasonable compared to some premium brands. Regular maintenance important.",
    notes: "Safety-focused design. Quality Scandinavian build. Good fuel economy. Parts availability good.",
  },
  {
    make: "Holden",
    model: "Trailblazer",
    description:
      "Australian large SUV with practical layout and good towing capacity. Spacious family vehicle. Australian-built reliability.",
    reliabilityIssues:
      "Generally reliable Australian engineering. Some transmission issues possible. Check for electrical issues and wear.",
    notes: "Australian-built large SUV. Spacious for families. Good towing capacity. Parts availability good.",
  },
  {
    make: "Toyota",
    model: "Vanguard",
    description:
      "Mid-size SUV with good practicality and off-road capability. Spacious interior and reliable Toyota engineering. Family-focused.",
    reliabilityIssues:
      "Generally reliable. Engine typically solid. Regular maintenance keeps these running well. Very few common issues.",
    notes: "Practical mid-size SUV. Good ground clearance. Reliable Toyota engineering. Parts affordable.",
  },
  {
    make: "Ford",
    model: "Kuga",
    description:
      "Compact crossover SUV with good space and practicality. Available with petrol and hybrid options. Decent performance for daily driving.",
    reliabilityIssues:
      "Transmission issues reported in some years. Engine oil leaks possible. Check transmission smooth operation.",
    notes: "Available FWD and AWD. Hybrid option good for fuel economy. Practical compact SUV.",
  },
];

export async function seedBatch2ModelDescriptions() {
  console.log("Seeding batch 2 vehicle model descriptions (50 models)...");

  let inserted = 0;
  let skipped = 0;

  for (const description of batch2ModelDescriptions) {
    try {
      await db.insert(vehicleModelDescriptions).values({
        make: description.make,
        model: description.model,
        description: description.description,
        reliabilityIssues: description.reliabilityIssues,
        notes: description.notes,
      });
      inserted++;
    } catch (e: unknown) {
      const error = e as { cause?: { code?: string } };
      if (error.cause?.code === "23505") {
        skipped++;
      } else {
        console.error(`Error inserting ${description.make} ${description.model}:`, e);
      }
    }
  }

  console.log(
    `✓ Inserted ${inserted} batch 2 model descriptions, skipped ${skipped} duplicates`,
  );
}

// Run if called directly
seedBatch2ModelDescriptions().then(() => {
  process.exit(0);
});
