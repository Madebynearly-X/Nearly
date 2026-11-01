import test from "node:test";
import assert from "node:assert/strict";

import {
  buildLeadId,
  createDedupeKey,
  normalizePackage,
  normalizeSource,
  normalizeText,
} from "../lib/enquiry-validation.js";

test("normalizeText trims and truncates input safely", () => {
  assert.equal(normalizeText("  hello world   ", 10), "hello wor");
  assert.equal(normalizeText("   "), "");
});

test("package values are normalized against the supported offer list", () => {
  assert.equal(normalizePackage("Landing page"), "landing-page");
  assert.equal(normalizePackage("care plan"), "care-plan");
  assert.equal(normalizePackage("digital-presence"), "digital-presence");
  assert.equal(normalizePackage("Presence Essentials"), "digital-presence");
  assert.equal(normalizePackage("script>alert(1)</script>"), null);
});

test("source values are normalised and default to website when absent", () => {
  assert.equal(normalizeSource("Google Search"), "google");
  assert.equal(normalizeSource(""), "website");
  assert.equal(normalizeSource("<script>evil</script>"), "other");
});

test("lead IDs are stable enough to trace enquiries without exposing private data", () => {
  const id = buildLeadId(new Date("2026-10-11T01:00:00Z"));
  assert.match(id, /^lead-20261011T010000Z-[a-z0-9]+$/);
});

test("duplicate keys are deterministic for the same enquiry data", () => {
  const first = createDedupeKey({
    name: "Jane Doe",
    email: "jane@example.com",
    business: "Coastal Fitness",
    phone: "+27 82 555 1234",
    package: "business-website",
    source: "website",
    details: "Need a website for our new gym",
  });

  const second = createDedupeKey({
    name: "Jane Doe",
    email: "jane@example.com",
    business: "Coastal Fitness",
    phone: "+27825551234",
    package: "Business Website",
    source: "google",
    details: "Need a website for our new gym",
  });

  assert.equal(first, second);
});
