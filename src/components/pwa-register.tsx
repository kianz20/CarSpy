"use client";

import { useEffect } from "react";

/** Registers the offline-fallback service worker (public/sw.js) once the
 * page is interactive — deferred to an effect rather than a blocking
 * script, since registration isn't needed for first paint and shouldn't
 * compete with it. Renders nothing. */
export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failing (unsupported browser, blocked storage) should
        // never break the app — it's a progressive enhancement only.
      });
    }
  }, []);

  return null;
}
