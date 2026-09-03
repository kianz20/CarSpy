"use client";

import { useActionState, useState, type FormEvent } from "react";
import { SelectField } from "@/components/select-field";
import { saveSettingsAction, type SaveSettingsState } from "@/lib/actions/settings";
import type { OwnershipDefaults } from "@/lib/settings";

const OWNERSHIP_YEAR_OPTIONS = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} year${n === 1 ? "" : "s"}` }));

const initialState: SaveSettingsState = {};

export function SettingsForm({ defaults }: { defaults: OwnershipDefaults }) {
  const [state, formAction, pending] = useActionState(saveSettingsAction, initialState);
  const [ownershipYears, setOwnershipYears] = useState(String(defaults.ownershipYears));
  const [financeEnabled, setFinanceEnabled] = useState(defaults.financeEnabled);
  const [depositError, setDepositError] = useState(false);

  function handleFormChange(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    setFinanceEnabled(formData.get("financeEnabled") !== "false");
    if (String(formData.get("deposit") ?? "").trim() !== "") setDepositError(false);
  }

  function handleDepositInvalid(event: FormEvent<HTMLInputElement>) {
    event.preventDefault();
    setDepositError(true);
  }

  return (
    <form action={formAction} onChange={handleFormChange} className="flex flex-col gap-4">
      <input type="hidden" name="ownershipYears" value={ownershipYears} readOnly />
      <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
        <span>Default ownership period</span>
        <SelectField value={ownershipYears} onChange={setOwnershipYears} options={OWNERSHIP_YEAR_OPTIONS} showPlaceholderOption={false} />
        <span className="text-[10px] font-normal text-muted/80">Used for every ownership-cost estimate unless a link overrides it</span>
      </label>

      <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
        <span>How many km do you drive per year?</span>
        <input type="number" name="annualKm" defaultValue={defaults.annualKm} min={0} step={1000} className="field" />
      </label>

      <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
        <div className="flex min-h-[30px] items-center gap-2">
          <input
            type="checkbox"
            name="financeEnabled"
            value="true"
            defaultChecked={defaults.financeEnabled}
            className="h-4 w-4 rounded border-border accent-accent"
          />
          <span className="text-sm font-normal text-foreground/80">Do you usually finance your car?</span>
        </div>
        {/* Same checked/hidden-fallback pairing as search-form.tsx — an
            unchecked checkbox submits nothing, so this is what distinguishes
            "explicitly off" from "never touched". */}
        <input type="hidden" name="financeEnabled" value="false" />
      </label>

      {financeEnabled && (
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          <span>Default deposit ($)</span>
          <input
            type="number"
            name="deposit"
            defaultValue={defaults.deposit ?? ""}
            min={0}
            step={500}
            required
            onInvalid={handleDepositInvalid}
            className={`field ${depositError ? "!border-red-500" : ""}`}
          />
          {depositError && <span className="text-[10px] font-normal text-red-500">Enter a deposit before saving</span>}
        </label>
      )}

      {state.error && <p className="text-xs font-medium text-red-500">{state.error}</p>}
      {state.success && <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Saved!</p>}

      <button type="submit" disabled={pending} className="btn btn-primary py-2.5">
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
