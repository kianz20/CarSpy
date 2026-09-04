import {
  DIESEL_PRICE_PER_LITRE,
  ELECTRICITY_PRICE_PER_KWH,
  PETROL_PRICE_PER_LITRE,
  RUC_PER_1000KM,
} from "./constants";
import { estimateConsumption } from "./consumption";

/**
 * Fuel/energy + road user charges cost over a driving horizon. RUC is a
 * real, easy-to-miss NZ-specific cost: diesel and EV owners pay it directly
 * (it's not baked into the pump price like petrol's fuel excise duty is),
 * and PHEVs pay a reduced rate — see constants.ts for why. Left out of this
 * model, a diesel/EV listing would look artificially cheap to run.
 */
export function estimateFuelCost(
  bodyType: string | undefined,
  powertrain: string | undefined,
  totalKm: number,
  engine?: string,
  matchedFuelEconomyL100km?: number,
): { fuelCost: number; rucCost: number; total: number } {
  const { litresPer100Km, kwhPer100Km } = estimateConsumption(bodyType, powertrain, engine, matchedFuelEconomyL100km);

  const fuelPricePerLitre = powertrain === "diesel" ? DIESEL_PRICE_PER_LITRE : PETROL_PRICE_PER_LITRE;
  const litreCost = litresPer100Km ? (litresPer100Km / 100) * totalKm * fuelPricePerLitre : 0;
  const electricityCost = kwhPer100Km ? (kwhPer100Km / 100) * totalKm * ELECTRICITY_PRICE_PER_KWH : 0;
  const fuelCost = litreCost + electricityCost;

  const rucRate = RUC_PER_1000KM[(powertrain as keyof typeof RUC_PER_1000KM) ?? "petrol"] ?? 0;
  const rucCost = (totalKm / 1000) * rucRate;

  return { fuelCost, rucCost, total: fuelCost + rucCost };
}
