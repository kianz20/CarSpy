"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { SelectFieldOption } from "@/components/select-field";

/**
 * Autocomplete multi-select — a search box to filter a (possibly long, e.g.
 * Make) option list, plus checkboxes so more than one value can be picked.
 * Same "own listbox, not a native <select>" reasoning as SelectField (the
 * font in a native <select>'s popup can't be styled on Windows Chrome/Edge),
 * with the added typeahead since a checked-list of every make/region would
 * otherwise be too long to scan.
 */
export function MultiSelectField({
  values,
  onChange,
  options,
  placeholder = "Any",
}: {
  values: string[];
  onChange: (values: string[]) => void;
  options: SelectFieldOption[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();

  useEffect(() => {
    if (!open) return;
    // Autofocus the search box on open — the whole point of "autocomplete"
    // is typing immediately, not clicking into a text field first.
    requestAnimationFrame(() => searchRef.current?.focus());
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  function toggle(value: string) {
    onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);
  }

  function focusOption(delta: number) {
    const items = Array.from(listRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []);
    if (items.length === 0) return;
    const currentIndex = items.findIndex((el) => el === document.activeElement);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + delta + items.length) % items.length;
    items[nextIndex]?.focus();
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusOption(0);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      rootRef.current?.querySelector("button")?.focus();
    }
  }

  function handleListKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusOption(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusOption(-1);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      rootRef.current?.querySelector("button")?.focus();
    }
  }

  const triggerLabel =
    values.length === 0
      ? placeholder
      : values.length === 1
        ? (options.find((o) => o.value === values[0])?.label ?? values[0])
        : `${values.length} selected`;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setQuery("");
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="field flex items-center justify-between gap-2 text-left"
      >
        <span className={`truncate ${values.length ? "" : "text-muted"}`}>{triggerLabel}</span>
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-muted" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
          <div className="border-b border-border p-1.5">
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search…"
              className="field !py-1.5 text-sm"
            />
          </div>
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-multiselectable="true"
            onKeyDown={handleListKeyDown}
            className="max-h-56 overflow-auto p-1 text-sm"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-2.5 py-1.5 text-muted">No matches</li>
            ) : (
              filteredOptions.map((o) => {
                const selected = values.includes(o.value);
                return (
                  <li key={o.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => toggle(o.value)}
                      className="flex w-full items-center gap-2 truncate rounded-md px-2.5 py-1.5 text-left hover:bg-surface-2 focus:bg-surface-2 focus:outline-none"
                    >
                      <span
                        aria-hidden="true"
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          selected ? "border-accent bg-accent text-accent-foreground" : "border-border"
                        }`}
                      >
                        {selected && (
                          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                            <path
                              fillRule="evenodd"
                              d="M16.704 5.29a1 1 0 0 1 .006 1.415l-7.5 7.6a1 1 0 0 1-1.42.005l-3.5-3.5a1 1 0 1 1 1.414-1.415l2.797 2.798 6.79-6.885a1 1 0 0 1 1.413-.018Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </span>
                      <span className={`truncate ${selected ? "font-semibold text-accent" : ""}`}>{o.label}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
