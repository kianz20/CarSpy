/**
 * Canonical body-type / powertrain values for the deal-finder's search
 * dropdowns (PLAN.md Phase 2). Kept as simple seed data, not a free-text/
 * synonym matcher — decided that structured dropdowns beat parsing loose
 * queries like "find me a good hybrid" for v1 (no ambiguity to resolve,
 * matches how every other car search UI works).
 *
 * Scope boundary: these values answer "what kind of car is this?" only.
 * Subjective quality words ("reliable", "good") are never modelled here —
 * they're ranking signals for the Phase 5 valuation model, not filters.
 */

export type CategorySeedRow = {
  kind: "body_type" | "powertrain";
  value: string;
  label: string;
  sortOrder: number;
};

export const CATEGORY_SEED: CategorySeedRow[] = [
  // --- Body types ---
  { kind: "body_type", value: "ute", label: "Ute", sortOrder: 0 },
  { kind: "body_type", value: "suv", label: "SUV / 4x4", sortOrder: 1 },
  { kind: "body_type", value: "hatch", label: "Hatchback", sortOrder: 2 },
  { kind: "body_type", value: "sedan", label: "Sedan", sortOrder: 3 },
  { kind: "body_type", value: "wagon", label: "Wagon", sortOrder: 4 },
  { kind: "body_type", value: "van", label: "Van", sortOrder: 5 },
  { kind: "body_type", value: "people_mover", label: "People Mover", sortOrder: 6 },
  { kind: "body_type", value: "coupe", label: "Coupe", sortOrder: 7 },
  { kind: "body_type", value: "convertible", label: "Convertible", sortOrder: 8 },

  // --- Powertrains ---
  { kind: "powertrain", value: "petrol", label: "Petrol", sortOrder: 0 },
  { kind: "powertrain", value: "diesel", label: "Diesel", sortOrder: 1 },
  { kind: "powertrain", value: "hybrid", label: "Hybrid", sortOrder: 2 },
  { kind: "powertrain", value: "phev", label: "Plug-in Hybrid", sortOrder: 3 },
  { kind: "powertrain", value: "ev", label: "Electric", sortOrder: 4 },
];
