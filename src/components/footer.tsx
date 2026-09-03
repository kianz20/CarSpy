"use client";

import { usePathname } from "next/navigation";

export function Footer() {
  // Pinned to the viewport bottom only on the search page, and only at sm+
  // — that's the one view with a long, scrollable results list where the
  // disclaimer/credits would otherwise scroll out of sight, but on a small
  // phone screen a permanently-docked footer eats into already-cramped
  // vertical space, so it stays in normal flow there regardless of page.
  // Everywhere else (and always below sm) it's normal document flow
  // (mt-auto), sitting at the true bottom of short pages without covering
  // content on longer ones (e.g. the ownership breakdown).
  const isSearchPage = usePathname() === "/";

  return (
    <footer
      className={`border-t border-border bg-background/90 px-4 py-3 text-center text-xs text-muted backdrop-blur-md ${
        isSearchPage ? "mt-auto sm:sticky sm:bottom-0 sm:z-10 sm:mt-0" : "mt-auto py-5"
      }`}
    >
      <p>
        © {new Date().getFullYear()}{" "}
        <a href="https://github.com/kianz20" target="_blank" rel="noopener noreferrer" className="hover:text-accent hover:underline">
          Kian Jazayeri
        </a>{" "}
        ·{" "}
        <a href="https://github.com/kianz20/CarValue" target="_blank" rel="noopener noreferrer" className="hover:text-accent hover:underline">
          Source on GitHub
        </a>{" "}
        · MIT Licensed · Estimates only, not professional valuations or financial advice — actual costs will vary.
      </p>
    </footer>
  );
}
