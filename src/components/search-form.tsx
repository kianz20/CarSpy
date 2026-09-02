"use client";

import Form from "next/form";
import Link from "next/link";
import { useState, type FormEvent, type MouseEvent } from "react";
import { useFormStatus } from "react-dom";

type Option = { value: string; label: string };

// The "actual" search filters — everything Clear filters resets/drops from
// the URL. Deliberately excludes annualKm, insuranceCoverType,
// financeEnabled and deposit: those configure the ownership-cost estimate,
// not what listings match, so clearing filters shouldn't touch them.
const FILTER_FIELD_NAMES = [
  "bodyType",
  "powertrain",
  "make",
  "model",
  "transmission",
  "region",
  "minYear",
  "maxYear",
  "minPrice",
  "maxPrice",
  "maxMileageKm",
] as const;

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
  // All the fields below are uncontrolled (defaultValue, not value) — plain
  // HTML form semantics, which is what next/form's GET-navigation needs. But
  // that means a client-side navigation alone (e.g. the Clear filters link)
  // won't reset an already-mounted <select>/<input>'s displayed value, since
  // React only applies defaultValue on mount, not on every re-render. Keying
  // on the current filter state forces a remount whenever the URL's filters
  // actually change, so cleared/changed fields visibly reset instead of
  // showing stale selections.
  //
  // The key has to go on a wrapper, not on <Form> itself — next/form's own
  // docs explicitly call out that "passing a key prop to a string action is
  // not supported" (it interferes with Form's internal client-navigation
  // handling), which is exactly what broke when it was tried directly on Form.
  const formKey = new URLSearchParams(current).toString();

  // hasFilters mirrors the fields' live values (not just the URL's), so the
  // Clear filters button appears as soon as the user picks/types something —
  // not only after they submit and the URL actually changes. Resynced from
  // `current` whenever formKey changes, right during render (React's
  // recommended way to reset state on a prop change) rather than in an
  // effect, which would cause an extra post-commit render. Only counts the
  // actual filter fields (see FILTER_FIELD_NAMES) — Clear filters doesn't
  // touch annualKm/insuranceCoverType/financeEnabled/deposit, so there's no
  // point showing it just because one of those alone is set.
  const hasAnyFilter = (source: Record<string, string>) =>
    FILTER_FIELD_NAMES.some((name) => source[name]);
  const [prevFormKey, setPrevFormKey] = useState(formKey);
  const [hasFilters, setHasFilters] = useState(hasAnyFilter(current));
  if (formKey !== prevFormKey) {
    setPrevFormKey(formKey);
    setHasFilters(hasAnyFilter(current));
  }

  // Deposit is required (but only while finance is enabled — see below), and
  // the browser's own validation bubble is easy to miss/dismiss, so show our
  // own persistent message instead. onInvalid fires (and still blocks
  // submission) even with the bubble suppressed via preventDefault, so
  // nothing is lost by replacing it.
  const [depositError, setDepositError] = useState(false);

  // Drives whether the Deposit field renders at all: with finance off there's
  // no loan, so nothing to put a deposit toward. Resynced from `current`
  // alongside hasFilters above (same render-time-reset rationale).
  const [financeEnabled, setFinanceEnabled] = useState(
    current.financeEnabled === "true",
  );
  if (formKey !== prevFormKey) {
    setFinanceEnabled(current.financeEnabled === "true");
  }

  function handleFormChange(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    // Only the actual filter fields count — see FILTER_FIELD_NAMES.
    setHasFilters(
      FILTER_FIELD_NAMES.some(
        (name) => String(formData.get(name) ?? "").trim() !== "",
      ),
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

  // Drops only the actual filter keys from the URL, preserving
  // annualKm/insuranceCoverType/financeEnabled/deposit exactly as they are.
  const clearParams = new URLSearchParams(current);
  for (const name of FILTER_FIELD_NAMES) clearParams.delete(name);
  const clearHref = clearParams.size > 0 ? `/?${clearParams.toString()}` : "/";

  // If the fields were only edited but never submitted, the URL never
  // changes when this navigates to clearHref — so the formKey-remount reset
  // above won't fire. Reset the (uncontrolled) filter fields directly so
  // stale picks don't linger even when Next's router cache re-renders
  // identical output. Deliberately field-by-field (not form.reset()): a
  // blanket reset would also revert annualKm/insuranceCoverType/
  // financeEnabled/deposit, which Clear filters must leave untouched.
  function handleClear(event: MouseEvent<HTMLAnchorElement>) {
    const form = event.currentTarget.closest("form");
    for (const name of FILTER_FIELD_NAMES) {
      const field = form?.elements.namedItem(name);
      if (
        field instanceof HTMLInputElement ||
        field instanceof HTMLSelectElement
      ) {
        field.value = "";
      }
    }
    setHasFilters(false);
  }

  return (
    <div key={formKey}>
      <Form action="" onChange={handleFormChange} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Field label="Vehicle type">
          <select
            name="bodyType"
            defaultValue={current.bodyType ?? ""}
            className={selectClass}
          >
            <option value="">Any</option>
            {bodyTypes.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Fuel type">
          <select
            name="powertrain"
            defaultValue={current.powertrain ?? ""}
            className={selectClass}
          >
            <option value="">Any</option>
            {powertrains.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Make">
          <select
            name="make"
            defaultValue={current.make ?? ""}
            className={selectClass}
          >
            <option value="">Any</option>
            {makes.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Model">
          <input
            type="text"
            name="model"
            defaultValue={current.model ?? ""}
            placeholder="e.g. RAV4"
            className={inputClass}
          />
        </Field>

        <Field label="Transmission">
          <select
            name="transmission"
            defaultValue={current.transmission ?? ""}
            className={selectClass}
          >
            <option value="">Any</option>
            <option value="automatic">Automatic</option>
            <option value="manual">Manual</option>
          </select>
        </Field>

        <Field label="Region">
          <select
            name="region"
            defaultValue={current.region ?? ""}
            className={selectClass}
          >
            <option value="">Any</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
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
          <select
            name="insuranceCoverType"
            defaultValue={current.insuranceCoverType ?? ""}
            className={selectClass}
          >
            <option value="">Comprehensive (default)</option>
            <option value="third_party_fire_theft">
              Third party, fire & theft
            </option>
            <option value="none">None (uninsured)</option>
          </select>
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

const selectClass = "field";
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
    <label
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
    </label>
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
