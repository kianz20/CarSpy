"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { saveUserDefaults, saveGuestDefaults, type OwnershipDefaults } from "@/lib/settings";

export type SaveSettingsState = { error?: string; success?: boolean };

export async function saveSettingsAction(
  _prevState: SaveSettingsState,
  formData: FormData,
): Promise<SaveSettingsState> {
  const rawOwnershipYears = Number(formData.get("ownershipYears"));
  const ownershipYears = Number.isFinite(rawOwnershipYears) ? Math.min(Math.max(Math.round(rawOwnershipYears), 1), 5) : 3;

  const rawAnnualKm = Number(formData.get("annualKm"));
  if (!Number.isFinite(rawAnnualKm) || rawAnnualKm < 0) return { error: "Enter a valid annual km figure" };

  // Same checkbox + hidden-fallback pairing as search-form.tsx — `.get()`
  // returns the checkbox's value ("true") first when checked, or falls
  // through to the hidden "false" when it isn't.
  const financeEnabled = formData.get("financeEnabled") !== "false";

  const rawDeposit = String(formData.get("deposit") ?? "").trim();
  if (financeEnabled && !rawDeposit) return { error: "Enter a deposit — it's needed for the finance estimate" };
  const deposit = financeEnabled && rawDeposit ? Number(rawDeposit) : undefined;
  if (deposit !== undefined && (!Number.isFinite(deposit) || deposit < 0)) {
    return { error: "Enter a valid deposit amount" };
  }

  const defaults: OwnershipDefaults = { ownershipYears, annualKm: rawAnnualKm, financeEnabled, deposit };

  const user = await getCurrentUser();
  if (user) await saveUserDefaults(user.id, defaults);
  else await saveGuestDefaults(defaults);

  revalidatePath("/");
  revalidatePath("/settings");

  return { success: true };
}
