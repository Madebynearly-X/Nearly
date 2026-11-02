export const VALID_PACKAGES = {
  "landing-page": "Landing page",
  "starter-website": "Starter website",
  "business-website": "Business website",
  "care-plan": "Website care",
  "not-sure": "Not sure yet",
};

export const VALID_SOURCES = {
  website: "website",
  google: "google",
  referral: "referral",
  linkedin: "linkedin",
  whatsapp: "whatsapp",
  instagram: "instagram",
  facebook: "facebook",
  email: "email",
  other: "other",
};

export function normalizeText(value, maxLength = 0) {
  if (typeof value !== "string") return "";
  let text = value.replace(/\s+/g, " ").trim();
  if (maxLength > 0 && text.length > maxLength) {
    text = text.slice(0, maxLength - 1);
  }
  return text;
}

export function normalizePackage(value) {
  const input = normalizeText(value, 80).toLowerCase();
  if (!input) return null;
  const normalized = input.replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (Object.hasOwn(VALID_PACKAGES, normalized)) {
    return normalized;
  }

  const aliases = {
    landing: "landing-page",
    landingpage: "landing-page",
    starter: "starter-website",
    business: "business-website",
    care: "care-plan",
    "website-care": "care-plan",
    "care-plan": "care-plan",
    "not-sure-yet": "not-sure",
    unsure: "not-sure",
    "talk-it-through": "not-sure",
  };

  return Object.hasOwn(aliases, normalized) ? aliases[normalized] : null;
}

export function normalizeSource(value) {
  const input = normalizeText(value, 80).toLowerCase();
  if (!input) return "website";
  const normalized = input.replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (Object.hasOwn(VALID_SOURCES, normalized)) {
    return normalized;
  }

  const aliases = {
    "google-search": "google",
    "googleads": "google",
    "g-search": "google",
    social: "other",
    "word-of-mouth": "referral",
    friend: "referral",
    recommendation: "referral",
    referred: "referral",
    wa: "whatsapp",
    chat: "whatsapp",
    ig: "instagram",
    fb: "facebook",
    mail: "email",
  };

  return Object.hasOwn(aliases, normalized) ? aliases[normalized] : "other";
}

export function buildLeadId(date = new Date()) {
  const stamp = date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const suffix = Math.random().toString(36).slice(2, 8);
  return `lead-${stamp}-${suffix}`;
}

export function getUrlParam(search, ...keys) {
  const params = new URLSearchParams(search || "");
  for (const key of keys) {
    const value = params.get(key);
    if (value !== null && value.trim() !== "") {
      return value;
    }
  }
  return "";
}

export function createDedupeKey(payload) {
  const normalized = {
    name: normalizeText(payload.name, 120).toLowerCase(),
    email: normalizeText(payload.email, 254).toLowerCase(),
    business: normalizeText(payload.business, 160).toLowerCase(),
    phone: normalizeText(payload.phone, 50).replace(/\D/g, ""),
    package: normalizePackage(payload.package) || "not-sure",
    details: normalizeText(payload.details, 5000).toLowerCase(),
  };

  return Array.from(Object.entries(normalized))
    .map(([key, value]) => `${key}:${value}`)
    .join("|");
}
