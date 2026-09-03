import { db } from "./client";
import { vehicleModelDescriptions } from "./schema";

const modelDescriptions = [
  {
    make: "Toyota",
    model: "Corolla",
    description:
      "The world's best-selling sedan. Known for exceptional reliability, fuel efficiency, and low maintenance costs. Practical family car with comfortable interior and proven resale value.",
    reliabilityIssues: "Very few common issues. Occasional transmission problems in early 2000s models.",
    notes: "Available in sedan and hatchback. Strong hybrid options in newer models. Parts widely available and affordable.",
  },
  {
    make: "Toyota",
    model: "Hilux",
    description:
      "Legendary work truck known for durability and off-road capability. Popular in NZ for both commercial and personal use. Reliable engine options and excellent towing capacity.",
    reliabilityIssues:
      "Generally very reliable. Some older diesels may suffer turbo wear with high mileage. Rust can be an issue on older models.",
    notes: "Petrol and diesel options. Single and double cab variants. Excellent resale value.",
  },
  {
    make: "Toyota",
    model: "RAV4",
    description:
      "Popular compact SUV combining practicality with reliability. Good ground clearance, spacious interior, and available all-wheel drive for NZ conditions.",
    reliabilityIssues: "Very reliable overall. Some CVT transmission issues reported in 2009-2012 models. Check rear diff condition.",
    notes: "Available in FWD and AWD. Hybrid option offers good fuel economy.",
  },
  {
    make: "Honda",
    model: "Civic",
    description:
      "Sporty sedan known for reliability and driver engagement. Good fuel economy, practical interior, and strong resale value. Appealing to both practical buyers and enthusiasts.",
    reliabilityIssues: "Generally reliable. Early 2000s models prone to transmission issues. Check for rust underneath.",
    notes: "Wide range of engine options including hybrid. Aftermarket support is excellent.",
  },
  {
    make: "Honda",
    model: "CR-V",
    description:
      "One of the original compact crossovers. Spacious interior, good visibility, and reliable performance. Great for families and active lifestyles.",
    reliabilityIssues:
      "Excellent reliability record. Some 2007-2012 models reported engine piston ring issues causing oil consumption.",
    notes: "Available in FWD and AWD. Hybrid models offer good value.",
  },
  {
    make: "Mazda",
    model: "Mazda3",
    description:
      "Stylish compact sedan/hatchback with engaging driving dynamics. Good fuel economy, modern interior, and attractive design. Well-suited for urban and suburban use.",
    reliabilityIssues:
      "Good reliability overall. Earlier generations may have engine issues. Check transmission fluid condition.",
    notes: "Available in sedan and hatchback. Popular used option in NZ.",
  },
  {
    make: "Mazda",
    model: "CX-5",
    description:
      "Mid-size SUV with refined driving experience. Good balance of comfort and capability. Attractive design and practical cargo space.",
    reliabilityIssues:
      "Generally reliable, but some reports of transmission/engine concerns. Always get pre-purchase inspection. Newer models improved.",
    notes: "Available in FWD and AWD. Petrol and diesel engines available.",
  },
  {
    make: "Nissan",
    model: "X-Trail",
    description:
      "Popular 7-seater SUV with good ground clearance and practicality. Spacious cabin and reasonable fuel economy. Well-suited for families.",
    reliabilityIssues:
      "Major CVT transmission issues reported in 2007-2017 models. Many premature failures require expensive replacement. Thoroughly inspect transmission.",
    notes: "Available in FWD and AWD. 2-row and 3-row options. Research CVT issues carefully.",
  },
  {
    make: "Nissan",
    model: "Qashqai",
    description:
      "Compact SUV offering good value and practicality. European-focused design with reasonable fuel economy and comfortable ride.",
    reliabilityIssues:
      "Generally reliable. Some CVT transmission issues in earlier models. Engine knocking reported in some units.",
    notes: "Available in FWD and AWD. Popular in Europe and NZ.",
  },
  {
    make: "Ford",
    model: "Ranger",
    description:
      "Robust work truck with strong towing and payload capacity. Practical work vehicle increasingly popular for personal use. Good ground clearance for NZ terrain.",
    reliabilityIssues:
      "Generally reliable but check for common issues: engine oil leaks, transmission shudders, and rear diff problems in older models.",
    notes: "Various engine options including EcoBoost and diesel. Single and double cab available.",
  },
  {
    make: "Subaru",
    model: "Outback",
    description:
      "Wagon-SUV crossover with excellent all-wheel drive system. Higher ground clearance than sedans, spacious cargo area, and capable in rough conditions.",
    reliabilityIssues:
      "Known for head gasket failures (older generations). Oil leaks common. Boxer engine design adds to service costs. Check for repairs.",
    notes: "Exceptional all-wheel drive system. Popular for outdoor activities and rural use.",
  },
  {
    make: "Hyundai",
    model: "Tucson",
    description:
      "Affordable compact SUV with modern styling and good warranty options. Practical interior and reasonable fuel economy. Growing reliability record.",
    reliabilityIssues:
      "Newer models very reliable. Earlier generations had more issues. Check service history. Some reports of engine problems in higher mileage units.",
    notes: "Excellent warranty on newer models. Good value proposition.",
  },
  {
    make: "Kia",
    model: "Sportage",
    description:
      "Compact SUV with attractive design and good value. Comfortable interior, reasonable performance, and solid warranty coverage.",
    reliabilityIssues: "Generally reliable, especially newer models. Warranty coverage is strong. Check service history on older units.",
    notes: "Good warranty makes used Kias attractive. Practical family SUV.",
  },
  {
    make: "Mitsubishi",
    model: "Outlander",
    description:
      "7-seater SUV with good value and practical layout. Available with plug-in hybrid option for improved efficiency. Spacious interior for families.",
    reliabilityIssues:
      "Generally reliable. PHEV models are newer so long-term reliability not fully proven. Manual transmissions may need attention.",
    notes: "PHEV option is increasingly popular. Good cargo space. Parts availability improving.",
  },
  {
    make: "Volkswagen",
    model: "Golf",
    description:
      "European compact car known for solid build quality and driving dynamics. Practical hatchback with modern features and good fuel economy.",
    reliabilityIssues:
      "Early diesels (TDI 1.9L) and 2009-2015 EA189 diesels affected by emissions scandal and carbon buildup. Service costs can be high.",
    notes: "Diesel and petrol options. Aftermarket support excellent. European parts can be expensive.",
  },
  {
    make: "BMW",
    model: "3 Series",
    description:
      "Premium compact sedan with excellent driving dynamics and luxury features. Known for performance and German engineering. Attractive to enthusiasts.",
    reliabilityIssues:
      "Can have expensive repairs. Common issues: cooling system failures, valve cover leaks, electrical gremlins, transmission problems. High maintenance costs.",
    notes: "Luxury features but parts and labor are expensive. Consider extended warranty or full service history.",
  },
  {
    make: "Mercedes-Benz",
    model: "C-Class",
    description:
      "Luxury compact sedan with premium interior and performance. Known for smooth ride and modern technology. High-quality materials throughout.",
    reliabilityIssues:
      "Expensive to repair. Common issues: transmission issues, electrical faults, suspension wear. Parts costs very high. Maintenance critical.",
    notes: "Premium brand with associated costs. Ensure full service history and warranty.",
  },
  {
    make: "Holden",
    model: "Commodore",
    description:
      "Australian-built sedan (discontinued 2017). Offered in sedan and wagon. Australian V8 models popular but fuel-hungry.",
    reliabilityIssues:
      "Mixed reliability. Earlier models prone to engine issues, transmission problems. Later models improved. Check service history carefully.",
    notes: "Australian-built so parts more affordable than imports. V8 models have high fuel costs.",
  },
  {
    make: "Isuzu",
    model: "D-Max",
    description:
      "Reliable work truck with good towing capacity and durability. Practical 4x4 capability with reasonable fuel economy for a diesel truck.",
    reliabilityIssues:
      "Generally very reliable. Turbo diesels known for longevity. Check transmission oil and diff condition. Later models have fewer issues.",
    notes: "Excellent reliability for commercial work. Diesel economy good. Single and double cab available.",
  },
  {
    make: "Suzuki",
    model: "Swift",
    description:
      "Affordable compact hatchback perfect for city driving. Lightweight and agile with good fuel economy. Popular first-car option.",
    reliabilityIssues:
      "Generally reliable. Some early models prone to oil sludge issues. Check engine condition. CVT transmission may need attention.",
    notes: "Affordable to buy and run. Good for urban commuting. Parts inexpensive.",
  },
  {
    make: "Volkswagen",
    model: "Polo",
    description:
      "Compact European hatchback with solid build and good driving experience. Well-appointed interior for its size with modern features.",
    reliabilityIssues:
      "Generally reliable but earlier diesel models affected by emissions issues. Service costs higher than Asian alternatives.",
    notes: "European styling and quality. Good value on used market. Fuel-efficient.",
  },
  {
    make: "Nissan",
    model: "Leaf",
    description:
      "Affordable electric vehicle with zero emissions and low running costs. Good city car with decent range for daily commuting. Increasingly popular with growing charging infrastructure.",
    reliabilityIssues:
      "Battery degradation over time is main concern - expect 10-20% capacity loss after 8 years. Early models (2011-2017) had steeper degradation. Battery replacement very expensive ($8-15k+).",
    notes: "No petrol/diesel maintenance but high electricity costs depending on plan. Charging network expanding rapidly. Tax incentives available.",
  },
  {
    make: "Toyota",
    model: "Yaris",
    description:
      "Compact city hatchback with excellent fuel economy and practical interior. Known for reliability and affordable maintenance. Popular as first car or urban commuter.",
    reliabilityIssues: "Very reliable. Occasional CVT transmission issues in early models but rare. Generally low cost repairs.",
    notes: "Excellent fuel economy. Small size great for city parking. Parts affordable.",
  },
  {
    make: "Toyota",
    model: "Prius",
    description:
      "Iconic hybrid sedan combining fuel economy with reliability. Low running costs and environmental benefits. Proven hybrid technology from market pioneer.",
    reliabilityIssues:
      "Excellent reliability overall. Hybrid battery generally lasts 10+ years. Occasional inverter issues in older models. Brake maintenance different due to regen braking.",
    notes: "Outstanding fuel economy (5-6L/100km). Hybrid battery warranty usually 10 years. Excellent resale value.",
  },
  {
    make: "Honda",
    model: "Jazz",
    description:
      "Practical compact hatchback with clever interior space and reliable engine. Good for families and urban drivers. Fun to drive with adequate performance.",
    reliabilityIssues: "Very reliable. Some early models had transmission issues but modern versions improved. CVT in newer models performs well.",
    notes: "Exceptional interior space for size. Popular as city car. Low running costs.",
  },
  {
    make: "Mazda",
    model: "CX-3",
    description:
      "Compact SUV with stylish design and engaging driving dynamics. Good fuel economy for an SUV with practical cargo space. Fun factor appeals to active drivers.",
    reliabilityIssues:
      "Generally reliable. Some reports of transmission shudder and engine issues. Always get pre-purchase inspection. Newer models better.",
    notes: "Fun driving experience. Good value compact SUV. Available FWD and AWD.",
  },
  {
    make: "Nissan",
    model: "Navara",
    description:
      "Popular mid-size dual-cab ute with good towing and payload capacity. Practical work vehicle increasingly used for lifestyle. Comfortable for daily driving.",
    reliabilityIssues:
      "Generally reliable. Check for engine oil leaks and transmission shudders. Rear diff bearing noise reported in some years. Common service issues addressable.",
    notes: "Good value ute. Available petrol and diesel. Single and dual cab options.",
  },
  {
    make: "Ford",
    model: "Focus",
    description:
      "Compact hatchback/sedan with engaging driving dynamics and European engineering. Good balance of practicality and performance. Popular globally.",
    reliabilityIssues:
      "Early 2000s models had transmission issues. Later generations more reliable but dual-clutch transmissions can be problematic. Check transmission smooth shifting.",
    notes: "Available hatchback and sedan. Fun to drive. Parts widely available.",
  },
  {
    make: "Hyundai",
    model: "i30",
    description:
      "Compact hatchback offering good value and modern features. Attractive design with decent interior quality. Growing reliability reputation.",
    reliabilityIssues:
      "Newer models very reliable. Warranty is strong benefit. Some older units had engine knock and transmission issues. Check service history.",
    notes: "Great warranty coverage makes used models attractive. Good value proposition.",
  },
  {
    make: "Kia",
    model: "Cerato",
    description:
      "Compact sedan with attractive styling and good value. Comfortable interior and reliable performance. Growing popularity in value segment.",
    reliabilityIssues:
      "Generally reliable, especially newer models. Warranty coverage is strong. Some transmission hesitation reported. Parts availability good.",
    notes: "Excellent warranty on newer models. Comfortable family sedan. Good fuel economy.",
  },
  {
    make: "Mitsubishi",
    model: "Lancer",
    description:
      "Compact sedan with reliable engineering and practical layout. Available in base and sporty Evolution variants. Good value used option.",
    reliabilityIssues:
      "Generally reliable. Older models prone to transmission and clutch issues. Evolution models performance-focused. Check service history.",
    notes: "Evolution variants are performance-oriented. Parts affordable. Good resale on sporty versions.",
  },
  {
    make: "Subaru",
    model: "Impreza",
    description:
      "Compact sedan/hatchback known for all-wheel drive and performance. Practical with engaging driving dynamics. Popular with enthusiasts and families.",
    reliabilityIssues:
      "Head gasket issues in early models (major concern). Oil leaks common. Boxer engine adds service costs. Check repair history thoroughly.",
    notes: "Standard all-wheel drive. Performance variants available. Popular in NZ rural areas.",
  },
  {
    make: "Toyota",
    model: "Camry",
    description:
      "Mid-size sedan combining comfort, reliability, and practicality. Spacious interior perfect for families. Proven reliability over generations.",
    reliabilityIssues:
      "Very reliable overall. Some early 2000s models had transmission issues. V6 models generally more durable. Regular maintenance critical.",
    notes: "Comfortable family sedan. Good resale value. Available petrol and hybrid.",
  },
  {
    make: "Honda",
    model: "Accord",
    description:
      "Mid-size sedan known for reliability and driving enjoyment. Quality interior and practical space. Strong reputation across generations.",
    reliabilityIssues:
      "Excellent reliability. Some early models prone to transmission issues. V6 models solid. Check for maintenance history on older units.",
    notes: "Strong reliability record. Good resale value. Available sedan and coupe.",
  },
  {
    make: "Mazda",
    model: "6",
    description:
      "Stylish mid-size sedan with refined driving dynamics and quality interior. Good balance of efficiency and performance. European-influenced design.",
    reliabilityIssues:
      "Generally reliable. Older models may have transmission or engine concerns. Modern versions improved. Transmission fluid changes important.",
    notes: "Fun to drive for a mid-size sedan. Good fuel economy. Quality interior.",
  },
  {
    make: "Nissan",
    model: "Maxima",
    description:
      "Upscale mid-size sedan with powerful V6 engine and luxury features. Spacious and comfortable with performance credentials.",
    reliabilityIssues:
      "Generally reliable but CVT transmission can be problematic. Engine timing chain may need attention. Transmission fluid maintenance critical.",
    notes: "Powerful V6 performance. Luxury features. Check CVT transmission condition carefully.",
  },
  {
    make: "Hyundai",
    model: "Santa Fe",
    description:
      "Mid-size 7-seater SUV with good value and practicality. Comfortable for families with third row seating. Modern features and decent performance.",
    reliabilityIssues:
      "Newer models very reliable with good warranty. Some older units had engine and transmission issues. Warranty is major advantage.",
    notes: "Excellent warranty makes used options attractive. Good family SUV. Available FWD and AWD.",
  },
  {
    make: "Toyota",
    model: "Prado",
    description:
      "Mid-size SUV known for off-road capability and reliability. Spacious interior and strong towing capacity. Popular for families and active use.",
    reliabilityIssues:
      "Excellent reliability. Diesel engines particularly durable (2.8L common). Some rust on older models. Regular maintenance keeps these running well.",
    notes: "Excellent off-road capability. Diesel very reliable. Strong resale value.",
  },
  {
    make: "Toyota",
    model: "Landcruiser",
    description:
      "Legendary large SUV known for durability and off-road excellence. Excellent build quality and reliability. Status symbol with strong resale.",
    reliabilityIssues:
      "Outstanding reliability. Diesel engines nearly bulletproof. Some rust on very old models. Fuel consumption high but durability compensates.",
    notes: "Expensive to buy but maintains value exceptionally well. Diesel unbeatable for longevity.",
  },
  {
    make: "Ford",
    model: "Mustang",
    description:
      "American performance icon with V8 power and distinctive styling. Popular as weekend car and collector vehicle. Strong enthusiast following.",
    reliabilityIssues:
      "Earlier generations more temperamental. Modern versions more reliable. Common issues: transmission problems, electrical issues, and interior trim quality.",
    notes: "Fun performance car. Parts readily available. Enthusiast support strong.",
  },
  {
    make: "Tesla",
    model: "Model 3",
    description:
      "Premium electric sedan with advanced technology and impressive performance. Superb acceleration and autopilot features. Tech-forward design.",
    reliabilityIssues:
      "Still proving long-term reliability. Build quality inconsistent (panel gaps reported). Battery warranty 8 years/160,000km. Service costs low but specialist repair needed.",
    notes: "Exceptional performance. Cutting-edge tech. Charging infrastructure rapidly improving. Premium pricing.",
  },
  {
    make: "Toyota",
    model: "86",
    description:
      "Lightweight sports car with balanced handling and affordable performance. Fun driving dynamics and engaging engine. Popular with enthusiasts.",
    reliabilityIssues:
      "Generally reliable. Engine occasionally prone to carbon buildup on some years. Clutch wear common if driven hard. Maintenance straightforward.",
    notes: "Fun sports car at reasonable price. Manual transmission only (mostly). Good resale for enthusiasts.",
  },
  {
    make: "Subaru",
    model: "WRX",
    description:
      "Performance sedan with turbocharged engine and all-wheel drive. Excellent dynamics and rally heritage appeal. Popular tuning platform.",
    reliabilityIssues:
      "Turbo engine reliability varies with maintenance. Head gasket issues possible. Turbo wear if not properly maintained. High-performance upkeep required.",
    notes: "Excellent all-wheel drive performance. Strong enthusiast community. Popular for modifications.",
  },
  {
    make: "Toyota",
    model: "Aqua",
    description:
      "Affordable hybrid city car with excellent fuel economy. Compact and nimble for urban driving. Popular in Asia with growing NZ presence.",
    reliabilityIssues:
      "Generally very reliable. Hybrid battery typically lasts 10+ years with good warranty. Occasional CVT transmission concerns. Regular maintenance important.",
    notes: "Exceptional fuel economy (3-4L/100km). Compact size perfect for city. Hybrid technology proven and reliable.",
  },
  {
    make: "Nissan",
    model: "Note",
    description:
      "Compact hatchback with practical interior and flexible seating. Good value city car with reasonable fuel economy. European engineering from Renault partnership.",
    reliabilityIssues:
      "Generally reliable but check transmission fluid condition. Some reports of engine issues. Regular maintenance critical. Older models may have wear issues.",
    notes: "Practical flexible interior. Good fuel economy. Parts availability depends on model year.",
  },
  {
    make: "Nissan",
    model: "Serena",
    description:
      "Compact 7-seater minivan popular for families. Spacious interior with flexible seating. Good visibility and easy driving. Growing popularity in NZ.",
    reliabilityIssues:
      "Generally reliable. CVT transmission can be problematic - check condition. Engine timing chain maintenance important. Regular fluid changes recommended.",
    notes: "Excellent for families needing third row. Sliding doors convenient. Space-efficient design.",
  },
  {
    make: "Subaru",
    model: "XV",
    description:
      "Compact crossover with Subaru's standard all-wheel drive. Good ground clearance and practical interior. Known for capability in NZ conditions.",
    reliabilityIssues:
      "Generally reliable. Head gasket issues possible in some models. Oil leaks can occur. Check service history carefully. Newer models improved.",
    notes: "Standard all-wheel drive great for NZ terrain. Good clearance. Practical daily driver.",
  },
  {
    make: "Toyota",
    model: "C-HR",
    description:
      "Stylish compact SUV with unique design and hybrid option. Good ground clearance with modern features. Fun driving dynamics for an SUV.",
    reliabilityIssues:
      "Generally reliable. Some reports of transmission issues. Pre-purchase inspection recommended. Newer models more reliable. Hybrid option proven.",
    notes: "Available hybrid and petrol. Distinctive styling. Good fuel economy.",
  },
  {
    make: "Mitsubishi",
    model: "Triton",
    description:
      "Popular mid-size dual-cab ute with good towing capacity. Practical work vehicle and lifestyle vehicle. Compact in comparison to competitors.",
    reliabilityIssues:
      "Generally reliable. Diesel engines robust. Check transmission oil and diff condition. Some reports of sensor issues. Later models improved.",
    notes: "Good work ute value. Single and dual cab options. Diesel very capable.",
  },
  {
    make: "Toyota",
    model: "Hiace",
    description:
      "Versatile van platform used as passenger van, campervan, and work vehicle. Spacious interior and reliable mechanicals. Popular for conversions.",
    reliabilityIssues:
      "Excellent reliability, especially diesel. Engines nearly bulletproof when maintained. Check for rust and interior wear. Age more concern than mileage.",
    notes: "Exceptional for conversions. Diesel very reliable. Popular campervan base.",
  },
  {
    make: "Honda",
    model: "Fit",
    description:
      "Compact hatchback with clever interior space design. Excellent practicality for its size. Reliable and economical daily driver.",
    reliabilityIssues:
      "Very reliable overall. Occasional transmission issues in some years. Engine generally solid. Regular maintenance keeps these running well.",
    notes: "Exceptional space for size. Good fuel economy. Practical family car.",
  },
  {
    make: "Mitsubishi",
    model: "Eclipse Cross",
    description:
      "Stylish compact SUV with unique design language. Good driving dynamics and modern interior. Growing market presence in NZ.",
    reliabilityIssues:
      "Newer model so long-term reliability not fully proven. Early reports positive. CVT transmission in some models. Regular maintenance important.",
    notes: "Distinctive styling. Good interior quality. Fuel efficient for SUV.",
  },
  {
    make: "Ford",
    model: "Escape",
    description:
      "Compact crossover SUV with good space and practicality. Available with petrol and hybrid options. Decent performance for daily driving.",
    reliabilityIssues:
      "Transmission issues reported in some years. Engine oil leaks possible. Check transmission smooth operation. Maintenance history important.",
    notes: "Available FWD and AWD. Hybrid option good for fuel economy.",
  },
  {
    make: "Mazda",
    model: "Demio",
    description:
      "Compact hatchback with Mazda's fun-to-drive philosophy. Good interior space and fuel economy. Practical city and family car.",
    reliabilityIssues:
      "Generally reliable. Older models prone to engine issues. Transmission fluid condition should be checked. Regular maintenance important.",
    notes: "Fun to drive. Good fuel economy. Popular used option in NZ.",
  },
  {
    make: "Mazda",
    model: "Axela",
    description:
      "Compact sedan/hatchback with engaging driving experience. Good build quality and modern interior. European-influenced design.",
    reliabilityIssues:
      "Generally reliable. Transmission fluid condition important to check. Some reports of engine issues in older models. Regular service critical.",
    notes: "Fun driving dynamics. Available sedan and hatchback. Good value used.",
  },
  {
    make: "Subaru",
    model: "Forester",
    description:
      "Compact crossover with standard all-wheel drive and good ground clearance. Practical for NZ roads with capable handling.",
    reliabilityIssues:
      "Good reliability overall. Head gasket concerns in some generations. Oil leaks possible. Check service history. Newer models improved.",
    notes: "Standard all-wheel drive. Good clearance. Popular for families and outdoors.",
  },
  {
    make: "Mitsubishi",
    model: "ASX",
    description:
      "Compact SUV with good value proposition and practical layout. Available all-wheel drive for NZ conditions. Growing in popularity.",
    reliabilityIssues:
      "Generally reliable. Some transmission issues reported. Engine generally sound. Regular maintenance critical. Check pre-purchase condition.",
    notes: "Good value compact SUV. Available FWD and AWD. Practical layout.",
  },
  {
    make: "Honda",
    model: "Vezel",
    description:
      "Compact crossover with practical interior and good fuel economy. Strong Honda reliability reputation. Growing market presence.",
    reliabilityIssues:
      "Good reliability record. Some reports of transmission issues in certain years. Engine generally reliable. Regular maintenance recommended.",
    notes: "Good fuel economy. Practical interior. Honda reliability reputation.",
  },
  {
    make: "Ford",
    model: "Everest",
    description:
      "Large 7-seater SUV with good towing and off-road capability. Spacious interior perfect for families. Popular in NZ for lifestyle use.",
    reliabilityIssues:
      "Generally reliable. Transmission issues reported in some years. Engine can be prone to problems. Check transmission smooth operation.",
    notes: "Large spacious SUV. Good for families. Towing capability solid.",
  },
  {
    make: "Toyota",
    model: "Alphard",
    description:
      "Premium large minivan with luxury features and spacious interior. Imported primarily from Japan. Popular for families and small business use.",
    reliabilityIssues:
      "Generally reliable with proper maintenance. V6 engine solid. Check transmission fluid condition. Parts availability limited to specialists.",
    notes: "Luxury minivan features. Imported from Japan. Spacious and comfortable.",
  },
  {
    make: "Subaru",
    model: "Legacy",
    description:
      "Midsize sedan with standard all-wheel drive and solid build quality. Comfortable for families with practical trunk space.",
    reliabilityIssues:
      "Good overall reliability. Head gasket concerns in older models. Oil leaks possible. Check service history. Newer models more reliable.",
    notes: "Standard all-wheel drive. Comfortable midsize sedan. Good for NZ conditions.",
  },
  {
    make: "Hyundai",
    model: "Kona",
    description:
      "Compact SUV with modern design and good value. Practical for daily use with available all-wheel drive. Strong warranty coverage.",
    reliabilityIssues:
      "Newer model with improving reliability track record. Warranty is major advantage. Some early units had minor issues. Regular maintenance important.",
    notes: "Excellent warranty on newer models. Good value. Available FWD and AWD.",
  },
  {
    make: "Mazda",
    model: "Atenza",
    description:
      "Midsize sedan with Mazda's 'zoom-zoom' driving philosophy. Quality interior and engaging driving dynamics. European-influenced styling.",
    reliabilityIssues:
      "Generally reliable. Transmission fluid condition should be monitored. Some reports of engine issues in older models. Regular service key.",
    notes: "Fun to drive for midsize. Good interior quality. Engaging dynamics.",
  },
  {
    make: "Subaru",
    model: "Levorg",
    description:
      "Sports wagon with standard all-wheel drive and turbocharged engine. Practical family car with performance credentials.",
    reliabilityIssues:
      "Turbo engine requires good maintenance. Head gasket issues possible. Oil leaks can occur. Regular fluid changes important. Performance upkeep needed.",
    notes: "Performance wagon appeal. Standard all-wheel drive. Good for enthusiasts.",
  },
  {
    make: "Toyota",
    model: "Yaris Cross",
    description:
      "Small crossover SUV based on Yaris platform. Compact size with raised driving position. Good fuel economy and practical interior.",
    reliabilityIssues:
      "New model with solid reliability so far. Hybrid option proven. Regular maintenance recommended. Limited long-term data available.",
    notes: "Compact crossover trend. Hybrid available. Good fuel economy. Modern features.",
  },
  {
    make: "Toyota",
    model: "Highlander",
    description:
      "Large 7-seater SUV with powerful V6 and excellent reliability. Spacious interior for families. Premium comfort and features.",
    reliabilityIssues:
      "Excellent reliability. V6 engine proven and durable. Regular maintenance keeps these running well. Very few common issues.",
    notes: "Spacious for families. Excellent reliability. Good resale value.",
  },
  {
    make: "Volkswagen",
    model: "Tiguan",
    description:
      "European compact SUV with quality interior and good driving dynamics. Modern features and practical layout.",
    reliabilityIssues:
      "Generally reliable but service costs higher than Asian brands. Early diesel models affected by emissions issues. Regular maintenance important.",
    notes: "European quality and design. Higher service costs. Good driving dynamics.",
  },
  {
    make: "Honda",
    model: "Odyssey",
    description:
      "Premium 7-seater minivan with luxury features and excellent interior. Comfortable family vehicle with modern technology.",
    reliabilityIssues:
      "Generally reliable. Transmission can have issues in some years. Engine generally solid. Regular maintenance important for longevity.",
    notes: "Luxury minivan features. Comfortable interior. Good for families.",
  },
  {
    make: "Toyota",
    model: "Vellfire",
    description:
      "Premium large minivan with luxury appointments and spacious interior. Imported from Japan. Popular for families and small business.",
    reliabilityIssues:
      "Generally very reliable. V6 engine solid. Regular maintenance important. Parts availability through specialists. Check service history.",
    notes: "Premium minivan imported from Japan. Luxury features. Spacious and comfortable.",
  },
  {
    make: "Mazda",
    model: "Premacy",
    description:
      "Compact minivan with flexible seating and good fuel economy. Practical for families needing extra seats. Reliable Mazda engineering.",
    reliabilityIssues:
      "Generally reliable. Transmission fluid condition important. Engine usually solid. Regular maintenance key to longevity. Check service history.",
    notes: "Practical family minivan. Good fuel economy. Flexible seating options.",
  },
  {
    make: "Toyota",
    model: "Sienta",
    description:
      "Compact 7-seater minivan with excellent space utilization. Fuel-efficient and practical for families. Growing in popularity.",
    reliabilityIssues:
      "Generally reliable. Regular maintenance important. Engine generally solid. Check transmission fluid condition. Hybrid option proven.",
    notes: "Excellent space efficiency. Good fuel economy. Practical family vehicle.",
  },
  {
    make: "Land Rover",
    model: "Range Rover",
    description:
      "Premium large SUV with luxury interior and advanced all-wheel drive system. Known for off-road capability and refined comfort. Status symbol with strong presence.",
    reliabilityIssues:
      "Common issues include electrical faults, transmission problems, and suspension wear. Expensive repairs. Many sensors can fail. Regular servicing essential.",
    notes: "Luxury brand with premium maintenance costs. Full service history critical. Check for any warning lights or electrical issues.",
  },
  {
    make: "MG",
    model: "ZS",
    description:
      "Affordable compact SUV offering good value and modern features. Practical layout with decent interior quality. Growing market presence in NZ.",
    reliabilityIssues:
      "Newer brand in NZ so long-term reliability not fully established. Early reports reasonable. Warranty coverage varies. Regular maintenance important.",
    notes: "Good value proposition for budget-conscious buyers. Warranty period should be checked. Parts availability limited but improving.",
  },
  {
    make: "Holden",
    model: "Colorado",
    description:
      "Australian mid-size dual-cab ute with good towing capacity. Practical work vehicle and lifestyle platform. Discontinued 2017 but well-regarded.",
    reliabilityIssues:
      "Generally reliable Australian engineering. Some transmission issues reported in certain years. Diesel engines robust. Check for any electrical issues.",
    notes: "Australian-built with good spare parts availability. Towing capability solid. Manual and automatic options available.",
  },
  {
    make: "Kia",
    model: "Sorento",
    description:
      "Mid-size 7-seater SUV with attractive design and good value. Comfortable interior and practical features. Growing reliability reputation.",
    reliabilityIssues:
      "Newer models very reliable with strong warranty. Earlier models improved with time. Warranty is major advantage. Regular maintenance important.",
    notes: "Excellent warranty on newer models. Spacious 7-seater option. Good value family SUV. Available FWD and AWD.",
  },
  {
    make: "Mazda",
    model: "3",
    description:
      "Compact hatchback/sedan with engaging driving dynamics and modern design. Good fuel economy, practical interior, and fun-to-drive reputation.",
    reliabilityIssues:
      "Generally reliable. Transmission fluid condition should be monitored regularly. Some earlier models may have minor issues. Modern versions improved.",
    notes: "Available sedan and hatchback. Popular choice. Good driving experience. Aftermarket support excellent.",
  },
  {
    make: "Haval",
    model: "H6",
    description:
      "Chinese compact SUV offering good value and practical layout. Modern features and decent performance. Growing presence in Asia and NZ.",
    reliabilityIssues:
      "Relatively new brand so long-term reliability not fully established. Early reports acceptable. Warranty coverage variable. Parts availability limited.",
    notes: "Budget-friendly option with decent features. Warranty period varies by dealer. Service network still developing.",
  },
  {
    make: "Hyundai",
    model: "Ioniq",
    description:
      "Hybrid sedan focusing on fuel efficiency and practicality. Excellent running costs with modern features. Growing popularity in eco-conscious market.",
    reliabilityIssues:
      "Hybrid system very reliable. Generally solid mechanical components. Warranty coverage strong. Regular maintenance keeps these efficient.",
    notes: "Outstanding fuel economy. Hybrid technology proven. Excellent warranty benefits. Good for eco-minded buyers.",
  },
  {
    make: "Mini",
    model: "Cooper",
    description:
      "Iconic compact hatchback with distinctive styling and engaging driving dynamics. Fun-to-drive character with modern interior. Popular lifestyle choice.",
    reliabilityIssues:
      "Service costs can be high. Common issues: turbocharger problems, transmission issues, electrical gremlins. Parts more expensive than mainstream brands.",
    notes: "Fun driving experience. Strong enthusiast community. Parts and labor pricey. Extended warranty recommended.",
  },
  {
    make: "Volkswagen",
    model: "Amarok",
    description:
      "German mid-size dual-cab ute with quality engineering and good towing capacity. Practical work vehicle with refined cabin. Premium pickup option.",
    reliabilityIssues:
      "Generally reliable German engineering. Diesel engines robust. Some transmission issues possible. Service costs higher than Asian alternatives.",
    notes: "Quality German construction. Good towing capability. Premium service costs. Parts availability good for popular models.",
  },
  {
    make: "Nissan",
    model: "Skyline",
    description:
      "Japanese performance sedan/coupe with strong engine and sporty credentials. Popular with enthusiasts and tuning culture. Legendary Japanese icon.",
    reliabilityIssues:
      "Reliability varies with age and maintenance history. Turbo engines require good maintenance. Some models prone to transmission issues. Regular servicing critical.",
    notes: "Popular for modifications and tuning. Parts availability good for common models. Performance enthusiast favorite.",
  },
  {
    make: "Nissan",
    model: "March",
    description:
      "Affordable compact city hatchback with excellent fuel economy. Practical size for urban driving and tight parking. Reliable budget option.",
    reliabilityIssues:
      "Generally reliable with good longevity if maintained. CVT transmission in modern models performs well. Occasional engine issues in older examples.",
    notes: "Excellent city car. Low running costs. Parts affordable. Popular first car option.",
  },
  {
    make: "Toyota",
    model: "SAI",
    description:
      "Mid-size hybrid sedan imported from Japan. Excellent fuel economy with Toyota reliability. Practical for daily commuting and fuel savings.",
    reliabilityIssues:
      "Hybrid system very reliable. Generally solid mechanical components. Battery typically lasts 10+ years. Regular maintenance keeps these running well.",
    notes: "Excellent fuel economy (4-5L/100km). Hybrid technology proven and reliable. Parts availability through specialists.",
  },
  {
    make: "Lexus",
    model: "IS",
    description:
      "Premium compact sedan with luxury features and sport-oriented handling. Known for reliability and refined driving experience. High-quality interior.",
    reliabilityIssues:
      "Excellent reliability overall. Very dependable for a luxury brand. Occasional electrical or suspension issues. Service costs premium. Parts expensive.",
    notes: "Luxury reliability. Excellent resale value. Premium but justifiable costs. Full service history important.",
  },
  {
    make: "Mazda",
    model: "CX-8",
    description:
      "Mid-size 3-row SUV with premium interior and engaging driving dynamics. Spacious for families while maintaining fun-to-drive character.",
    reliabilityIssues:
      "Generally reliable. Some reports of transmission or engine concerns. Modern versions improved. Pre-purchase inspection recommended.",
    notes: "Premium cabin quality. Spacious 3-row seating. Good driving experience. Available AWD option.",
  },
  {
    make: "Land Rover",
    model: "Discovery",
    description:
      "Large premium SUV with excellent off-road capability and spacious interior. Comfortable for families with good towing capacity.",
    reliabilityIssues:
      "Common issues: electrical faults, transmission problems, suspension wear, diesel engine issues. Expensive repairs. Specialist service recommended.",
    notes: "Luxury off-road capability. Premium maintenance costs. Full service history essential. Check for electrical issues.",
  },
  {
    make: "Toyota",
    model: "Noah",
    description:
      "Compact 7-seater minivan with flexible seating and practical layout. Fuel-efficient for a family vehicle. Imported from Japan.",
    reliabilityIssues:
      "Generally reliable. Regular maintenance important. Engine generally solid. Transmission fluid condition should be checked. Hybrid option improving.",
    notes: "Practical family minivan. Good fuel economy. Space-efficient design. Growing in NZ market.",
  },
  {
    make: "Mazda",
    model: "CX-9",
    description:
      "Large 3-row premium SUV with refined interior and engaging driving dynamics. Spacious cabin with comfortable seating for families.",
    reliabilityIssues:
      "Generally reliable. Transmission fluid condition should be monitored. Some reports of minor issues in older models. Regular service important.",
    notes: "Premium cabin quality. Spacious 3-row seating. Fun to drive for large SUV. Good value used option.",
  },
  {
    make: "Mazda",
    model: "2",
    description:
      "Compact hatchback with Mazda's fun-to-drive philosophy and modern styling. Good fuel economy and practical interior. Urban-focused vehicle.",
    reliabilityIssues:
      "Generally reliable. Some older models may have minor issues. Engine usually solid. Transmission condition should be checked on used units.",
    notes: "Fun driving dynamics. Compact for city parking. Good fuel economy. Affordable running costs.",
  },
  {
    make: "Toyota",
    model: "Vitz",
    description:
      "Small city hatchback with excellent fuel economy and practicality. Popular worldwide with reliable Toyota engineering. Affordable and economical choice.",
    reliabilityIssues:
      "Very reliable. Generally low-cost repairs. Occasional CVT transmission issues in some models but rare. Engine very durable.",
    notes: "Excellent for city driving. Very affordable running costs. Parts inexpensive. Popular first-car option.",
  },
  {
    make: "Tesla",
    model: "Model 3",
    description:
      "Premium electric sedan with advanced technology and impressive acceleration. Superb autopilot features and minimalist interior design.",
    reliabilityIssues:
      "Build quality inconsistent (panel gaps reported). Battery warranty 8 years/160,000km. Service mostly through Tesla service centers. Limited traditional mechanic compatibility.",
    notes: "Exceptional performance. Cutting-edge tech. Charging infrastructure rapidly improving. Premium pricing.",
  },
  {
    make: "Volkswagen",
    model: "Touareg",
    description:
      "Premium large SUV with luxury features and sophisticated design. Spacious interior and refined driving experience. High-quality German engineering.",
    reliabilityIssues:
      "Service costs can be high. Common issues: electrical faults, transmission problems, diesel engine concerns. Regular maintenance critical.",
    notes: "Luxury SUV with premium features. Service costs higher than Japanese brands. Full service history important.",
  },
  {
    make: "Toyota",
    model: "Estima",
    description:
      "Premium large minivan with luxury features and spacious interior. Imported from Japan with advanced technology. Popular for families and business use.",
    reliabilityIssues:
      "Generally very reliable. V6 engine solid and durable. Regular maintenance important. Parts availability through specialists. Check service history.",
    notes: "Luxury minivan features. Spacious and comfortable. Imported from Japan. Premium quality finish.",
  },
  {
    make: "Nissan",
    model: "Lafesta",
    description:
      "Compact 7-seater MPV with flexible interior and practical layout. Good space efficiency for families. Growing in popularity.",
    reliabilityIssues:
      "Generally reliable. CVT transmission condition should be checked. Engine generally solid. Regular fluid changes recommended.",
    notes: "Practical for families. Space-efficient design. Flexible seating options. Good visibility.",
  },
  {
    make: "Suzuki",
    model: "Ignis",
    description:
      "Quirky compact crossover with unique design and fun driving character. Good ground clearance with practical interior. Budget-friendly option.",
    reliabilityIssues:
      "Generally reliable. Engine solid and efficient. Occasional CVT issues but uncommon. Regular maintenance keeps these running well.",
    notes: "Fun and distinctive style. Good ground clearance. Affordable budget option. Low running costs.",
  },
  {
    make: "Nissan",
    model: "NV200",
    description:
      "Compact commercial van with practical layout and good loading capacity. Versatile for small business use. Growing personal use market.",
    reliabilityIssues:
      "Generally reliable workhorse. Diesel engines robust. Check transmission condition. Mechanical simplicity aids longevity.",
    notes: "Practical work vehicle. Good fuel economy for van. Parts availability good. Workhorse reputation.",
  },
  {
    make: "Mazda",
    model: "CX-30",
    description:
      "Compact SUV with stylish design and fun driving dynamics. Good fuel economy with practical cargo space. Modern features in tight package.",
    reliabilityIssues:
      "Generally reliable. Some reports of transmission or engine concerns. Regular maintenance important. Newer models more proven.",
    notes: "Stylish compact SUV. Fun to drive. Good fuel economy. Available AWD option.",
  },
  {
    make: "Kia",
    model: "Seltos",
    description:
      "Compact SUV with modern styling and affordable price point. Good interior quality and practical features. Growing market presence.",
    reliabilityIssues:
      "Newer model with improving reliability. Warranty is major advantage. Regular maintenance recommended. Parts availability improving.",
    notes: "Good value compact SUV. Strong warranty coverage. Modern features. Available FWD and AWD.",
  },
  {
    make: "BMW",
    model: "X5",
    description:
      "Premium large SUV with luxury features and strong performance. Spacious interior with advanced technology. Status symbol with off-road capability.",
    reliabilityIssues:
      "Expensive repairs. Common issues: cooling system failures, electrical gremlins, transmission problems. High maintenance costs. Service expensive.",
    notes: "Luxury brand with associated costs. Premium features throughout. Full service history essential. Specialist service recommended.",
  },
  {
    make: "Audi",
    model: "A4",
    description:
      "Premium compact sedan with sophisticated design and solid engineering. Quality interior with modern technology. German luxury at accessible price point.",
    reliabilityIssues:
      "Generally reliable but service costs high. Common issues: electrical faults, transmission problems, suspension wear. Regular servicing critical.",
    notes: "Premium sedan with luxury features. Service costs higher than mainstream. Full history important. Quality build throughout.",
  },
  {
    make: "Suzuki",
    model: "Vitara",
    description:
      "Compact SUV with fun driving dynamics and good value proposition. Available all-wheel drive for various conditions. Practical family vehicle.",
    reliabilityIssues:
      "Generally reliable. Engine solid. CVT transmission performs well generally. Regular maintenance keeps these running smoothly.",
    notes: "Good value compact SUV. Fun driving experience. Available FWD and AWD. Affordable running costs.",
  },
  {
    make: "Mitsubishi",
    model: "Eclipse",
    description:
      "Sporty coupe/sedan with performance styling and engaging driving experience. Popular with enthusiasts and tuning culture.",
    reliabilityIssues:
      "Reliability varies with age and maintenance. Turbocharged models need good care. Transmission issues possible. Regular servicing important.",
    notes: "Performance-oriented design. Popular for modifications. Enthusiast community strong. Fuel costs moderate.",
  },
  {
    make: "Mazda",
    model: "BT-50",
    description:
      "Mid-size dual-cab ute with good towing capacity and practical build. Solid work vehicle with decent comfort for daily driving.",
    reliabilityIssues:
      "Generally reliable. Diesel engines robust when maintained. Check transmission oil and diff condition. Regular servicing keeps these solid.",
    notes: "Good work ute. Towing capacity solid. Single and dual cab available. Fuel-efficient diesel.",
  },
  {
    make: "Nissan",
    model: "Juke",
    description:
      "Compact crossover with distinctive styling and practical layout. Good ground clearance with fun driving character. Urban-focused SUV.",
    reliabilityIssues:
      "Generally reliable. CVT transmission condition should be checked. Engine generally solid. Regular maintenance important.",
    notes: "Distinctive funky styling. Good for city driving. CVT transmission requires monitoring. Practical for singles and couples.",
  },
  {
    make: "Honda",
    model: "Freed",
    description:
      "Compact 7-seater MPV with flexible seating and practical layout. Good space efficiency for families. Reliable Honda engineering.",
    reliabilityIssues:
      "Very reliable overall. Engine generally solid. Occasional transmission issues in some years. Regular maintenance keeps these running well.",
    notes: "Excellent space for size. Practical family vehicle. Good fuel economy. Flexible seating options.",
  },
  {
    make: "MG",
    model: "HS",
    description:
      "Chinese mid-size SUV offering good value and modern features. Spacious interior with practical layout. Growing presence in Asia and NZ.",
    reliabilityIssues:
      "Relatively newer brand so long-term data limited. Early reports positive. Warranty varies. Regular maintenance important.",
    notes: "Good value mid-size SUV. Modern features standard. Warranty varies by dealer. Service network developing.",
  },
  {
    make: "Skoda",
    model: "Kodiaq",
    description:
      "Czech mid-size 7-seater SUV with practical design and good value. Spacious interior perfect for families. Quality engineering from VW Group.",
    reliabilityIssues:
      "Generally reliable. Service costs reasonable compared to some European brands. Regular maintenance important. Parts availability good.",
    notes: "Practical 7-seater option. Good space efficiency. Quality build. VW Group parts network accessible.",
  },
  {
    make: "Honda",
    model: "Shuttle",
    description:
      "Compact 7-seater MPV with practical flexible interior. Efficient space utilization perfect for families. Reliable Honda engineering.",
    reliabilityIssues:
      "Very reliable. Engine generally solid. Occasional CVT transmission issues but uncommon. Regular service keeps these running well.",
    notes: "Excellent interior flexibility. Good fuel economy. Practical family vehicle. Space-efficient design.",
  },
  {
    make: "Chery",
    model: "Tiggo",
    description:
      "Chinese compact SUV offering affordable entry point to SUV market. Practical layout with modern styling. Budget-friendly option.",
    reliabilityIssues:
      "Chinese brand so long-term reliability not fully established. Early reports acceptable. Limited warranty typical. Parts availability sparse.",
    notes: "Budget-friendly SUV entry point. Basic features. Warranty period typically shorter. Service network limited.",
  },
  {
    make: "Land Rover",
    model: "Defender",
    description:
      "Iconic rugged SUV with legendary off-road capability and utilitarian design. Spacious and practical for adventure. Cultural icon.",
    reliabilityIssues:
      "Reliability varies with age. Older models can have issues. Newer versions more refined. Common: electrical faults, rust. Regular maintenance essential.",
    notes: "Legendary off-road icon. Rugged capability. Service costs can be high. Parts availability improving.",
  },
  {
    make: "Kia",
    model: "Carnival",
    description:
      "Premium large minivan with luxury features and spacious seating for eight. Comfortable and well-appointed for family trips. Growing market presence.",
    reliabilityIssues:
      "Newer model with good early reports. Warranty is strong advantage. Regular maintenance important. Parts availability improving.",
    notes: "Luxurious family minivan. Excellent space for eight passengers. Strong warranty. Modern technology throughout.",
  },
  {
    make: "Peugeot",
    model: "3008",
    description:
      "French mid-size SUV with stylish design and good driving dynamics. Modern interior with quality materials. European flair.",
    reliabilityIssues:
      "Generally reliable but service costs higher than Asian brands. Regular maintenance critical. Electrical issues possible. Parts more expensive.",
    notes: "Stylish European design. Quality interior finish. Service costs moderate but higher than Asian. Fuel-efficient.",
  },
  {
    make: "Lexus",
    model: "NX",
    description:
      "Premium compact SUV with luxury features and excellent reliability. Spacious and comfortable with advanced technology. High-quality finish.",
    reliabilityIssues:
      "Excellent reliability overall. Very dependable for a luxury brand. Occasional electrical or suspension issues. Service premium. Parts expensive.",
    notes: "Luxury reliability. Premium features throughout. Excellent resale value. Full service history important.",
  },
  {
    make: "Renault",
    model: "Captur",
    description:
      "French compact SUV with practical layout and good value proposition. Stylish European design with modern features. Budget-conscious option.",
    reliabilityIssues:
      "Generally reliable. Service costs reasonable. Regular maintenance important. Parts availability through dealers. Engine generally solid.",
    notes: "Good value compact SUV. Practical European design. Fuel-efficient engines. Parts availability decent.",
  },
  {
    make: "Audi",
    model: "Q5",
    description:
      "Premium compact SUV with luxury features and sophisticated design. Spacious and comfortable with advanced technology. High-quality materials.",
    reliabilityIssues:
      "Generally reliable but service costs high. Common issues: electrical faults, transmission problems, suspension wear. Regular servicing critical.",
    notes: "Premium SUV with luxury features. Service costs higher than mainstream. Full history important. Specialist service recommended.",
  },
  {
    make: "Ford",
    model: "Transit",
    description:
      "Commercial van with spacious cargo area and practical design. Robust workhorse for trades and small business. Popular globally.",
    reliabilityIssues:
      "Generally reliable. Engine typically durable. Check transmission condition. Mechanical simplicity aids longevity. Regular maintenance important.",
    notes: "Practical workhorse. Good cargo space. Fuel economy reasonable for size. Parts widely available.",
  },
  {
    make: "Honda",
    model: "CR-V",
    description:
      "Compact crossover with spacious interior and reliable performance. One of the original crossovers. Great for families and active lifestyles.",
    reliabilityIssues:
      "Excellent reliability record. Some 2007-2012 models reported engine piston ring issues causing oil consumption. Generally very dependable.",
    notes: "Available FWD and AWD. Hybrid models offer good value. Spacious and practical.",
  },
  {
    make: "Mini",
    model: "Countryman",
    description:
      "Compact premium crossover with Mini's distinctive styling and fun character. Practical layout with modern features. Lifestyle choice.",
    reliabilityIssues:
      "Service costs can be high. Common issues: turbocharger problems, transmission issues, electrical gremlins. Parts more expensive than mainstream.",
    notes: "Fun driving character. Stylish and distinctive. Parts and labor pricey. Extended warranty recommended.",
  },
  {
    make: "Subaru",
    model: "BRZ",
    description:
      "Lightweight sports car with balanced handling and affordable performance. Fun driving dynamics with engaging engine. Popular with enthusiasts.",
    reliabilityIssues:
      "Generally reliable. Engine prone to carbon buildup on some years. Clutch wear common if driven hard. Maintenance straightforward.",
    notes: "Fun sports car at reasonable price. Manual transmission. Good resale among enthusiasts. Performance-focused.",
  },
];


export async function seedModelDescriptions() {
  console.log("Seeding vehicle model descriptions...");

  let inserted = 0;
  let skipped = 0;

  for (const description of modelDescriptions) {
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

  console.log(`✓ Inserted ${inserted} model descriptions, skipped ${skipped} duplicates`);
}

// Run if called directly
seedModelDescriptions().then(() => {
  process.exit(0);
});
