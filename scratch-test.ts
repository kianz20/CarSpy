import { crawlArmstrongsDealer } from "./src/lib/crawler/adapters/armstrongs";

async function main() {
  const results = await crawlArmstrongsDealer("https://www.armstrongs.co.nz", new Set());
  console.log("Parsed", results.length, "listings total");
  console.log(JSON.stringify(results.slice(0, 5), null, 2));

  const missingBodyType = results.filter((r) => !r.bodyType).length;
  const missingTransmission = results.filter((r) => !r.transmission).length;
  const missingPowertrain = results.filter((r) => !r.powertrain).length;
  const missingMileage = results.filter((r) => r.mileageKm === undefined).length;
  const missingVin = results.filter((r) => !r.vin).length;
  console.log({ total: results.length, missingBodyType, missingTransmission, missingPowertrain, missingMileage, missingVin });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
