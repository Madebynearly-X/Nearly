import {
  buildLeadId,
  createDedupeKey,
  normalizePackage,
  normalizeSource,
  normalizeText,
} from "../../lib/enquiry-validation.js";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

const DEDUPE_WINDOW_MS = 1000 * 60 * 15;
const RATE_LIMIT_WINDOW_MS = 1000 * 60 * 15;
const MAX_REQUESTS_PER_WINDOW = 6;
const requestHistory = new Map();

function json(body, status = 200, errorCode) {
  if (body.success === false) {
    const code = errorCode || body.code || ({
      400: "validation_failed",
      403: "verification_failed",
      405: "method_not_allowed",
      409: "duplicate_submission",
      413: "request_too_large",
      415: "invalid_content_type",
      429: "rate_limited",
      502: "provider_failed",
      503: "service_unavailable",
    }[status] || "request_failed");
    body = {
      ...body,
      code,
      error: { code, message: body.message },
    };
  }
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function readField(data, name, maxLength) {
  const value = data[name];
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function getRequestIdentifier(request) {
  const forwardedFor = request.headers.get("CF-Connecting-IP") || request.headers.get("x-forwarded-for") || "unknown";
  return forwardedFor.split(",")[0].trim() || "unknown";
}

function checkRateLimit(request, email) {
  const identifier = `${getRequestIdentifier(request)}:${normalizeText(email, 254).toLowerCase()}`;
  const now = Date.now();
  const history = requestHistory.get(identifier) || [];
  const recent = history.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  recent.push(now);
  requestHistory.set(identifier, recent);
  return true;
}

function checkDuplicateSubmission(fields) {
  const dedupeKey = createDedupeKey(fields);
  const now = Date.now();
  const previous = requestHistory.get(`dedupe:${dedupeKey}`);
  if (previous && now - previous < DEDUPE_WINDOW_MS) {
    return false;
  }
  requestHistory.set(`dedupe:${dedupeKey}`, now);
  return true;
}

function releaseDuplicateSubmission(fields) {
  requestHistory.delete(`dedupe:${createDedupeKey(fields)}`);
}

async function recordEnquiryInGoogleSheet(env, fields, countryCode) {
  if (!env.GOOGLE_SHEETS_WEBHOOK_URL && !env.GOOGLE_SHEETS_WEBHOOK_TOKEN) return { enabled: false };
  if (!env.GOOGLE_SHEETS_WEBHOOK_URL || !env.GOOGLE_SHEETS_WEBHOOK_TOKEN) {
    console.error("Google Sheets lead recording is not configured: both webhook secrets are required.");
    return { enabled: true, recorded: false };
  }

  let webhookUrl;
  try {
    webhookUrl = new URL(env.GOOGLE_SHEETS_WEBHOOK_URL);
  } catch {
    console.error("Google Sheets lead recording is not configured: webhook URL is invalid.");
    return { enabled: true, recorded: false };
  }
  if (webhookUrl.protocol !== "https:" || webhookUrl.hostname !== "script.google.com"
    || webhookUrl.username || webhookUrl.password) {
    console.error("Google Sheets lead recording is not configured: webhook URL must be a Google Apps Script HTTPS URL.");
    return { enabled: true, recorded: false };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: env.GOOGLE_SHEETS_WEBHOOK_TOKEN,
        ...fields,
        phone: fields.phone ? `${countryCode} ${fields.phone}` : "",
        received_at: new Date().toISOString(),
        status: "New",
      }),
      signal: controller.signal,
    });

    let result;
    try {
      result = await response.json();
    } catch {
      let responseHost = "unknown";
      try {
        responseHost = new URL(response.url).hostname;
      } catch {
        // Keep the diagnostic safe if the platform does not expose a valid final URL.
      }
      console.error("Enquiry automation returned an unreadable response.", {
        status: response.status,
        contentType: response.headers.get("Content-Type") || "unknown",
        redirected: response.redirected,
        responseHost,
      });
      return { enabled: true, recorded: false };
    }

    if (!response.ok || !result || typeof result !== "object"
      || result.success !== true || result.recorded !== true) {
      console.error("Google Sheets webhook did not confirm lead recording.", {
        status: response.status,
        message: result && typeof result.message === "string" ? result.message : "No recording confirmation",
      });
      return { enabled: true, recorded: false };
    }

    return { enabled: true, recorded: true };
  } catch (error) {
    console.error("Google Sheets webhook request failed.", error);
    return { enabled: true, recorded: false };
  } finally {
    clearTimeout(timeout);
  }
}

async function verifyTurnstile(token, secret, expectedHostname) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: token }),
      signal: controller.signal,
    });

    let result;
    try {
      result = await response.json();
    } catch (error) {
      console.error("Turnstile returned an unreadable response.", error);
      return null;
    }

    if (!response.ok || !result || typeof result !== "object" || Array.isArray(result)) {
      console.error("Turnstile verification service returned an invalid response.", {
        status: response.status,
      });
      return null;
    }

    return result.success === true
      && result.hostname === expectedHostname
      && result.action === "enquiry";
  } catch (error) {
    console.error("Turnstile verification request failed.", error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get("Origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return json({ success: false, message: "This form request could not be verified." }, 403);
  }

  const contentType = request.headers.get("Content-Type") || "";
  if (contentType.split(";")[0].trim().toLowerCase() !== "application/json") {
    return json({ success: false, message: "Please submit the enquiry form using the website." }, 415);
  }

  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > 20_000) {
    return json({ success: false, message: "The form submission is too large." }, 413);
  }

  let requestBody;
  try {
    const rawBody = await request.clone().text();
    if (new TextEncoder().encode(rawBody).byteLength > 20_000) {
      return json({ success: false, message: "The form submission is too large." }, 413);
    }
    requestBody = await request.json();
  } catch {
    return json({ success: false, message: "Please check the form and try again." }, 400);
  }

  if (!requestBody || typeof requestBody !== "object" || Array.isArray(requestBody)) {
    return json({ success: false, message: "Please check the form and try again." }, 400);
  }

  if (readField(requestBody, "_honey", 500)) {
    return json({ success: false, message: "Please check the form and try again." }, 400);
  }

  const fields = {
    name: readField(requestBody, "name", 120),
    email: readField(requestBody, "email", 254),
    phone: readField(requestBody, "phone", 50),
    business: readField(requestBody, "business", 160),
    package: readField(requestBody, "package", 80),
    details: readField(requestBody, "details", 5000),
    source: readField(requestBody, "source", 80),
  };
  const countryCode = readField(requestBody, "country_code", 5);

  if (!fields.name || !fields.email || !fields.details) {
    return json({ success: false, message: "Please complete the required fields." }, 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    return json({ success: false, message: "Please enter a valid email address." }, 400);
  }

  const normalizedPackage = normalizePackage(fields.package);
  if (fields.package && !normalizedPackage) {
    return json({ success: false, message: "Please choose a valid service or leave the field blank." }, 400);
  }
  const normalizedSource = normalizeSource(fields.source || "website");
  fields.package = normalizedPackage || "not-sure";
  fields.source = normalizedSource;

  if (fields.phone && !/^\+\d{1,3}$/.test(countryCode)) {
    return json({ success: false, message: "Please select a valid country calling code." }, 400);
  }

  if (!checkRateLimit(request, fields.email)) {
    return json({ success: false, message: "Too many submissions have been sent from this address recently. Please email us directly." }, 429);
  }

  if (!env.TURNSTILE_SECRET_KEY) {
    console.error("Enquiry form is not configured: TURNSTILE_SECRET_KEY is missing.");
    return json({ success: false, message: "The security check is temporarily unavailable. Please email us directly." }, 503, "configuration_missing");
  }

  const turnstileToken = readField(requestBody, "cf-turnstile-response", 2048);
  if (!turnstileToken) {
    return json({ success: false, message: "Please complete the security check and try again." }, 400);
  }

  const verification = await verifyTurnstile(
    turnstileToken,
    env.TURNSTILE_SECRET_KEY,
    new URL(request.url).hostname,
  );
  if (verification === null) {
    return json({ success: false, message: "The security check is temporarily unavailable. Please try again shortly." }, 503);
  }
  if (!verification) {
    return json({ success: false, message: "The security check failed or expired. Please retry it and submit again." }, 403);
  }

  if (!env.WEB3FORMS_ACCESS_KEY) {
    console.error("Enquiry form is not configured: WEB3FORMS_ACCESS_KEY is missing.");
    return json({ success: false, message: "The enquiry form is temporarily unavailable. Please email us directly." }, 503, "configuration_missing");
  }

  if (!checkDuplicateSubmission(fields)) {
    return json({ success: false, message: "This enquiry looks like a duplicate of one we already received. Please allow a moment and try again or email us directly." }, 409);
  }

  const leadId = buildLeadId();
  fields.lead_id = leadId;

  let providerResponse;
  try {
    providerResponse = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_key: env.WEB3FORMS_ACCESS_KEY,
        subject: "New enquiry from NEARLY Studio website",
        from_name: "NEARLY Studio website",
        replyto: fields.email,
        ...fields,
        phone: fields.phone ? `${countryCode} ${fields.phone}` : "",
        source: fields.source,
        package: fields.package,
        lead_id: leadId,
      }),
    });
  } catch (error) {
    console.error("Web3Forms request failed.", error);
    return json({ success: false, message: "We couldn't confirm whether your enquiry was delivered. Please email us directly before submitting again to avoid a duplicate." }, 502);
  }

  let result;
  try {
    result = await providerResponse.json();
  } catch (error) {
    console.error("Web3Forms returned an unreadable response.", error);
    return json({ success: false, message: "We couldn't confirm whether your enquiry was delivered. Please email us directly before submitting again to avoid a duplicate." }, 502);
  }

  if (!providerResponse.ok || !result || typeof result !== "object" || result.success !== true) {
    releaseDuplicateSubmission(fields);
    console.error("Web3Forms rejected an enquiry.", {
      status: providerResponse.status,
      message: result && typeof result.message === "string" ? result.message : "Unknown provider error",
    });
    return json({ success: false, message: "We couldn't send your enquiry just now. Please try again or email us directly." }, 502);
  }

  const sheet = await recordEnquiryInGoogleSheet(env, fields, countryCode);
  if (sheet.enabled && !sheet.recorded) {
    return json({
      success: true,
      warning: "Your enquiry was accepted for email delivery, but we couldn't confirm that it was added to our lead tracker.",
    });
  }

  return json({ success: true });
}

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return json({ success: false, message: "Method not allowed." }, 405);
  }
  return onRequestPost(context);
}
