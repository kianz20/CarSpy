"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

export type SelectFieldOption = { value: string; label: string };

/**
 * A fully custom-rendered dropdown, standing in for a native <select>.
 * Native selects on Windows Chrome/Edge render their opened *popup* list
 * with the OS's system font no matter what CSS is set on the <select> —
 * that's a native-control limitation, not something font-family can fix —
 * so this renders its own listbox instead, styled like the rest of the app.
 *
 * Controlled (value/onChange), not backed by a hidden form input — the
 * parent (search-form.tsx) tracks these values as state directly, the same
 * way it already tracks financeEnabled/hasFilters, rather than round-
 * tripping through FormData the way the plain <input> fields still do.
 */
export function SelectField({
  value,
  onChange,
  options,
  placeholder = "Any",
  className,
  showPlaceholderOption = true,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectFieldOption[];
  placeholder?: string;
  className?: string;
  /** Set false when every real option is meaningful and there's no "unset"
   * state to offer (e.g. sort order always has a value) — otherwise the
   * blank placeholder shows up as a selectable "Any"-style entry that
   * doesn't make sense for this field. */
  showPlaceholderOption?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function focusOption(delta: number) {
    const items = Array.from(listRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []);
    if (items.length === 0) return;
    const currentIndex = items.findIndex((el) => el === document.activeElement);
    const nextIndex = (currentIndex + delta + items.length) % items.length;
    items[nextIndex]?.focus();
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => focusOption(0));
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

  function select(next: string) {
    onChange(next);
    setOpen(false);
    rootRef.current?.querySelector("button")?.focus();
  }

  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        role="combobox"
        aria-controls={listboxId}
        className={`field flex items-center justify-between gap-2 text-left ${className ?? ""}`}
      >
        <span className={`truncate ${selectedLabel ? "" : "text-muted"}`}>{selectedLabel ?? placeholder}</span>
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-muted" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          onKeyDown={handleListKeyDown}
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-surface p-1 text-sm shadow-lg"
        >
          {showPlaceholderOption && (
            <SelectOptionItem label={placeholder} selected={value === ""} onSelect={() => select("")} muted />
          )}
          {options.map((o) => (
            <SelectOptionItem key={o.value} label={o.label} selected={value === o.value} onSelect={() => select(o.value)} />
          ))}
        </ul>
      )}
    </div>
  );
}

function SelectOptionItem({
  label,
  selected,
  onSelect,
  muted,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  muted?: boolean;
}) {
  return (
    <li>
      <button
        type="button"
        role="option"
        aria-selected={selected}
        onClick={onSelect}
        className={`block w-full truncate rounded-md px-2.5 py-1.5 text-left hover:bg-surface-2 focus:bg-surface-2 focus:outline-none ${
          selected ? "font-semibold text-accent" : muted ? "text-muted" : ""
        }`}
      >
        {label}
      </button>
    </li>
  );
}
