"use client";

import Form from "next/form";
import Link from "next/link";
import { useState, type FormEvent, type MouseEvent } from "react";
import { useFormStatus } from "react-dom";

type Option = { value: string; label: string };

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
  // effect, which would cause an extra post-commit render.
  const [prevFormKey, setPrevFormKey] = useState(formKey);
  const [hasFilters, setHasFilters] = useState(Object.keys(current).length > 0);
  if (formKey !== prevFormKey) {
    setPrevFormKey(formKey);
    setHasFilters(Object.keys(current).length > 0);
  }

  // Budget is required, but the browser's own validation bubble is easy to
  // miss/dismiss — show our own persistent message instead. onInvalid fires
  // (and still blocks submission) even with the bubble suppressed via
  // preventDefault, so nothing is lost by replacing it.
  const [budgetError, setBudgetError] = useState(false);

  function handleFormChange(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    // Excludes financeEnabled: its hidden fallback input (see below) always
    // contributes a non-empty value, which would otherwise make hasFilters
    // permanently true the moment any field change fires, regardless of
    // whether the user actually set anything.
    setHasFilters([...formData.entries()].some(([name, value]) => name !== "financeEnabled" && String(value).trim() !== ""));
    if (String(formData.get("budget") ?? "").trim() !== "") {
      setBudgetError(false);
    }
  }

  function handleBudgetInvalid(event: FormEvent<HTMLInputElement>) {
    event.preventDefault();
    setBudgetError(true);
  }

  // If the fields were only edited but never submitted, the URL never
  // changes when this navigates to "/" — so the formKey-remount reset above
  // won't fire. Reset the (uncontrolled) fields directly so stale picks
  // don't linger even when Next's router cache re-renders identical output.
  function handleClear(event: MouseEvent<HTMLAnchorElement>) {
    event.currentTarget.closest("form")?.reset();
    setHasFilters(false);
  }

  return (
    <div key={formKey}>
      <Form
        action=""
        onChange={handleFormChange}
        className="grid grid-cols-2 gap-4 rounded-lg border border-black/10 p-4 dark:border-white/15 sm:grid-cols-3 lg:grid-cols-6"
      >
        <Field label="Body type">
          <select name="bodyType" defaultValue={current.bodyType ?? ""} className={selectClass}>
            <option value="">Any</option>
            {bodyTypes.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Powertrain">
          <select name="powertrain" defaultValue={current.powertrain ?? ""} className={selectClass}>
            <option value="">Any</option>
            {powertrains.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Make">
          <select name="make" defaultValue={current.make ?? ""} className={selectClass}>
            <option value="">Any</option>
            {makes.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Model">
          <input type="text" name="model" defaultValue={current.model ?? ""} placeholder="e.g. RAV4" className={inputClass} />
        </Field>

        <Field label="Transmission">
          <select name="transmission" defaultValue={current.transmission ?? ""} className={selectClass}>
            <option value="">Any</option>
            <option value="automatic">Automatic</option>
            <option value="manual">Manual</option>
          </select>
        </Field>

        <Field label="Region">
          <select name="region" defaultValue={current.region ?? ""} className={selectClass}>
            <option value="">Any</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Min year">
          <input type="number" name="minYear" defaultValue={current.minYear ?? ""} min={1980} max={2100} step={1} className={inputClass} />
        </Field>

        <Field label="Max year">
          <input type="number" name="maxYear" defaultValue={current.maxYear ?? ""} min={1980} max={2100} step={1} className={inputClass} />
        </Field>

        <Field label="Min price ($)">
          <input type="number" name="minPrice" defaultValue={current.minPrice ?? ""} min={0} step={500} className={inputClass} />
        </Field>

        <Field label="Max price ($)">
          <input type="number" name="maxPrice" defaultValue={current.maxPrice ?? ""} min={0} step={500} className={inputClass} />
        </Field>

        <Field label="Max mileage (km)">
          <input type="number" name="maxMileageKm" defaultValue={current.maxMileageKm ?? ""} min={0} step={5000} className={inputClass} />
        </Field>

        <Field
          label="Budget ($)"
          hint="Required — the most you can spend, used for search + cost estimate"
          error={budgetError ? "Please enter a budget before searching" : undefined}
        >
          <input
            type="number"
            name="budget"
            defaultValue={current.budget ?? ""}
            min={0}
            step={500}
            required
            onInvalid={handleBudgetInvalid}
            className={`${inputClass} ${budgetError ? "border-red-500 focus:border-red-500 dark:border-red-500" : ""}`}
          />
        </Field>

        <Field label="Finance" hint="Unchecked: only shows listings priced at or under your budget">
          <div className="flex h-[30px] items-center gap-2">
            <input
              type="checkbox"
              name="financeEnabled"
              value="true"
              defaultChecked={current.financeEnabled !== "false"}
              className="h-4 w-4 rounded border-black/20 dark:border-white/20"
            />
            <span className="text-sm font-normal text-zinc-700 dark:text-zinc-300">Finance enabled</span>
          </div>
          {/* Same-name hidden fallback, placed after the checkbox: an
              unchecked checkbox submits nothing at all, so without this the
              form couldn't distinguish "explicitly turned off" from "never
              touched". Checked → both values submit ("true" then "false") and
              `first()` in page.tsx picks "true"; unchecked → only "false"
              submits. */}
          <input type="hidden" name="financeEnabled" value="false" />
        </Field>

        <Field label="Annual driving (km)" hint="Defaults to 12,000km/yr">
          <input type="number" name="annualKm" defaultValue={current.annualKm ?? ""} min={0} step={1000} className={inputClass} />
        </Field>

        <Field label="Insurance cover" hint="Used for the ownership cost estimate" className="col-span-2">
          <select name="insuranceCoverType" defaultValue={current.insuranceCoverType ?? ""} className={selectClass}>
            <option value="">Comprehensive (default)</option>
            <option value="third_party_fire_theft">Third party, fire & theft</option>
            <option value="none">None (uninsured)</option>
          </select>
        </Field>

        <div className="flex items-end gap-2">
          <SearchButton />
          {hasFilters && (
            <Link
              href="/"
              onClick={handleClear}
              className="flex w-full items-center justify-center rounded-md border border-black/15 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              Clear filters
            </Link>
          )}
        </div>
      </Form>
    </div>
  );
}

const selectClass =
  "w-full rounded-md border border-black/15 bg-white px-2 py-1.5 text-sm dark:border-white/20 dark:bg-black";
const inputClass = selectClass;

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
    <label className={`flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 ${className ?? ""}`}>
      <span>{label}</span>
      {children}
      {error ? (
        <span className="text-[10px] font-normal text-red-600 dark:text-red-400">{error}</span>
      ) : (
        hint && <span className="text-[10px] font-normal text-zinc-400 dark:text-zinc-500">{hint}</span>
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
      className="flex w-full items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-70 dark:hover:bg-[#ccc]"
    >
      {pending && <Spinner />}
      {pending ? "Searching…" : "Search"}
    </button>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
