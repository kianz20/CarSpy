import { db } from "./client";
import { vehicleModelDescriptions } from "./schema";

const additionalModelDescriptions = [
  {
    make: "Land Rover",
    model: "Range",
    description:
      "Premium large SUV combining luxury with off-road capability. Known for sophisticated design, advanced technology, and spacious interior. Status symbol with strong presence.",
    reliabilityIssues:
      "Common issues include electrical faults, transmission problems, and suspension wear. Expensive repairs. Many sensors can fail. Regular servicing essential.",
    notes: "Luxury brand with premium maintenance costs. Full service history critical. Check for any warning lights or electrical issues.",
  },
  {
    make: "Tesla",
    model: "Model",
    description:
      "Premium electric sedan with advanced technology and exceptional acceleration. Superb autopilot features and minimalist interior. Cutting-edge performance.",
    reliabilityIssues:
      "Build quality inconsistent (panel gaps reported). Battery warranty 8 years/160,000km. Service mostly through Tesla service centers. Specialist repair needed.",
    notes: "Exceptional performance and technology. Charging infrastructure rapidly improving. Premium pricing. Limited traditional mechanic compatibility.",
  },
  {
    make: "Nissan",
    model: "NV350",
    description:
      "Commercial van with spacious cargo area and practical design. Robust workhorse for trades and small business. Popular for conversions.",
    reliabilityIssues:
      "Generally reliable. Diesel engines typically durable. Check transmission condition. Mechanical simplicity aids longevity. Regular maintenance important.",
    notes: "Practical commercial vehicle. Good cargo space. Fuel economy reasonable for size. Parts availability good.",
  },
  {
    make: "Mercedes-Benz",
    model: "C",
    description:
      "Luxury compact sedan with premium features and performance. Known for smooth ride and modern technology. High-quality materials throughout.",
    reliabilityIssues:
      "Expensive to repair. Common issues: transmission problems, electrical faults, suspension wear. Parts costs very high. Maintenance critical.",
    notes: "Premium brand with associated costs. Ensure full service history and warranty. Quality build throughout.",
  },
  {
    make: "Hyundai",
    model: "Santa",
    description:
      "Mid-size 7-seater SUV with good value and practicality. Comfortable for families with third row seating. Modern features and decent performance.",
    reliabilityIssues:
      "Newer models very reliable with good warranty. Some older units had engine and transmission issues. Warranty is major advantage.",
    notes: "Excellent warranty makes used options attractive. Good family SUV. Available FWD and AWD.",
  },
  {
    make: "Mitsubishi",
    model: "Delica",
    description:
      "Compact 7-seater minivan with flexible seating and practical layout. Good space efficiency for families. Reliable Mitsubishi engineering.",
    reliabilityIssues:
      "Generally reliable. Transmission fluid condition important. Engine usually solid. Regular maintenance key to longevity. Check service history.",
    notes: "Practical family minivan. Good fuel economy. Flexible seating options. Popular in NZ.",
  },
  {
    make: "Audi",
    model: "Q7",
    description:
      "Premium large SUV with luxury features and sophisticated design. Spacious interior and refined driving experience. High-quality German engineering.",
    reliabilityIssues:
      "Generally reliable but service costs high. Common issues: electrical faults, transmission problems, diesel engine concerns. Regular maintenance critical.",
    notes: "Premium SUV with luxury features. Service costs higher than mainstream. Full history important. Specialist service recommended.",
  },
  {
    make: "Toyota",
    model: "Land",
    description:
      "Legendary large SUV known for durability and off-road excellence. Excellent build quality and reliability. Status symbol with strong resale.",
    reliabilityIssues:
      "Outstanding reliability. Diesel engines nearly bulletproof. Some rust on very old models. Fuel consumption high but durability compensates.",
    notes: "Expensive to buy but maintains value exceptionally well. Diesel unbeatable for longevity.",
  },
  {
    make: "Nissan",
    model: "Elgrand",
    description:
      "Premium large minivan with luxury features and spacious interior. Imported from Japan with advanced technology. Popular for families and business.",
    reliabilityIssues:
      "Generally very reliable. V6 engine solid. Regular maintenance important. Parts availability through specialists. Check service history.",
    notes: "Luxury minivan features. Spacious and comfortable. Imported from Japan. Premium quality finish.",
  },
  {
    make: "Mercedes-Benz",
    model: "A",
    description:
      "Luxury compact hatchback with premium features and quality materials. Fun to drive with modern technology. Entry-level Mercedes luxury.",
    reliabilityIssues:
      "Generally reliable but service costs high. Common issues: electrical faults, transmission problems. Regular servicing critical.",
    notes: "Premium compact with luxury features. Service costs higher than mainstream. Quality build throughout.",
  },
  {
    make: "Audi",
    model: "A3",
    description:
      "Premium compact hatchback with sophisticated design and solid engineering. Quality interior with modern technology. German luxury appeal.",
    reliabilityIssues:
      "Generally reliable but service costs high. Common issues: electrical faults, transmission problems, suspension wear. Regular servicing critical.",
    notes: "Premium sedan with luxury features. Service costs higher than mainstream. Full history important. Quality build throughout.",
  },
  {
    make: "BMW",
    model: "320i",
    description:
      "Premium compact sedan with excellent driving dynamics and luxury features. Known for performance and German engineering. Attractive to enthusiasts.",
    reliabilityIssues:
      "Can have expensive repairs. Common issues: cooling system failures, valve cover leaks, electrical gremlins, transmission problems. High maintenance costs.",
    notes: "Luxury features but parts and labor are expensive. Consider extended warranty or full service history.",
  },
  {
    make: "Mercedes-Benz",
    model: "CLA",
    description:
      "Luxury compact sedan with sleek design and premium features. Modern technology and performance-oriented handling. Stylish entry-level Mercedes.",
    reliabilityIssues:
      "Generally reliable but service costs high. Common issues: electrical faults, transmission problems, suspension wear. Regular servicing critical.",
    notes: "Premium styling and features. Service costs higher than mainstream. Full service history important.",
  },
  {
    make: "Holden",
    model: "Captiva",
    description:
      "Australian mid-size SUV with practical layout and good value. Decent towing capacity and spacious interior. Australian-built reliability.",
    reliabilityIssues:
      "Generally reliable Australian engineering. Some transmission issues reported in certain years. Check for electrical issues and wear.",
    notes: "Australian-built with good spare parts availability. Practical family SUV. Manual and automatic options available.",
  },
  {
    make: "Ford",
    model: "Falcon",
    description:
      "Australian sedan/wagon with strong V8 engine options. Popular family car with distinctive Australian character. Built in Australia.",
    reliabilityIssues:
      "Mixed reliability. V8 models fuel-hungry but robust. Automatic transmissions can have issues. V6 generally more efficient. Check service history.",
    notes: "Australian-built so parts more affordable than imports. V8 models have high fuel costs. Strong enthusiast following.",
  },
  {
    make: "Toyota",
    model: "Harrier",
    description:
      "Upscale mid-size SUV with premium features and refined driving experience. Spacious interior and good ground clearance. Reliable Toyota engineering.",
    reliabilityIssues:
      "Excellent reliability overall. Hybrid option very dependable. Regular maintenance keeps these running well. Very few common issues.",
    notes: "Spacious and comfortable mid-size SUV. Available petrol and hybrid. Good resale value. Excellent reliability.",
  },
  {
    make: "Mercedes-Benz",
    model: "E",
    description:
      "Premium mid-size sedan with luxury appointments and strong performance. Sophisticated design and advanced technology. High-quality materials.",
    reliabilityIssues:
      "Expensive to repair. Common issues: transmission problems, electrical faults, suspension wear. Service costs very high. Maintenance critical.",
    notes: "Premium brand with associated costs. Ensure full service history. Quality build throughout. Specialist service recommended.",
  },
  {
    make: "BMW",
    model: "X1",
    description:
      "Premium compact SUV with luxury features and strong performance. Spacious interior and advanced technology. High-quality driving dynamics.",
    reliabilityIssues:
      "Expensive repairs possible. Common issues: cooling system failures, electrical gremlins, suspension wear. High maintenance costs.",
    notes: "Luxury features but parts and labor are expensive. Full service history important. Specialist service recommended.",
  },
  {
    make: "Mitsubishi",
    model: "Pajero",
    description:
      "Legendary off-road SUV with exceptional capability and durability. Spacious interior and strong towing capacity. Popular for adventure and work.",
    reliabilityIssues:
      "Excellent reliability, especially diesel models. Engines nearly bulletproof when maintained. Some rust on very old models. Regular maintenance critical.",
    notes: "Excellent off-road capability. Diesel unbeatable for longevity. Strong resale value. Parts availability good.",
  },
  {
    make: "Lexus",
    model: "RX",
    description:
      "Premium large SUV with luxury features and excellent reliability. Spacious and comfortable with advanced technology. High-quality finish throughout.",
    reliabilityIssues:
      "Excellent reliability overall. Very dependable for a luxury brand. Occasional electrical or suspension issues. Service premium. Parts expensive.",
    notes: "Luxury reliability. Premium features throughout. Excellent resale value. Full service history important.",
  },
  {
    make: "Jeep",
    model: "Grand",
    description:
      "Capable mid-size SUV with off-road credentials and practical layout. Spacious interior for families. American engineering and heritage.",
    reliabilityIssues:
      "Generally reliable but check for transmission issues. Engine typically solid. Regular maintenance important. Some electrical concerns possible.",
    notes: "Good off-road capability. Parts availability good. Available FWD and AWD. Practical family SUV.",
  },
  {
    make: "Jeep",
    model: "Wrangler",
    description:
      "Iconic off-road SUV with legendary capability and distinctive styling. Open-air experience with rugged durability. Lifestyle and adventure vehicle.",
    reliabilityIssues:
      "Generally reliable mechanical components. Common issues: electrical problems, rusting, weather sealing. Check water intrusion carefully.",
    notes: "Iconic off-road legend. Parts widely available. Open-top option unique. Strong enthusiast community.",
  },
  {
    make: "Toyota",
    model: "Crown",
    description:
      "Upscale luxury sedan imported from Japan. Premium features and smooth ride. Known for comfort and reliability. Status symbol in some markets.",
    reliabilityIssues:
      "Generally very reliable. Regular maintenance important. Engine typically solid. Check transmission fluid condition. Parts availability through specialists.",
    notes: "Luxury sedan imported from Japan. Premium quality finish. Good fuel economy for size. Reliable Toyota engineering.",
  },
  {
    make: "Suzuki",
    model: "Jimny",
    description:
      "Compact off-road SUV with surprisingly capable 4x4 system. Fun driving character and practical size. Affordable adventure vehicle.",
    reliabilityIssues:
      "Generally reliable. Engine solid and efficient. Occasional transmission issues but uncommon. Regular maintenance keeps these running well.",
    notes: "Fun and capable for its size. Good ground clearance. Affordable budget option. Strong off-road capability for size.",
  },
  {
    make: "Mitsubishi",
    model: "DELICA",
    description:
      "Compact 7-seater minivan with flexible seating and practical layout. Good space efficiency for families. Reliable Mitsubishi engineering.",
    reliabilityIssues:
      "Generally reliable. Transmission fluid condition important. Engine usually solid. Regular maintenance key to longevity. Check service history.",
    notes: "Practical family minivan. Good fuel economy. Flexible seating options. Space-efficient design.",
  },
  {
    make: "Nissan",
    model: "Dualis",
    description:
      "Compact SUV with practical layout and decent ground clearance. Good value for families. European and Japanese engineering blend.",
    reliabilityIssues:
      "Generally reliable. CVT transmission requires monitoring. Engine generally solid. Regular maintenance critical. Check transmission condition.",
    notes: "Practical compact SUV. Good fuel economy. Available FWD and AWD. CVT transmission needs attention.",
  },
  {
    make: "Nissan",
    model: "Kicks",
    description:
      "Compact budget SUV offering good value and practical layout. Modern styling with accessible pricing. Growing popularity in budget segment.",
    reliabilityIssues:
      "Relatively new so long-term data limited. Early reports positive. Regular maintenance important. Parts availability improving.",
    notes: "Good value compact SUV. Budget-friendly option. Modern features standard. Warranty period important to check.",
  },
  {
    make: "Jaguar",
    model: "F-Pace",
    description:
      "Luxury compact SUV with performance and sophisticated design. Spacious interior with advanced technology. Premium driving experience.",
    reliabilityIssues:
      "Generally reliable but service costs high. Common issues: electrical faults, transmission problems. Regular servicing important.",
    notes: "Luxury performance SUV. Service costs higher than mainstream. Full service history important. Specialist service recommended.",
  },
  {
    make: "Porsche",
    model: "Cayenne",
    description:
      "Performance luxury large SUV with exceptional driving dynamics. Powerful engine options and advanced technology. High-performance family vehicle.",
    reliabilityIssues:
      "Generally reliable but very expensive repairs. Common issues: transmission problems, suspension wear, electrical issues. Premium service costs.",
    notes: "Luxury performance with associated costs. Full service history essential. Specialist service critical. Premium parts and labor.",
  },
  {
    make: "Nissan",
    model: "Tiida",
    description:
      "Compact hatchback/sedan with practical interior and good fuel economy. Reliable Nissan engineering at affordable price. Popular city car.",
    reliabilityIssues:
      "Generally reliable. CVT transmission performs well generally. Engine typically sound. Regular maintenance keeps these running smoothly.",
    notes: "Good value compact car. Practical interior space. Good fuel economy. Parts affordable.",
  },
];

export async function seedAdditionalModelDescriptions() {
  console.log("Seeding additional vehicle model descriptions...");

  let inserted = 0;
  let skipped = 0;

  for (const description of additionalModelDescriptions) {
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
    `✓ Inserted ${inserted} additional model descriptions, skipped ${skipped} duplicates`,
  );
}

// Run if called directly
seedAdditionalModelDescriptions().then(() => {
  process.exit(0);
});
