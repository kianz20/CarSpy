import type { Metadata, Viewport } from "next";
import Link from "next/link";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/footer";
import { AuthNav } from "@/components/auth-nav";
import { FeedbackButton } from "@/components/feedback-button";
import { MobileNavMenu } from "@/components/mobile-nav-menu";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CarSpy",
  description: "Find the best used-car deals across NZ dealer inventory",
  appleWebApp: {
    title: "CarSpy",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  // Matches --background for each scheme. Deliberately two static,
  // media-scoped tags (the browser itself picks between them via
  // prefers-color-scheme) rather than one tag mutated by JS to follow our
  // in-app [data-theme] override — mutating a Next-managed meta tag before
  // hydration made React insert a second, conflicting copy of it instead of
  // reconciling. This covers the common case (device theme matches app
  // theme); it won't follow a manual light/dark override that disagrees
  // with the OS setting, which is an acceptable gap for what's otherwise
  // native OS chrome (Android status/nav bar), not in-app UI.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b14" },
  ],
};

// Resolves and applies the theme before first paint, always as an explicit
// "light"/"dark" attribute — never left unset. Two things depend on that:
// avoiding a flash of the wrong theme before the Settings page's theme
// control (see components/theme-toggle.tsx) reads it on mount, and
// globals.css's `dark:` custom variant, which (unlike Tailwind's default,
// OS-only dark variant) keys off this attribute so the saved choice actually
// overrides the OS setting instead of every `dark:*` utility class quietly
// ignoring it and following prefers-color-scheme regardless.
const themeInitScript = `
  try {
    const saved = localStorage.getItem("theme");
    document.documentElement.dataset.theme =
      saved === "light" || saved === "dark" ? saved : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // The inline script below sets data-theme on this element before React
      // hydrates (to avoid a light-mode flash for a returning dark-mode
      // visitor), which the server has no way to know when rendering — an
      // expected, intentional mismatch Next/React's docs call out this exact
      // suppression for, not a bug to chase.
      suppressHydrationWarning
    >
      <head>
        {/* next/script, not a raw <script> tag — Next 16 warns (and won't
            execute it client-side) for a plain <script> rendered by a React
            component; `beforeInteractive` is what actually guarantees this
            runs before hydration/paint, which is the whole point here. */}
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">
        <div className="sticky top-0 z-20 border-b border-border/60 bg-background/70 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-[1700px] items-center justify-between px-4 py-2.5 sm:px-6 lg:px-10">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm font-bold tracking-tight"
            >
              <span className="accent-gradient-text text-base">CarSpy NZ</span>
              <span className="pill bg-accent/10 text-accent">BETA</span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden items-center gap-4 sm:flex">
                <AuthNav />
                <Link
                  href="/settings"
                  aria-label="Ownership-cost settings"
                  className="btn-ghost flex h-8 w-8 items-center justify-center rounded-full !p-0"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    className="h-4 w-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065Z"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </div>
              <MobileNavMenu authNav={<AuthNav layout="stack" />} />
            </div>
          </div>
        </div>
        {/* Deliberately outside the header's own centered/max-width div —
            fixed to the actual viewport corner so it can never push the
            logo/AuthNav/settings link around, however the header's own
            layout changes. */}
        <FeedbackButton />
        <PwaRegister />
        {children}
        <Footer />
      </body>
    </html>
  );
}
