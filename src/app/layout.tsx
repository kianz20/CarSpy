import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/footer";
import { ThemeToggle } from "@/components/theme-toggle";
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

// Applies a saved theme choice before first paint — avoids a light-mode
// flash for a user who previously picked dark, since the class/attribute
// otherwise wouldn't land until ThemeToggle's client-side effect runs.
const themeInitScript = `
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") document.documentElement.dataset.theme = saved;
  } catch {}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <div className="sticky top-0 z-20 border-b border-border/60 bg-background/70 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-2.5 sm:px-6">
            <Link href="/" className="flex items-center gap-1.5 text-sm font-bold tracking-tight">
              <span className="accent-gradient-text text-base">CarValue</span>
              <span className="pill bg-accent/10 text-accent">BETA</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
        {children}
        <Footer />
      </body>
    </html>
  );
}
