import assert from "node:assert/strict";
import {
  classifyPublicSectorSource,
  detectAgencyFromUrl,
  detectPatentIdentifier,
  detectSBIRReference,
  extractPublicSectorSignals,
  mapPublicSectorSignalsToClaims
} from "../lib/research/public-sector-recognition";

function includes(value: string[], expected: string) {
  assert.ok(value.includes(expected), `Expected ${JSON.stringify(value)} to include ${expected}`);
}

const nasa = extractPublicSectorSignals({
  url: "https://technology.nasa.gov/patent/TOP2-123",
  title: "NASA technology transfer patent available for licensing"
});
includes(detectAgencyFromUrl("https://www.nasa.gov/directorates/stmd/"), "NASA");
assert.equal(classifyPublicSectorSource({ url: "https://www.nasa.gov/missions/" }), "government");
assert.equal(nasa.hasPatentSource, true);
includes(mapPublicSectorSignalsToClaims(nasa), "technology_transfer");

const darpa = extractPublicSectorSignals({
  url: "https://www.darpa.mil/program/air-space-total-awareness-for-rapid-tactical-execution",
  title: "DARPA ASTARTE program"
});
includes(darpa.agencies, "DARPA");
assert.equal(classifyPublicSectorSource({ url: "https://www.darpa.mil/program/example" }), "government");
includes(mapPublicSectorSignalsToClaims(darpa), "agency_program");

assert.equal(
  classifyPublicSectorSource({ url: "https://arpa-e.energy.gov/technologies/programs" }),
  "government"
);
assert.equal(classifyPublicSectorSource({ url: "https://www.energy.gov/science" }), "government");
assert.equal(classifyPublicSectorSource({ url: "https://www.defense.gov/news/" }), "government");
assert.equal(classifyPublicSectorSource({ url: "https://www.af.mil/News/" }), "government");
assert.equal(classifyPublicSectorSource({ url: "https://www.spaceforce.mil/News/" }), "government");
assert.equal(classifyPublicSectorSource({ url: "https://www.army.mil/" }), "government");
assert.equal(classifyPublicSectorSource({ url: "https://www.navy.mil/" }), "government");
assert.equal(classifyPublicSectorSource({ url: "https://www.dhs.gov/science-and-technology" }), "government");
assert.equal(classifyPublicSectorSource({ url: "https://www.nsf.gov/awardsearch/" }), "government");
assert.equal(classifyPublicSectorSource({ url: "https://www.nih.gov/research-training" }), "government");
assert.equal(classifyPublicSectorSource({ url: "https://www.nist.gov/programs-projects" }), "government");
assert.equal(classifyPublicSectorSource({ url: "https://www.noaa.gov/research" }), "government");
assert.equal(classifyPublicSectorSource({ url: "https://www.faa.gov/uas" }), "government");
assert.equal(classifyPublicSectorSource({ url: "https://www.epa.gov/research" }), "government");
assert.equal(classifyPublicSectorSource({ url: "https://patents.google.com/patent/US7654321B2" }), "patent");
assert.equal(classifyPublicSectorSource({ url: "https://www.uspto.gov/patents/search" }), "patent");
assert.equal(classifyPublicSectorSource({ url: "https://patents.justia.com/patent/11223344" }), "patent");
assert.equal(classifyPublicSectorSource({ url: "https://www.lens.org/lens/patent/123-456" }), "patent");

const sbirText = "The company received an SBIR Phase II award through an STTR-related topic.";
assert.equal(detectSBIRReference(sbirText), true);
const sbir = extractPublicSectorSignals({ title: sbirText });
includes(mapPublicSectorSignalsToClaims(sbir), "sbir_sttr");
assert.ok(!mapPublicSectorSignalsToClaims(sbir).includes("government_contract"));
assert.ok(!mapPublicSectorSignalsToClaims(sbir).includes("government_funding"));

const patents = detectPatentIdentifier("U.S. Patent No. 10,123,456 and US2024/0123456A1 describe related IP.");
assert.ok(patents.length >= 2);
const patentClaims = mapPublicSectorSignalsToClaims(
  extractPublicSectorSignals({
    url: "https://patents.google.com/patent/US10123456B2",
    title: "Patent record"
  })
);
includes(patentClaims, "patent");
assert.ok(!patentClaims.includes("patent_assignee"));
assert.ok(!patentClaims.includes("patent_license_available"));
assert.ok(!patentClaims.includes("patent_exclusivity"));

const governmentClaims = mapPublicSectorSignalsToClaims(
  extractPublicSectorSignals({
    url: "https://www.nasa.gov/missions/",
    title: "NASA mission overview"
  })
);
includes(governmentClaims, "government_relevance");
assert.ok(!governmentClaims.includes("government_contract"));
assert.ok(!governmentClaims.includes("government_funding"));
assert.ok(!governmentClaims.includes("government_customer"));
assert.ok(!governmentClaims.includes("procurement_signal"));

const weak = extractPublicSectorSignals({
  url: "https://example.com/blog/interesting-robotics-startup",
  title: "Interesting robotics startup"
});
assert.equal(classifyPublicSectorSource({ url: "https://example.com/blog/interesting-robotics-startup" }), "unknown");
assert.equal(weak.confidence, "none");
assert.equal(weak.hasGovernmentSource, false);
assert.equal(weak.hasPatentSource, false);

console.log("Public-sector recognition verification passed.");
