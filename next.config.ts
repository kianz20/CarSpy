import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    // Next 15+ defaults the client router cache's staleTime to 0 for
    // dynamic (searchParams-driven) pages like the search results list —
    // every back-navigation re-hits the server and re-runs the DB query
    // instead of restoring what's already in the browser, which is what
    // made "click into a listing, then Back" feel slow even after the
    // search itself got faster. 10 minutes means a back-navigation within
    // that window is instant; anything older still gets fresh data — a
    // dealer's inventory doesn't turn over fast enough for that staleness
    // to matter for a "browse and compare" flow like this one.
    staleTimes: {
      dynamic: 600,
    },
  },
};

export default nextConfig;
