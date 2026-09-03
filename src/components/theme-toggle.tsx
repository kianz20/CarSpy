"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // ignore — private browsing etc.
  }
}

/** Settings-page control (moved out of the header — see layout.tsx). A
 * segmented Light/Dark control rather than a single icon button, since here
 * it's labelled alongside the app's other saved preferences rather than
 * standing alone as a quick-access icon. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    // One-time read of external state (the DOM attribute the inline
    // theme-init script already set, or the OS preference) on mount —
    // deliberately deferred to an effect rather than a lazy useState
    // initializer, so the client's first render still matches the
    // server-rendered placeholder below and avoids a hydration mismatch.
    const current = document.documentElement.dataset.theme as Theme | undefined;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(current === "dark" || current === "light" ? current : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }, []);

  function choose(next: Theme) {
    setTheme(next);
    applyTheme(next);
  }

  return (
    <div className="flex flex-col gap-1 text-xs font-semibold text-muted">
      <span>Theme</span>
      <div className="inline-flex w-fit rounded-full border border-border p-0.5">
        <button
          type="button"
          onClick={() => choose("light")}
          aria-pressed={theme === "light"}
          disabled={!theme}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            theme === "light" ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"
          }`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
          </svg>
          Light
        </button>
        <button
          type="button"
          onClick={() => choose("dark")}
          aria-pressed={theme === "dark"}
          disabled={!theme}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            theme === "dark" ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path strokeLinecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
          Dark
        </button>
      </div>
    </div>
  );
}
