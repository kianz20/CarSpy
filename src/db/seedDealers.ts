import { db } from "./client";
import { dealers } from "./schema";

// Small starter set for proving out the Motorcentral, CarUpdater, and
// AdTorque Edge adapters end-to-end (PLAN.md Phase 3). robotsAllowed
// reflects the checks already done in research/dealer-sites.md §2a — all
// four were confirmed open (Andrew Simms' privacy policy was also checked
// directly and has no scraping/reuse restriction, just personal-data handling).
const DEALER_SEED = [
  {
    name: "AJ Motors",
    url: "https://www.ajmotors.co.nz",
    region: "National",
    type: "chain",
    platform: "motorcentral",
    robotsAllowed: true,
  },
  {
    name: "Genuine Vehicle Imports",
    url: "https://www.gvi.kiwi",
    region: "Auckland",
    type: "independent",
    platform: "motorcentral",
    robotsAllowed: true,
  },
  {
    name: "Blackwells",
    url: "https://www.blackwells.co.nz",
    region: "Canterbury",
    type: "franchise",
    platform: "carupdater",
    robotsAllowed: true,
  },
  {
    name: "Andrew Simms",
    url: "https://www.andrewsimms.co.nz",
    region: "Auckland",
    type: "franchise",
    platform: "adtorque_edge",
    robotsAllowed: true,
  },
  {
    name: "Turners Cars",
    url: "https://www.turners.co.nz",
    region: "National",
    type: "chain",
    platform: "turners",
    robotsAllowed: true,
  },
  {
    name: "2 Cheap Cars",
    url: "https://www.2cheapcars.co.nz",
    region: "National",
    type: "chain",
    platform: "twocheapcars",
    robotsAllowed: true, // /sitemap-inventory.xml and /car/ detail pages are open — only the search UI is disallowed, see twocheapcars.ts
  },
  {
    name: "Armstrong's Motor Group",
    url: "https://www.armstrongs.co.nz",
    region: "Auckland, Wellington, Christchurch, Dunedin",
    type: "franchise",
    platform: "armstrongs",
    robotsAllowed: true, // /content/json/vehicles.json isn't disallowed and a sitemap-vehicles.xml is published alongside it — see armstrongs.ts
  },
  // Colonial Motor Company (CMC) turned out not to be a single site at all —
  // colmotor.co.nz is a pure corporate/investor-relations site with no
  // vehicle inventory of its own. CMC's ~19 dealerships each run their own
  // separate website; these two were already confirmed to run on platforms
  // we have adapters for, so no new adapter code was needed.
  {
    name: "Team Hutchinson All Makes",
    url: "https://tham.co.nz",
    region: "Christchurch",
    type: "independent", // used-car arm of Colonial Motor Company (Team Hutchinson Ford's group)
    platform: "motorcentral",
    robotsAllowed: true,
  },
  {
    name: "South Auckland Motors",
    url: "https://southaucklandmotors.co.nz",
    region: "Auckland",
    type: "franchise", // Colonial Motor Company / Ford
    platform: "adtorque_edge",
    robotsAllowed: true,
  },
];

// Expansion batch — see research/dealer-sites.md §3 for the full 90-site
// candidate list. Every entry here was independently fingerprinted (platform
// confirmed live, not just assumed from the research doc) and robots.txt-
// checked against its actual listings path (not just the homepage — see
// PLAN.md §3c on why per-dealer, per-path checks matter) before being added.
// Candidates that failed either check were excluded, not silently dropped:
// Macaulay Motors, Blackwells Isuzu, Blackwells GMSV, Southern Lakes Motors —
// robots.txt disallows a generic crawler outright; Fagan Motors, Gluyas
// Nissan, Grant Johnstone — platform couldn't be confirmed live (unreachable
// or no fingerprint match, despite the research doc's expectation); NZ Cheap
// Cars — robots.txt specifically disallows /stock for our user agent.
const EXPANSION_DEALER_SEED = [
  { name: "Trust Motors", url: "https://www.trustmotors.co.nz", region: "Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Copping Motor Company", url: "https://www.copping.co.nz", region: "Tauranga", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Autoline Cars", url: "https://autolinecars.co.nz", region: "Unknown", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Click Cars", url: "https://clickcars.co.nz", region: "Unknown", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Southern Cross Autos", url: "https://southerncrossautos.co.nz", region: "Unknown", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "NZ Autos", url: "https://nzautos.co.nz", region: "Unknown", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Feilding Motor Group", url: "https://feildingmotorgroup.co.nz", region: "Feilding, Manawatu", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "RJ Wilton Cars", url: "https://wiltoncars.co.nz", region: "Unknown", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "J & H Autos", url: "https://jandhautos.co.nz", region: "Unknown", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Fusion Cars", url: "https://fusioncars.co.nz", region: "Unknown", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Nelson Cars", url: "https://www.nelsoncars.nz", region: "Nelson", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "80 Motors", url: "https://www.80motors.co.nz", region: "Wigram, Christchurch", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "JE Imports", url: "https://www.jeimports.co.nz", region: "Unknown", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Cheapies Cars (Timaru)", url: "https://www.timarucheapies.co.nz", region: "Timaru", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Wheeler Motors", url: "https://www.wheelermotors.co.nz", region: "Christchurch", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "EV City", url: "https://www.evcity.kiwi", region: "Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Impact Off Road", url: "https://www.impactoffroad.co.nz", region: "Unknown", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Pearce Brothers", url: "https://www.pearcebrothers.co.nz", region: "Unknown", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Southern Specialist Cars", url: "https://www.southernspecialistcars.co.nz", region: "Unknown", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Waggs", url: "https://www.waggs.co.nz", region: "Unknown", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Mexted Motors", url: "https://www.mexted.co.nz", region: "Masterton", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Industry Motors", url: "https://www.industrymotors.co.nz", region: "Unknown", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Scotts Auto Sales", url: "https://scottsautosales.co.nz", region: "Dunedin", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Any Car", url: "https://anycar.co.nz", region: "Christchurch", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Andrew Simms Dunedin", url: "https://andrewsimmsdunedin.co.nz", region: "Dunedin", type: "franchise", platform: "adtorque_edge", robotsAllowed: true },
];

// Expansion round 2 — dealers already listed in research/dealer-sites.md
// with a real URL but never fingerprinted in that research pass (marked
// "Unknown" only for lack of a check, not because they're confirmed
// bespoke), plus a handful resolved by searching name+region directly since
// AutoTrader's dealer-directory profile pages don't expose an outbound
// website link. Same verification bar as round 1: live fingerprint +
// robots.txt check against the real listings path + a spot-check crawl,
// all before being added here. Excluded this round: 1 Stop Motors, 13
// Autos, 4 Guys Autobarn, Affordable Car Sales, Ace Motors Group (no known
// platform — genuinely bespoke); Advantage Cars, Absolute Auto, Advance
// Motors (unreachable/404 on every URL form tried); Coutts (Mercedes-Benz
// franchise, no confirmed platform or website); JK Cars, JP Autos, JR's
// Motors, NZC Cars, Portage Cars, Enterprise Cars, JMJ Cars, Waikato Kia,
// Mazda of Hamilton, Tauranga Motor Company (fingerprinted, came back
// unknown — genuinely bespoke or manufacturer-templated sites).
const EXPANSION_DEALER_SEED_2 = [
  { name: "Jan Japan", url: "https://www.janjapan.co.nz", region: "Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Tristram Auckland", url: "https://www.tristramauckland.co.nz", region: "North Shore, Auckland", type: "franchise", platform: "adtorque_edge", robotsAllowed: true },
  { name: "Fairview Motors", url: "https://www.fairview.co.nz", region: "Hamilton, Cambridge, Matamata, Te Awamutu, Thames", type: "franchise", platform: "adtorque_edge", robotsAllowed: true },
  { name: "0800 Best Deal Cars", url: "https://www.0800bestdeal.co.nz", region: "Panmure, Auckland; Wigram, Christchurch", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "A2Z Cars", url: "https://www.a2zcars.co.nz", region: "Onehunga, Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "AC Autos", url: "https://www.acautos.co.nz", region: "North Shore, Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "4E Japan Direct", url: "https://www.4ejapandirect.co.nz", region: "Sydenham, Christchurch", type: "independent", platform: "motorcentral", robotsAllowed: true },
];

// Found via Motorcentral's own dealer-website portfolio page plus one web
// search hit, individually re-confirmed (not just taken on the portfolio
// listing's word): each site's /vehicles returns real .vehicle cards linking
// to /vehicle/{slug}/{id}, and robots.txt never blanket-disallows
// User-agent: *.
const EXPANSION_DEALER_SEED_3 = [
  { name: "O'Reilly's Garage", url: "https://www.oreillysgarage.co.nz", region: "Unknown", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Planet Cars", url: "https://www.planetcars.co.nz", region: "Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Sharp Cars", url: "https://www.sharpcars.co.nz", region: "Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Shore Prestige", url: "https://www.shoreprestige.co.nz", region: "North Shore, Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "AutoSpot", url: "https://www.autospot.co.nz", region: "Whangarei", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Bay European", url: "https://www.bayeuropean.nz", region: "Napier, Hawke's Bay", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "DJ Auto", url: "https://www.djauto.co.nz", region: "Auckland; Christchurch", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Greymouth Cars", url: "https://www.greymouthcars.co.nz", region: "Greymouth, West Coast", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Integrity Motors", url: "https://www.integritymotors.co.nz", region: "Unknown", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "The Garage", url: "https://www.thegarage.co.nz", region: "Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Waipapa Cars", url: "https://www.waipapacars.co.nz", region: "Waipapa/Kerikeri, Northland", type: "independent", platform: "motorcentral", robotsAllowed: true },
];

async function seedDealers() {
  const allDealers = [...DEALER_SEED, ...EXPANSION_DEALER_SEED, ...EXPANSION_DEALER_SEED_2, ...EXPANSION_DEALER_SEED_3];
  for (const dealer of allDealers) {
    await db
      .insert(dealers)
      .values(dealer)
      .onConflictDoNothing({ target: dealers.url });
  }
  console.log(`Seeded ${allDealers.length} dealers (skipped any already present).`);
}

seedDealers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
