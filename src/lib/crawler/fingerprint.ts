import { CRAWLER_USER_AGENT } from "./robots";

/**
 * Detects which shared dealer-website platform a site runs on, by checking
 * for known footer/asset signatures — see PLAN.md §3c and
 * research/dealer-sites.md §1 for how these were confirmed. Bucketing a site
 * this way tells us which adapter to run against it, without hand-inspecting
 * every one of the ~90 candidate dealer sites first.
 */

export type DetectedPlatform = "motorcentral" | "adtorque_edge" | "carupdater" | "unknown";

const SIGNATURES: { platform: DetectedPlatform; pattern: RegExp }[] = [
  { platform: "motorcentral", pattern: /powered by motorcentral/i },
  { platform: "motorcentral", pattern: /motorcentral\.co\.nz/i },
  { platform: "adtorque_edge", pattern: /adtorque edge/i },
  { platform: "carupdater", pattern: /carupdater/i },
];

export async function fingerprintDealerSite(homepageUrl: string): Promise<DetectedPlatform> {
  const res = await fetch(homepageUrl, { headers: { "User-Agent": CRAWLER_USER_AGENT } });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${homepageUrl} for fingerprinting: HTTP ${res.status}`);
  }
  const html = await res.text();

  for (const { platform, pattern } of SIGNATURES) {
    if (pattern.test(html)) return platform;
  }
  return "unknown";
}
