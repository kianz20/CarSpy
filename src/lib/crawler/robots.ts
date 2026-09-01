import robotsParser from "robots-parser";

/**
 * Per-dealer robots.txt check — a standing pipeline step, not a one-time
 * platform-level decision. See PLAN.md §3c: two dealers on the identical
 * platform (e.g. both AdTorque Edge, or both CarUpdater) can have opposite
 * crawling policies, so every dealer site is checked individually before
 * any of its pages are fetched.
 */

export const CRAWLER_USER_AGENT = "CarValueBot/1.0 (+https://github.com/; personal project, contact via GitHub)";

export type RobotsCheckResult = {
  allowed: boolean;
  reason: string;
};

/** Fetches and evaluates a site's robots.txt for one target URL. Fails open only for a
 * missing/unreachable robots.txt (no file = no restriction), fails closed on any other error. */
export async function checkRobotsAllowed(targetUrl: string): Promise<RobotsCheckResult> {
  const origin = new URL(targetUrl).origin;
  const robotsUrl = `${origin}/robots.txt`;

  let body: string;
  try {
    const res = await fetch(robotsUrl, { headers: { "User-Agent": CRAWLER_USER_AGENT } });
    if (res.status === 404) {
      return { allowed: true, reason: "no robots.txt present" };
    }
    if (!res.ok) {
      return { allowed: false, reason: `robots.txt fetch failed with status ${res.status} — skipping to be safe` };
    }
    body = await res.text();
  } catch (err) {
    return { allowed: false, reason: `robots.txt fetch errored (${String(err)}) — skipping to be safe` };
  }

  const robots = robotsParser(robotsUrl, body);
  const allowed = robots.isAllowed(targetUrl, CRAWLER_USER_AGENT) ?? true;
  return {
    allowed,
    reason: allowed ? "permitted by robots.txt" : "disallowed by robots.txt for our user agent",
  };
}
