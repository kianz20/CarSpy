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

// Expansion round 4 — resolved the remaining research/dealer-sites.md §4
// follow-up items (the ~20 "URL not captured" independents via AutoTrader's
// dealer-profile pages, and further paging of AutoTrader's regional
// directory for the lightly-covered regions: Northland, Gisborne, Hawke's
// Bay, Nelson/Marlborough, Southland). AutoTrader's dealer-profile pages
// still don't expose outbound website links (confirmed again this round),
// so every URL below was found by searching name+region directly, then
// independently fingerprinted (footer credit, live) and robots.txt-checked
// against /vehicles (all resolved to Motorcentral) before being added.
//
// A handful of Motorcentral sites this round (Ezy Cars, Dave Panton Car
// Sales, George Masters Motors, Autoworld Cars, Regent Car Court) return a
// 404 at /robots.txt rather than a file — i.e. no robots.txt is published at
// all. Per standard robots-exclusion convention that means unrestricted, and
// it lines up with the other Motorcentral sites fingerprinted in this same
// batch, whose robots.txt is the identical boilerplate disallowing only
// backend/admin paths (never /vehicles) — so these were included too.
//
// Excluded this round, with reasons:
// - Sterling Cars — eMarketingEye platform (confirmed live), not one of our
//   3 adapters.
// - MotorCo — no design/platform credit in footer; genuinely bespoke.
// - 1st AUTOMALL — real site found (1stautomall.co.nz) but every fetch
//   attempt (homepage and robots.txt) connection-reset; unreachable.
// - A T New Cars — atnewcars.co.nz does not resolve (DNS failure); likely
//   defunct.
// - A1 Cars (Lower Hutt) — no independent website found, only an AutoTrader
//   profile with no outbound link.
// - Honda Cars Wellington — resolves to Honda NZ's manufacturer storefront
//   (honda.co.nz/find-a-store/...), not a standalone dealer site/platform.
// - Motor Barn (Whangarei) and Beresford Auto Sales (Hastings) — both
//   domains currently resolve to the same parked "1st Domains" placeholder
//   page, not the actual dealer site.
// - Andre's Autos (Whangarei) — footer credits "Coruscate Digital", a
//   bespoke build, not one of our 3 platforms.
// - Dockside Motor Group (Napier) and Carnaby Cars (Gore) — both sites are
//   misconfigured Azure App Service deployments (TLS cert doesn't match the
//   custom domain); unreachable over HTTPS.
// - Stephen Hill Motors (Napier/Hastings) — no platform credit in footer;
//   appears bespoke despite a similar /vehicles URL shape.
// - Portside Cars (Ahuriri, Napier) — 301-redirects straight to gmm.co.nz
//   (George Masters Motors); not a separately hosted site, so not added as
//   its own entry (George Masters Motors is already included above).
// - HVS Motors (Gore/multi-region South Island) — could not get a usable
//   fetch of the homepage after repeated attempts; unconfirmed.
// - GWD Motor Group, Southern Automobiles, X Factor Cars, Bayswater
//   Vehicles, EuroCity, Northland Auto Group, Northland Toyota, Pacific
//   Motor Group, Hawkes Bay BMW, Hawkes Bay Toyota, Lexus of Hawkes Bay,
//   Wayne Kirk Motor Group, Eastland Toyota (Gisborne) — manufacturer
//   franchise dealerships (Toyota/Hyundai/BMW/Mitsubishi/Kia/Suzuki/etc.),
//   out of scope: manufacturer-templated storefronts, not one of our 3
//   shared platforms.
// - Enterprise Motor Group Gisborne — same chain as "Enterprise Cars",
//   already excluded in round 2 (fingerprinted, came back unknown).
// - Turners Cars Whangarei / Napier / Invercargill — already covered by the
//   single bespoke Turners entry in DEALER_SEED.
const EXPANSION_DEALER_SEED_4 = [
  { name: "Beacon Car Sales", url: "https://www.beaconcars.nz", region: "Whangarei", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Ezy Cars", url: "https://www.ezycars.nz", region: "Whangarei", type: "independent", platform: "motorcentral", robotsAllowed: true }, // no robots.txt published (404) — treated as unrestricted, see batch note above
  { name: "Value Cars Whangarei", url: "https://www.valuecarswhangarei.co.nz", region: "Whangarei", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Cars4U", url: "https://www.cars4uhb.co.nz", region: "Hastings, Hawke's Bay", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Dave Panton Car Sales", url: "https://www.davepantoncars.co.nz", region: "Taradale, Napier", type: "independent", platform: "motorcentral", robotsAllowed: true }, // no robots.txt published (404) — treated as unrestricted, see batch note above
  { name: "Drive Direct", url: "https://drivedirect.co.nz", region: "Pandora, Napier", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "George Masters Motors", url: "https://www.gmm.co.nz", region: "Hastings, Hawke's Bay", type: "independent", platform: "motorcentral", robotsAllowed: true }, // no robots.txt published (404) — treated as unrestricted, see batch note above
  { name: "Brendan Addis", url: "https://www.brendanaddis.co.nz", region: "Hastings, Hawke's Bay", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Autoworld Cars", url: "https://www.autoworldcars.co.nz", region: "Invercargill", type: "independent", platform: "motorcentral", robotsAllowed: true }, // no robots.txt published (404) — treated as unrestricted, see batch note above
  { name: "Millennium Motors", url: "https://www.millenniummotors.co.nz", region: "Gore, Southland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Regent Car Court", url: "https://www.regentcars.co.nz", region: "Invercargill", type: "independent", platform: "motorcentral", robotsAllowed: true }, // no robots.txt published (404) — treated as unrestricted, see batch note above
  { name: "Southern Euro Wholesale", url: "https://www.southerneuro.co.nz", region: "Invercargill", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Top Cars & Commercials", url: "https://www.topcars.co.nz", region: "Invercargill", type: "independent", platform: "motorcentral", robotsAllowed: true },
];

// Expansion round 5 — a full pass through AutoTrader NZ's dealer directory
// (all 17 pages) plus Trade Me Motors' regional dealer directory, run as a
// large batch of parallel fingerprint + robots.txt verification passes.
// Same bar as every prior round: platform confirmed live via footer/asset
// credit, and robots.txt checked against the platform's real listings path
// (not just the hom	epage) before inclusion. Given the volume this round
// (~250 candidates checked), exclusion reasons are summarized by category
// here rather than itemized per dealer as in earlier rounds — the detailed
// per-dealer reasons were captured during research but are not reproduced
// in full below. Categories excluded: sites confirmed on an unsupported
// platform (Motor360, Autostock Digital, WordPress, Weebly, AutoPlay,
// Vanilla Hayes, Kodaweb, WebAddress, MateBiz, "Designed by ___" bespoke
// agency builds, etc.); CarUpdater sites whose robots.txt blocks generic
// crawlers site-wide (several webdesign.co.nz-built dealer sites do this,
// same finding as research/dealer-sites.md §2a for Macaulay Motors);
// AdTorque Edge sites whose robots.txt disallows /stock for generic
// crawlers (same pattern as NZ Cheap Cars); manufacturer/franchise
// storefronts (Toyota, Mitsubishi, Mazda, Volvo, etc. dealer pages hosted
// on the manufacturer's own platform); dealers already in this file under
// a different batch (duplicate domain); and dealers whose real website
// could not be located or reached at all (DNS failures, broken/mismatched
// TLS certs on parked Azure App Service deployments, persistent connection
// resets, or AutoTrader profile pages with no extractable outbound link
// and no resolvable domain guess).
const EXPANSION_DEALER_SEED_5 = [
  { name: "Feron Motor Court", url: "https://www.feronmotorcourt.co.nz", region: "Alexandra, Otago", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Free to Sell Northland", url: "https://www.freetosell.co.nz", region: "Whangarei", type: "independent", platform: "motorcentral", robotsAllowed: true }, // no robots.txt published (404) — treated as unrestricted
  { name: "Future Motors", url: "https://www.futuremotors.co.nz", region: "Avondale, Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "G Autos", url: "https://www.tradincars.co.nz", region: "Hillcrest, Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Gem Cars", url: "https://www.gemcarsales.co.nz", region: "Tauranga (also Hamilton/Porirua)", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Get Cars", url: "https://www.getcars.co.nz", region: "Richmond, Tasman", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Grande Motors", url: "https://www.grandemotors.co.nz", region: "East Tamaki, Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Nova Cars", url: "https://www.novacars.co.nz", region: "Burnside, Christchurch", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Number 1 Motors", url: "https://www.number1motors.co.nz", region: "Manukau, Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "NZ Select Cars", url: "https://www.nzselectcars.co.nz", region: "Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "olGo Motors", url: "https://olgomotors.co.nz", region: "Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Automotive Direct 2020 Ltd", url: "https://www.automotivedirect.co.nz", region: "Feilding, Manawatu", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Ian Humphrey Motors", url: "https://www.ianhumphrey.co.nz", region: "Palmerston North", type: "independent", platform: "motorcentral", robotsAllowed: true }, // no robots.txt published (404) — treated as unrestricted
  { name: "Kidd Motor Group", url: "https://www.kiddmotorgroup.co.nz", region: "Palmerston North", type: "independent", platform: "adtorque_edge", robotsAllowed: true },
  { name: "Better Motors", url: "https://www.bettermotors.co.nz", region: "Masterton, Wairarapa", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Kerry Harvey Autos Ltd", url: "https://www.kerryharveyautos.co.nz", region: "Palmerston North", type: "independent", platform: "motorcentral", robotsAllowed: true }, // no robots.txt published — treated as unrestricted
  { name: "Auto 66", url: "https://www.auto66.co.nz", region: "Frankton, Hamilton", type: "independent", platform: "motorcentral", robotsAllowed: true }, // no robots.txt published — treated as unrestricted
  { name: "Auto Auctioneers Hamilton Ltd", url: "https://www.autoauctioneers.co.nz", region: "Te Rapa, Hamilton", type: "independent", platform: "motorcentral", robotsAllowed: true }, // no robots.txt published — treated as unrestricted
  { name: "Car Connexxion", url: "https://www.ccx.co.nz", region: "Tauranga", type: "independent", platform: "motorcentral", robotsAllowed: true }, // no robots.txt published (404) — treated as unrestricted
  { name: "Driven Auto Sales", url: "https://www.drivenauto.co.nz", region: "Tauriko, Tauranga", type: "independent", platform: "motorcentral", robotsAllowed: true }, // no robots.txt published (404) — treated as unrestricted
  { name: "Auto Discount", url: "https://www.autodiscount.co.nz", region: "Mangere, Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Auto Globe", url: "https://www.autoglobe.kiwi", region: "St Johns, Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "AIW Cars", url: "https://www.autoimportswholesale.co.nz", region: "Masterton, Wairarapa", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Auto Legend", url: "https://www.autolegend.co.nz", region: "East Tāmaki / Albany, Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Autostation", url: "https://www.autostation.co.nz", region: "Wairau Valley, North Shore, Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Phil Good Motors", url: "https://www.philgoodmotors.co.nz", region: "Otahuhu, Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Precision Autos Henderson", url: "https://www.precisionautos.co.nz", region: "Henderson, Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Roadways Limited", url: "https://www.roadways.nz", region: "Sockburn, Christchurch", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Rob McLellan Motors Ltd", url: "https://www.robmclellanmotors.co.nz", region: "Dunedin", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "SCM Commercials", url: "https://www.scmcommercials.co.nz", region: "Drury, Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Selected Autos", url: "https://www.selectedautos.co.nz", region: "Grey Lynn, Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Sithari Cars", url: "https://www.sitharicars.co.nz", region: "Henderson, Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true }, // no robots.txt published (404) — treated as unrestricted
  { name: "Southern Autos Botany", url: "https://southernautos.co.nz", region: "Golflands, Auckland", type: "franchise", platform: "adtorque_edge", robotsAllowed: true }, // Suzuki/JAC franchise dealer on the shared AdTorque Edge platform
  { name: "Stadium Cars Ltd", url: "https://www.stadiumcars.co.nz", region: "Christchurch (also Tauranga, Dunedin, Rangiora)", type: "chain", platform: "motorcentral", robotsAllowed: true },
  { name: "Summit Motors Te Aroha", url: "https://www.summitmotors.co.nz", region: "Te Aroha, Waikato", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Superior Cars Ltd", url: "http://www.superiorcars.co.nz", region: "New Plymouth, Taranaki", type: "independent", platform: "motorcentral", robotsAllowed: true }, // no robots.txt published (404) — treated as unrestricted
  { name: "Supersport Cars", url: "http://www.supersportcars.co.nz", region: "Hornby, Christchurch", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Taupo Vehicle Traders", url: "https://www.taupotraders.co.nz", region: "Taupo", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Taylormade Motors Ltd", url: "https://www.taylormademotors.co.nz", region: "Dunedin", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "The Car Company Limited", url: "https://www.carcompanynelson.co.nz", region: "Nelson", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "The Car Shack", url: "https://www.carshack.co.nz", region: "Papatoetoe, Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "The Car Warehouse", url: "https://www.carwarehouse.co.nz", region: "Henderson, Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Toys on Wheels", url: "https://www.toysonwheels.co.nz", region: "Christchurch", type: "independent", platform: "motorcentral", robotsAllowed: true }, // no robots.txt published (404) — treated as unrestricted
  { name: "Town and Country Motors Ltd", url: "https://www.tcm4wd.co.nz", region: "Christchurch", type: "independent", platform: "motorcentral", robotsAllowed: true }, // no robots.txt published (404) — treated as unrestricted
  { name: "Trade-In Clearance Autocentre", url: "https://www.tradeinclearance.co.nz", region: "Lower Hutt, Wellington", type: "independent", platform: "motorcentral", robotsAllowed: true }, // no robots.txt published (404) — treated as unrestricted
  { name: "Transworld Motors", url: "https://www.transworldmotors.co.nz", region: "Christchurch", type: "independent", platform: "motorcentral", robotsAllowed: true }, // no robots.txt published (404) — treated as unrestricted
  { name: "Inch Quality European", url: "https://www.inchqualityeuropean.co.nz", region: "Christchurch", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Infinity Auto Import", url: "https://www.infinityautoimports.co.nz", region: "New Lynn, Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Infinity Cars", url: "https://www.infinitycars.co.nz", region: "Glenfield, Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Jasmac Cars", url: "https://www.jasmaccars.co.nz", region: "Addington, Christchurch", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "All Kars", url: "https://www.allkars.co.nz", region: "Whangarei, Northland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Aotearoa Cars", url: "https://www.aotearoacars.co.nz", region: "Sydenham, Christchurch", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Auckland City Electric Vehicles", url: "https://www.acev.co.nz", region: "Takapuna, Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Auckland Petrolheads Limited", url: "https://www.aucklandpetrolheads.co.nz", region: "Eden Terrace, Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Aura Cars", url: "https://www.auracars.co.nz", region: "Manukau, Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Auto 4 U Penrose", url: "https://www.auto4u.co.nz", region: "Penrose, Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true }, // no robots.txt published — treated as unrestricted
  { name: "Auto Aspire", url: "https://www.autoaspire.co.nz", region: "St Johns, Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Auto Depot", url: "https://www.autodepot.co.nz", region: "Phillipstown, Christchurch", type: "independent", platform: "motorcentral", robotsAllowed: true }, // no robots.txt published — treated as unrestricted
  { name: "Trendy Cars", url: "https://www.trendycars.co.nz", region: "Manurewa/Otahuhu, Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "True Value Cars", url: "https://www.truevaluecars.co.nz", region: "Christchurch, Dunedin, Invercargill", type: "chain", platform: "motorcentral", robotsAllowed: true },
  { name: "Universal Imports", url: "https://www.universalimports.co.nz", region: "Henderson, Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true }, // no robots.txt published (404) — treated as unrestricted
  { name: "Ute Nation", url: "https://www.utenation.co.nz", region: "Christchurch", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "V Do Motors Ltd", url: "https://www.vdomotors.co.nz", region: "Onehunga, Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true }, // no robots.txt published (404) — treated as unrestricted
  { name: "Value Motors", url: "https://www.valuemotors.co.nz", region: "Lower Hutt / Petone, Wellington", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Ultimate Motor Group", url: "https://umg.co.nz", region: "Mount Maunganui / Tauranga, Bay of Plenty", type: "franchise", platform: "adtorque_edge", robotsAllowed: true }, // Ford/Mazda franchise dealer on the shared AdTorque Edge platform
  { name: "Vision Autos Sales Mega Centre", url: "https://www.visionautos.co.nz", region: "Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true }, // no robots.txt published (404) — treated as unrestricted
  { name: "Wairarapa Mitsubishi", url: "https://www.wairarapamitsubishi.co.nz", region: "Wairarapa", type: "franchise", platform: "motorcentral", robotsAllowed: true },
  { name: "Wall Motors", url: "https://www.wallmotors.co.nz", region: "Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Wanaka Auto Sales", url: "https://www.wanakaautosales.co.nz", region: "Wanaka, Otago", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Water View Cars", url: "https://www.waterviewcars.co.nz", region: "Canterbury", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Westend Autos", url: "https://www.westendautos.co.nz", region: "Waikato", type: "independent", platform: "motorcentral", robotsAllowed: true }, // no robots.txt published (404) — treated as unrestricted
  { name: "Wheels Online", url: "https://www.wheelsonline.co.nz", region: "Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Wholesale Autos", url: "https://www.wholesaleautos.co.nz", region: "Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true }, // no robots.txt published (404) — treated as unrestricted
  { name: "Wholesale Cars Direct", url: "https://www.wholesalecarsdirect.co.nz", region: "Wellington", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Wilkinson Trading Limited", url: "https://www.wilkinsontrading.co.nz", region: "Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true }, // no robots.txt published (404) — treated as unrestricted
  { name: "King Street Cars", url: "https://www.kingstreetcars.co.nz", region: "Upper Hutt, Wellington", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Kiwi Affordable Cars", url: "https://www.kiwiaffordablecars.co.nz", region: "Taita, Lower Hutt", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Kiwi Magic", url: "https://www.kiwimagicltd.co.nz", region: "Masterton, Wairarapa", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Lloyd Wilson Motors", url: "https://www.lloydwilsonmotors.co.nz", region: "Dunedin", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Manukau Autos", url: "https://www.manukauautos.co.nz", region: "Manukau, Auckland", type: "franchise", platform: "adtorque_edge", robotsAllowed: true }, // Mitsubishi franchise dealer on the shared AdTorque Edge platform
  { name: "Merit Cars", url: "https://www.meritcars.co.nz", region: "New Plymouth, Taranaki", type: "independent", platform: "motorcentral", robotsAllowed: true }, // no robots.txt published — treated as unrestricted
  { name: "Merlion Motors", url: "https://www.merlionmotors.co.nz", region: "Penrose, Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Bro Cars", url: "https://brocars.co.nz", region: "Papatoetoe, Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "CC Autos", url: "https://www.cncauto.co.nz", region: "Brixton, Taranaki", type: "independent", platform: "motorcentral", robotsAllowed: true }, // AutoTrader lists this dealer as "CC Autos" but the actual domain is cncauto.co.nz — ccautos.co.nz is an unrelated parked domain, verified via footer "powered by Motorcentral & MTF"
  { name: "Chapel Street Car Court", url: "https://www.chapelstreetcarcourt.co.nz", region: "Masterton, Wairarapa", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Christchurch European", url: "https://www.christchurcheuropean.co.nz", region: "Christchurch", type: "independent", platform: "motorcentral", robotsAllowed: true }, // no robots.txt published (404) — treated as unrestricted
  { name: "Cleverleys", url: "https://www.cleverleys.co.nz", region: "Balclutha, Otago", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "CMK Autos", url: "https://www.cmkautos.co.nz", region: "Onehunga, Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Commercials on Kaikorai", url: "https://www.commercialsonkaikorai.co.nz", region: "Kenmure, Dunedin", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Contour Cars", url: "https://www.contourcars.co.nz", region: "Upper Hutt, Wellington", type: "independent", platform: "motorcentral", robotsAllowed: true }, // no robots.txt published (404) — treated as unrestricted
  { name: "Counties Commercial Centre", url: "https://www.countiescommercial.co.nz", region: "Pukekohe, Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true }, // no robots.txt published (404) — treated as unrestricted
  { name: "Chevron Quality Cars", url: "https://www.chevronqualitycars.co.nz", region: "Christchurch", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Car Planet Limited", url: "https://carplanet.co.nz", region: "Papatoetoe, Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true }, // distinct domain from planetcars.co.nz (already in DB), verified independently
  { name: "Cars 2 Go", url: "https://www.cars2go.co.nz", region: "Blenheim, Marlborough (also Woolston, Christchurch)", type: "independent", platform: "motorcentral", robotsAllowed: true }, // no robots.txt published — treated as unrestricted
  { name: "Cars Connect", url: "https://www.carsconnect.co.nz", region: "New Lynn, Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true }, // no robots.txt published — treated as unrestricted
  { name: "Caryard", url: "https://www.caryard.kiwi", region: "Sydenham, Christchurch", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Central Otago Motor Group", url: "https://www.centralotagomotorgroup.co.nz", region: "Cromwell and Queenstown, Otago", type: "franchise", platform: "adtorque_edge", robotsAllowed: true }, // Hyundai/Kia/Isuzu/Suzuki/Jeep/RAM/BYD franchise group on the shared AdTorque Edge platform
  { name: "High Beam Cars", url: "https://highbeamcars.co.nz", region: "Otahuhu, Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Hutt City Autoworld", url: "https://huttcityautoworld.co.nz", region: "Lower Hutt", type: "independent", platform: "motorcentral", robotsAllowed: true }, // no robots.txt published — treated as unrestricted
  { name: "Ichinen Autos (NZ)", url: "https://ichinenautos.co.nz", region: "Auckland (Greenlane, Penrose, North Shore)", type: "chain", platform: "motorcentral", robotsAllowed: true },
  { name: "DTR Motors", url: "https://dtrmotors.co.nz", region: "New Lynn, Auckland (also Hornby, Christchurch)", type: "chain", platform: "motorcentral", robotsAllowed: true },
  { name: "Town and Country Motors", url: "https://www.townandcountrymotors.co.nz", region: "Waikato", type: "independent", platform: "motorcentral", robotsAllowed: true }, // distinct from Town and Country Motors Ltd (tcm4wd.co.nz, Christchurch) already listed above
  { name: "Unique Cars (NZ) Ltd", url: "https://www.uniquecarsltd.co.nz", region: "Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Chamz Cars", url: "https://www.chamz.co.nz", region: "Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Cheapies Christchurch", url: "https://www.cheapieschristchurch.co.nz", region: "Christchurch", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Christchurch Premium Cars", url: "https://www.cpcars.co.nz", region: "Christchurch", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Coventry Cars", url: "https://www.coventrycars.co.nz", region: "Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Craig McLeod Wholesale Cars", url: "https://www.cmcars.co.nz", region: "Hamilton", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "CroweSport", url: "https://www.crowesport.co.nz", region: "Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Darryl Phillips Motor Company", url: "https://www.darrylphillips.co.nz", region: "Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Deals On Wheels Motor Group", url: "http://www.dealsonwheelsnz.co.nz", region: "Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Devonport Car Company", url: "https://www.devcars.co.nz", region: "Devonport, Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Doug Drake Motors", url: "https://www.dougdrake.co.nz", region: "Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Drive EV", url: "https://www.driveev.co.nz", region: "Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
  { name: "Drive n Save Cars", url: "https://www.driveandsavecars.co.nz", region: "Auckland", type: "independent", platform: "motorcentral", robotsAllowed: true },
];

async function seedDealers() {
  const allDealers = [...DEALER_SEED, ...EXPANSION_DEALER_SEED, ...EXPANSION_DEALER_SEED_2, ...EXPANSION_DEALER_SEED_3, ...EXPANSION_DEALER_SEED_4, ...EXPANSION_DEALER_SEED_5];
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
