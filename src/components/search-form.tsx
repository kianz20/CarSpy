"use client";

import Form from "next/form";
import Link from "next/link";
import { useState, type FormEvent, type MouseEvent } from "react";
import { useFormStatus } from "react-dom";
import { SelectField, type SelectFieldOption } from "@/components/select-field";
import { MultiSelectField } from "@/components/multi-select-field";
import { parseListParam, toListParam } from "@/lib/listParams";

type Option = { value: string; label: string };

// The plain, uncontrolled <input> filter fields — the five dropdowns
// (bodyType/powertrain/make/transmission/region) are controlled React state
// instead (see below) since MultiSelectField renders its own listbox rather
// than a native <select>, so they're tracked separately from this list.
const NATIVE_FILTER_FIELD_NAMES = ["model", "minYear", "maxYear", "minPrice", "maxPrice", "maxMileageKm"] as const;

export function SearchForm({
  bodyTypes,
  powertrains,
  makes,
  regions,
  current,
}: {
  bodyTypes: Option[];
  powertrains: Option[];
  makes: string[];
  regions: string[];
  current: Record<string, string>;
}) {
  // The plain <input> fields below are uncontrolled (defaultValue, not
  // value) — plain HTML form semantics, which is what next/form's
  // GET-navigation needs. But that means a client-side navigation alone
  // (e.g. the Clear filters link) won't reset an already-mounted <input>'s
  // displayed value, since React only applies defaultValue on mount, not on
  // every re-render. Keying on the current filter state forces a remount
  // whenever the URL's filters actually change, so cleared/changed fields
  // visibly reset instead of showing stale selections.
  //
  // The key has to go on a wrapper, not on <Form> itself — next/form's own
  // docs explicitly call out that "passing a key prop to a string action is
  // not supported" (it interferes with Form's internal client-navigation
  // handling), which is exactly what broke when it was tried directly on Form.
  const formKey = new URLSearchParams(current).toString();

  // The five dropdowns are multi-select and controlled (MultiSelectField has
  // no native <select>/FormData participation of its own), so each needs a
  // hidden input per selected value to round-trip through next/form's GET
  // navigation (comma-joined into one param — see lib/listParams.ts), and
  // its state has to be resynced from `current` on the same
  // formKey-remount-render schedule as financeEnabled below (a key change
  // alone only resets *uncontrolled* DOM nodes, not state living here).
  const [bodyType, setBodyType] = useState(() => parseListParam(current.bodyType));
  const [powertrain, setPowertrain] = useState(() => parseListParam(current.powertrain));
  const [make, setMake] = useState(() => parseListParam(current.make));
  const [transmission, setTransmission] = useState(() => parseListParam(current.transmission));
  const [region, setRegion] = useState(() => parseListParam(current.region));

  // nativeHasFilters mirrors the plain-input fields' live values (not just
  // the URL's), so the Clear filters button appears as soon as the user
  // types/picks something — not only after they submit and the URL actually
  // changes. hasFilters below ORs this with the dropdown state, which is
  // already reactive on its own (no scan needed — see below).
  const hasAnyNativeFilter = (source: Record<string, string>) =>
    NATIVE_FILTER_FIELD_NAMES.some((name) => source[name]) || source.includeMotorcycles === "true";
  const [prevFormKey, setPrevFormKey] = useState(formKey);
  const [nativeHasFilters, setNativeHasFilters] = useState(hasAnyNativeFilter(current));
  if (formKey !== prevFormKey) {
    setPrevFormKey(formKey);
    setNativeHasFilters(hasAnyNativeFilter(current));
    setBodyType(parseListParam(current.bodyType));
    setPowertrain(parseListParam(current.powertrain));
    setMake(parseListParam(current.make));
    setTransmission(parseListParam(current.transmission));
    setRegion(parseListParam(current.region));
  }

  // Plain derived value, not stored state — bodyType/powertrain/etc. are
  // already React state, so this recomputes on every render for free
  // whenever any of them change (unlike the native fields, there's no
  // FormData scan needed since nothing here is uncontrolled).
  const hasFilters =
    nativeHasFilters ||
    [bodyType, powertrain, make, transmission, region].some((selected) => selected.length > 0);

  // Deposit is required (but only while finance is enabled — see below), and
  // the browser's own validation bubble is easy to miss/dismiss, so show our
  // own persistent message instead. onInvalid fires (and still blocks
  // submission) even with the bubble suppressed via preventDefault, so
  // nothing is lost by replacing it.
  const [depositError, setDepositError] = useState(false);

  // Drives whether the Deposit field renders at all: with finance off there's
  // no loan, so nothing to put a deposit toward. Resynced from `current`
  // alongside nativeHasFilters above (same render-time-reset rationale).
  const [financeEnabled, setFinanceEnabled] = useState(
    current.financeEnabled === "true",
  );
  if (formKey !== prevFormKey) {
    setFinanceEnabled(current.financeEnabled === "true");
  }

  function handleFormChange(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    // Only the plain-input filter fields count — the dropdowns are handled
    // by the `hasFilters` derivation above, not this scan.
    setNativeHasFilters(
      NATIVE_FILTER_FIELD_NAMES.some(
        (name) => String(formData.get(name) ?? "").trim() !== "",
      ) || formData.get("includeMotorcycles") === "true",
    );
    if (String(formData.get("deposit") ?? "").trim() !== "") {
      setDepositError(false);
    }
    // `.get()` returns the first same-named value in DOM order — the
    // checkbox (before its hidden fallback) when checked, so "true"/"false"
    // matches the checkbox's actual state.
    setFinanceEnabled(formData.get("financeEnabled") !== "false");
  }

  function handleDepositInvalid(event: FormEvent<HTMLInputElement>) {
    event.preventDefault();
    setDepositError(true);
  }

  // Drops every param, not just the filter keys — Clear filters is a full
  // reset back to the pre-search state (see page.tsx's hasSearched), which
  // only goes false once financeEnabled disappears from the URL entirely.
  const clearHref = "/";

  // If the fields were only edited but never submitted, the URL never
  // changes when this navigates to clearHref — so the formKey-remount reset
  // above won't fire. Reset every field directly so stale picks don't linger
  // even when Next's router cache re-renders identical output.
  function handleClear(event: MouseEvent<HTMLAnchorElement>) {
    const form = event.currentTarget.closest("form");
    for (const name of [...NATIVE_FILTER_FIELD_NAMES, "annualKm"] as const) {
      const field = form?.elements.namedItem(name);
      if (field instanceof HTMLInputElement) field.value = "";
    }
    for (const name of ["includeMotorcycles", "financeEnabled"] as const) {
      const checkbox = form?.querySelector<HTMLInputElement>(`input[name="${name}"][type="checkbox"]`);
      if (checkbox) checkbox.checked = false;
    }
    setBodyType([]);
    setPowertrain([]);
    setMake([]);
    setTransmission([]);
    setRegion([]);
    setInsuranceCoverType("");
    setFinanceEnabled(false);
    setDepositError(false);
    setNativeHasFilters(false);
  }

  const makeOptions: SelectFieldOption[] = makes.map((m) => ({ value: m, label: m }));
  const regionOptions: SelectFieldOption[] = regions.map((r) => ({ value: r, label: r }));
  const transmissionOptions: SelectFieldOption[] = [
    { value: "automatic", label: "Automatic" },
    { value: "manual", label: "Manual" },
  ];
  const insuranceOptions: SelectFieldOption[] = [
    { value: "third_party_fire_theft", label: "Third party, fire & theft" },
    { value: "none", label: "None (uninsured)" },
  ];
  // Not a filter field — insurance cover configures the ownership-cost
  // estimate rather than what listings match, so (like financeEnabled) it's
  // excluded from Clear filters/hasFilters. It intentionally does *not*
  // resync on formKey change either: a search submission never carries a
  // new insuranceCoverType of its own (there's no way to change it except by
  // picking it here), so there's nothing for it to go stale against.
  const [insuranceCoverType, setInsuranceCoverType] = useState(current.insuranceCoverType ?? "");

  return (
    <div key={formKey}>
      <Form action="" onChange={handleFormChange} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
        <Field label="Vehicle type">
          <input type="hidden" name="bodyType" value={toListParam(bodyType)} readOnly />
          <MultiSelectField values={bodyType} onChange={setBodyType} options={bodyTypes} />
        </Field>

        <Field label="Fuel type">
          <input type="hidden" name="powertrain" value={toListParam(powertrain)} readOnly />
          <MultiSelectField values={powertrain} onChange={setPowertrain} options={powertrains} />
        </Field>

        <Field label="Make">
          <input type="hidden" name="make" value={toListParam(make)} readOnly />
          <MultiSelectField values={make} onChange={setMake} options={makeOptions} />
        </Field>

        <Field label="Model" hint="Comma-separated for multiple, e.g. RAV4, Corolla">
          <input
            type="text"
            name="model"
            defaultValue={current.model ?? ""}
            placeholder="e.g. RAV4, Corolla"
            className={inputClass}
          />
        </Field>

        <Field label="Transmission">
          <input type="hidden" name="transmission" value={toListParam(transmission)} readOnly />
          <MultiSelectField values={transmission} onChange={setTransmission} options={transmissionOptions} />
        </Field>

        <Field label="Region">
          <input type="hidden" name="region" value={toListParam(region)} readOnly />
          <MultiSelectField values={region} onChange={setRegion} options={regionOptions} />
        </Field>

        <Field label="Min year">
          <input
            type="number"
            name="minYear"
            defaultValue={current.minYear ?? ""}
            min={1980}
            max={2100}
            step={1}
            className={inputClass}
          />
        </Field>

        <Field label="Max year">
          <input
            type="number"
            name="maxYear"
            defaultValue={current.maxYear ?? ""}
            min={1980}
            max={2100}
            step={1}
            className={inputClass}
          />
        </Field>

        <Field label="Min price ($)">
          <input
            type="number"
            name="minPrice"
            defaultValue={current.minPrice ?? ""}
            min={0}
            className={inputClass}
          />
        </Field>

        <Field label="Max price ($)">
          <input
            type="number"
            name="maxPrice"
            defaultValue={current.maxPrice ?? ""}
            min={0}
            className={inputClass}
          />
        </Field>

        <Field label="Max mileage (km)">
          <input
            type="number"
            name="maxMileageKm"
            defaultValue={current.maxMileageKm ?? ""}
            min={0}
            step={5000}
            className={inputClass}
          />
        </Field>

        <div className="flex flex-col justify-end">
          {hasFilters ? (
            <Link href={clearHref} onClick={handleClear} className="btn btn-ghost justify-center">
              Clear filters
            </Link>
          ) : (
            <button type="button" disabled className="btn btn-ghost cursor-not-allowed justify-center opacity-45">
              Clear filters
            </button>
          )}
        </div>

        <hr className="col-span-full border-border" />

        <Field
          label="Insurance cover"
          hint="Used for the ownership cost estimate"
          className="col-span-2"
        >
          <input type="hidden" name="insuranceCoverType" value={insuranceCoverType} readOnly />
          <SelectField
            value={insuranceCoverType}
            onChange={setInsuranceCoverType}
            options={insuranceOptions}
            placeholder="Comprehensive (default)"
          />
        </Field>

        <hr className="col-span-full border-border" />

        <Field label="How many km do you drive per year?" className="col-span-2">
          <input
            type="number"
            name="annualKm"
            defaultValue={current.annualKm ?? "12000"}
            min={0}
            step={1000}
            className={inputClass}
          />
        </Field>

        <hr className="col-span-full border-border" />

        <Field label="Finance" className="col-span-2">
          <div className="flex min-h-[30px] items-center gap-2">
            <input
              type="checkbox"
              name="financeEnabled"
              value="true"
              defaultChecked={current.financeEnabled === "true"}
              className="h-4 w-4 rounded border-border accent-accent"
            />
            <span className="text-sm font-normal text-foreground/80">
              Are you financing this car?
            </span>
          </div>
          {/* Same-name hidden fallback, placed after the checkbox: an
              unchecked checkbox submits nothing at all, so without this the
              form couldn't distinguish "explicitly turned off" from "never
              touched". Checked → both values submit ("true" then "false") and
              `first()` in page.tsx picks "true"; unchecked → only "false"
              submits. */}
          <input type="hidden" name="financeEnabled" value="false" />
        </Field>

        {financeEnabled && (
          <Field
            label="Deposit ($)"
            hint="Required — used for the 3-year ownership cost estimate"
            error={
              depositError
                ? "Please enter a deposit before searching"
                : undefined
            }
          >
            <input
              type="number"
              name="deposit"
              defaultValue={current.deposit ?? ""}
              min={0}
              step={500}
              required
              onInvalid={handleDepositInvalid}
              className={`field ${depositError ? "!border-red-500" : ""}`}
            />
          </Field>
        )}

        <Field label="Motorcycles & scooters" className="col-span-2">
          <div className="flex min-h-[30px] items-center gap-2">
            <input
              type="checkbox"
              name="includeMotorcycles"
              value="true"
              defaultChecked={current.includeMotorcycles === "true"}
              className="h-4 w-4 rounded border-border accent-accent"
            />
            <span className="text-sm font-normal text-foreground/80">
              Include motorbikes &amp; scooters in results
            </span>
          </div>
          {/* Same checked/hidden-fallback pairing as financeEnabled above —
              an unchecked checkbox submits nothing, so this distinguishes
              "explicitly off" from "never touched". */}
          <input type="hidden" name="includeMotorcycles" value="false" />
        </Field>
        </div>

        {/* Sort lives in its own control above the results (see SortSelect),
            not in this filter bar — but it still has to round-trip through
            this form's own navigation, or picking a filter would silently
            reset sort back to the default. */}
        <input type="hidden" name="sort" value={current.sort ?? "total"} />

        <SearchButton />
      </Form>
    </div>
  );
}

const inputClass = "field";

function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col gap-1 text-xs font-semibold text-muted ${className ?? ""}`}
    >
      <span>{label}</span>
      {children}
      {error ? (
        <span className="text-[10px] font-normal text-red-500">
          {error}
        </span>
      ) : (
        hint && (
          <span className="text-[10px] font-normal text-muted/80">
            {hint}
          </span>
        )
      )}
    </div>
  );
}

/** Separate component (rather than inline in SearchForm) because
 * useFormStatus only reports the enclosing <Form>'s pending state when
 * called from a descendant component — calling it in the same component
 * that renders <Form> would read the wrong (parent) context. */
function SearchButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-primary w-full py-2.5"
    >
      {pending && <Spinner />}
      {pending ? "Searching…" : "Search"}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
