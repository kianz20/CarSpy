import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthNav } from "@/components/auth-nav";
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
  title: "CarValue",
  description: "Find the best used-car deals across NZ dealer inventory",
};

// Resolves and applies the theme before first paint, always as an explicit
// "light"/"dark" attribute — never left unset. Two things depend on that:
// avoiding a flash of the wrong theme before ThemeToggle's effect runs, and
// globals.css's `dark:` custom variant, which (unlike Tailwind's default,
// OS-only dark variant) keys off this attribute so the in-app toggle
// actually overrides the OS setting instead of every `dark:*` utility
// class quietly ignoring it and following prefers-color-scheme regardless.
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
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <div className="sticky top-0 z-20 border-b border-border/60 bg-background/70 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-[1700px] items-center justify-between px-4 py-2.5 sm:px-6 lg:px-10">
            <Link href="/" className="flex items-center gap-1.5 text-sm font-bold tracking-tight">
              <span className="accent-gradient-text text-base">CarSpy</span>
              <span className="pill bg-accent/10 text-accent">BETA</span>
            </Link>
            <div className="flex items-center gap-4">
              <AuthNav />
              <ThemeToggle />
            </div>
          </div>
        </div>
        {children}
        <Footer />
      </body>
    </html>
  );
}
