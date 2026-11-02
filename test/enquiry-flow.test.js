import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

import { onRequest as handleEnquiry } from "../functions/api/enquiry.js";
import { onRequest as handleClientProjects } from "../functions/api/client-projects.js";
import { onRequestPost as handleCreateClient } from "../functions/api/create-client.js";
import { onRequestGet as handleLeadSummary } from "../functions/api/leads-summary.js";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const testCases = [];
let leadNumber = 0;

function enquiryFields(overrides = {}) {
  leadNumber += 1;
  return {
    name: `Test Lead ${leadNumber}`,
    email: `test-lead-${leadNumber}@example.test`,
    phone: "",
    business: "Example business",
    package: "",
    details: "I would like to discuss a business website.",
    source: "website",
    country_code: "+27",
    _honey: "",
    "cf-turnstile-response": "mock-turnstile-token",
    ...overrides,
  };
}

function mockResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function submitEnquiry(fields, options = {}) {
  const originalFetch = globalThis.fetch;
  const calls = [];
  const turnstileResult = options.turnstileResult || {
    success: true,
    hostname: "nearly.example",
    action: "enquiry",
  };
  const providerResult = options.providerResult || { success: true };
  const sheetResult = options.sheetResult || { success: true, recorded: true };

  globalThis.fetch = async (input, init) => {
    const url = new URL(input instanceof URL ? input.toString() : typeof input === "string" ? input : input.url);
    calls.push({ url: url.toString(), init });
    if (url.hostname === "challenges.cloudflare.com") return mockResponse(turnstileResult);
    if (url.hostname === "api.web3forms.com") {
      if (options.onProviderRequest) await options.onProviderRequest(init);
      return mockResponse(providerResult, options.providerStatus || 200);
    }
    if (url.hostname === "script.google.com") {
      return mockResponse(sheetResult, options.sheetStatus || 200);
    }
    throw new Error(`Unexpected external request in mocked test: ${url.hostname}`);
  };

  try {
    const request = new Request("https://nearly.example/api/enquiry", {
      method: "POST",
      headers: {
        "Content-Type": options.contentType ?? "application/json",
        Origin: "https://nearly.example",
        "CF-Connecting-IP": "192.0.2.20",
      },
      body: options.rawBody ?? JSON.stringify(fields),
    });
    const response = await handleEnquiry({
      request,
      env: {
        TURNSTILE_SECRET_KEY: "mock-only-turnstile-key",
        WEB3FORMS_ACCESS_KEY: "mock-only-web3forms-key",
        ...options.env,
      },
    });
    return { response, body: await response.json(), calls };
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function createContactFormHarness(options = {}) {
  const source = await readFile(join(projectRoot, "contact-form.js"), "utf8");
  const handlers = {};
  const entries = [];
  const packageField = { value: options.packageValue || "" };
  const submit = { textContent: "Send enquiry", disabled: false };
  const summary = { hidden: true, focus() {} };
  const list = {
    replaceChildren() { entries.length = 0; },
    append(item) { entries.push(item.textContent); },
  };
  const live = { textContent: "" };
  const successMessage = { textContent: "" };
  const success = {
    hidden: true,
    querySelector() { return successMessage; },
    focus() {},
  };
  const turnstileContainer = { dataset: { sitekey: "mock-site-key", action: "enquiry" } };
  const themeHandlers = {};
  const turnstileRenders = [];
  const removedWidgets = [];
  const resetWidgets = [];
  let submitReadyAtAttach;
  let widgetNumber = 0;
  const form = {
    action: "/api/enquiry",
    dataset: { externalSubmit: "true" },
    querySelector(selector) {
      return {
        "#q-phone": null,
        "#q-package": packageField,
        "#q-source": null,
        "#enquiry-turnstile": turnstileContainer,
        'button[type="submit"]': submit,
        "[data-error-summary]": summary,
        "[data-error-list]": list,
        "[data-live]": live,
        "[data-form-success]": success,
      }[selector] ?? null;
    },
    addEventListener(name, handler) {
      if (name === "submit") submitReadyAtAttach = this.dataset.externalSubmitReady;
      handlers[name] = handler;
    },
    reportValidity() { return options.valid !== false; },
    reset() {},
  };
  class MockFormData {
    [Symbol.iterator]() {
      const entries = options.formEntries || {
        name: "Test",
        email: "test@example.test",
        phone: "+27 78 394 0421",
        business: "Example business",
        package: "business-website",
        details: "I would like to discuss a new website.",
        source: "website",
        country_code: "+27",
        _honey: "",
        "cf-turnstile-response": "mock-turnstile-token",
      };
      return Object.entries(entries)[Symbol.iterator]();
    }
  }
  const document = {
    documentElement: { dataset: { theme: options.theme || "light" } },
    querySelector() { return form; },
    createElement() { return { textContent: "" }; },
  };
  const window = {
    location: { search: "" },
    addEventListener(name, handler) { themeHandlers[name] = handler; },
    turnstile: {
      ready(callback) { callback(); },
      render(container, config) {
        turnstileRenders.push({ container, config });
        widgetNumber += 1;
        return `widget-${widgetNumber}`;
      },
      remove(widgetId) { removedWidgets.push(widgetId); },
      reset(widgetId) { resetWidgets.push(widgetId); },
    },
  };
  let fetchCalls = 0;
  const fetch = (...args) => {
    fetchCalls += 1;
    return options.fetch(...args);
  };

  runInNewContext(source, {
    document,
    window,
    URLSearchParams,
    FormData: MockFormData,
    fetch,
  });

  return {
    form, handlers, entries, live, packageField, submit, success, successMessage,
    documentElement: document.documentElement, themeHandlers, turnstileRenders, removedWidgets,
    resetWidgets, submitReadyAtAttach,
    get fetchCalls() { return fetchCalls; },
  };
}

async function createGenericSubmitHarness() {
  const source = await readFile(join(projectRoot, "script.js"), "utf8");
  const handlers = {};
  const live = { textContent: "" };
  const summary = { hidden: true, focus() {} };
  const list = { replaceChildren() {}, append() {} };
  let fetchCalls = 0;
  let nativeSubmitCalls = 0;
  const form = {
    action: "/api/enquiry",
    dataset: { externalSubmit: "true" },
    querySelector(selector) {
      return {
        "[data-error-summary]": summary,
        "[data-error-list]": list,
        "[data-live]": live,
      }[selector] ?? null;
    },
    querySelectorAll() { return []; },
    addEventListener(name, handler) { handlers[name] = handler; },
    submit() { nativeSubmitCalls += 1; },
  };
  const document = {
    body: { prepend() {} },
    documentElement: { scrollHeight: 1000 },
    querySelector(selector) { return selector === "[data-form]" ? form : null; },
    querySelectorAll() { return []; },
    getElementById() { return null; },
    createElement() {
      return { setAttribute() {}, style: { setProperty() {} } };
    },
    addEventListener() {},
  };
  const location = {
    search: "",
    href: "https://nearly.example/contact",
    origin: "https://nearly.example",
  };
  const fetch = () => { fetchCalls += 1; };
  const window = {
    location,
    matchMedia() { return { matches: true }; },
    addEventListener() {},
    fetch,
  };

  runInNewContext(source, {
    document,
    window,
    location,
    URLSearchParams,
    FormData: class {},
    innerHeight: 800,
    scrollY: 0,
    addEventListener() {},
    fetch,
  });

  return {
    form, handlers, live,
    get fetchCalls() { return fetchCalls; },
    get nativeSubmitCalls() { return nativeSubmitCalls; },
  };
}

testCases.push(["valid enquiry is accepted by mocked providers", async () => {
  let submittedFields;
  const { response, body, calls } = await submitEnquiry(enquiryFields(), {
    onProviderRequest: async (init) => {
      submittedFields = JSON.parse(init.body);
    },
  });

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(submittedFields.package, "not-sure");
  assert.equal(calls.find(({ url }) => url.includes("api.web3forms.com")).init.headers["Content-Type"], "application/json");
  assert.equal(calls.length, 2);
  assert.ok(calls.every(({ url }) => new URL(url).hostname !== "nearly.example"));
}]);

testCases.push(["JSON content type accepts charset parameters", async () => {
  const { response, body } = await submitEnquiry(enquiryFields(), {
    contentType: "application/json; charset=utf-8",
  });
  assert.equal(response.status, 200);
  assert.equal(body.success, true);
}]);

testCases.push(["wrong content type is rejected explicitly", async () => {
  const { response, body, calls } = await submitEnquiry(enquiryFields(), {
    contentType: "application/x-www-form-urlencoded",
  });
  assert.equal(response.status, 415);
  assert.equal(body.code, "invalid_content_type");
  assert.equal(body.success, false);
  assert.equal(calls.length, 0);
}]);

testCases.push(["malformed JSON returns a clear bad-request response", async () => {
  const { response, body, calls } = await submitEnquiry({}, {
    rawBody: '{"name":',
  });
  assert.equal(response.status, 400);
  assert.equal(body.code, "validation_failed");
  assert.match(body.message, /check the form/i);
  assert.equal(calls.length, 0);
}]);

testCases.push(["invalid email is rejected before any provider request", async () => {
  const { response, body, calls } = await submitEnquiry(enquiryFields({ email: "not-an-email" }));
  assert.equal(response.status, 400);
  assert.equal(body.code, "validation_failed");
  assert.equal(body.error.code, "validation_failed");
  assert.match(body.message, /valid email/i);
  assert.equal(calls.length, 0);
}]);

testCases.push(["missing required values are rejected", async () => {
  for (const fields of [
    enquiryFields({ name: "" }),
    enquiryFields({ email: "" }),
    enquiryFields({ details: "   " }),
  ]) {
    const { response, body, calls } = await submitEnquiry(fields);
    assert.equal(response.status, 400);
    assert.equal(body.code, "validation_failed");
    assert.match(body.message, /required/i);
    assert.equal(calls.length, 0);
  }
}]);

testCases.push(["invalid non-empty service selection is rejected", async () => {
  const { response, body, calls } = await submitEnquiry(enquiryFields({ package: "bespoke mystery service" }));
  assert.equal(response.status, 400);
  assert.equal(body.code, "validation_failed");
  assert.match(body.message, /valid service/i);
  assert.equal(calls.length, 0);
}]);

testCases.push(["invalid Turnstile response is rejected without blocking a fresh retry", async () => {
  const fields = enquiryFields();
  const { response, body, calls } = await submitEnquiry(fields, {
    turnstileResult: { success: false },
  });
  assert.equal(response.status, 403);
  assert.equal(body.code, "verification_failed");
  assert.equal(body.success, false);
  assert.equal(calls.length, 1);

  const retry = await submitEnquiry(fields);
  assert.equal(retry.response.status, 200);
  assert.equal(retry.body.success, true);
}]);

testCases.push(["duplicate enquiry is rejected without a second provider call", async () => {
  const fields = enquiryFields();
  const first = await submitEnquiry(fields);
  const second = await submitEnquiry(fields);
  assert.equal(first.response.status, 200);
  assert.equal(first.body.success, true);
  assert.equal(second.response.status, 409);
  assert.equal(second.body.code, "duplicate_submission");
  assert.equal(second.body.success, false);
  assert.equal(second.calls.length, 1);
  assert.ok(second.calls.every(({ url }) => new URL(url).hostname !== "api.web3forms.com"));
}]);

testCases.push(["Web3Forms failure is returned as a server error", async () => {
  const fields = enquiryFields();
  const { response, body } = await submitEnquiry(fields, {
    providerResult: { success: false, message: "mock provider rejection" },
    providerStatus: 500,
  });
  assert.equal(response.status, 502);
  assert.equal(body.success, false);
  assert.equal(body.code, "provider_failed");
  assert.ok(body.error.message);

  const retry = await submitEnquiry(fields);
  assert.equal(retry.response.status, 200);
}]);

testCases.push(["successful mocked provider submission returns success", async () => {
  const { response, body } = await submitEnquiry(enquiryFields({
    package: "starter-website",
  }));
  assert.equal(response.status, 200);
  assert.deepEqual(body, { success: true });
}]);

testCases.push(["optional Google Sheets failure does not hide accepted email submission", async () => {
  const { response, body, calls } = await submitEnquiry(enquiryFields(), {
    env: {
      GOOGLE_SHEETS_WEBHOOK_URL: "https://script.google.com/macros/s/mock/exec",
      GOOGLE_SHEETS_WEBHOOK_TOKEN: "mock-only-sheets-token",
    },
    sheetResult: { success: false, recorded: false },
    sheetStatus: 503,
  });
  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.match(body.warning, /couldn't confirm.*lead tracker/i);
  assert.equal(calls.length, 3);
}]);

testCases.push(["missing provider configuration is identified explicitly", async () => {
  const { response, body } = await submitEnquiry(enquiryFields(), {
    env: { TURNSTILE_SECRET_KEY: "" },
  });
  assert.equal(response.status, 503);
  assert.equal(body.code, "configuration_missing");
  assert.equal(body.error.code, "configuration_missing");
  assert.equal(body.success, false);
}]);

testCases.push(["route configuration includes every Function and leaves static assets outside Functions", async () => {
  const config = JSON.parse(await readFile(join(projectRoot, "_routes.json"), "utf8"));
  const apiDirectory = join(projectRoot, "functions/api");
  const files = await readdir(apiDirectory);
  const routeFiles = [];
  for (const file of files.filter((name) => name.endsWith(".js"))) {
    const source = await readFile(join(apiDirectory, file), "utf8");
    if (/export\s+(?:async\s+)?function\s+onRequest(?:Get|Post)?\b|export\s+const\s+onRequest\b/.test(source)) {
      routeFiles.push(`/api/${file.slice(0, -3)}`);
    }
  }

  const matches = (pattern, path) => path.startsWith(pattern.endsWith("*") ? pattern.slice(0, -1) : pattern);
  assert.ok(routeFiles.length > 0);
  for (const route of routeFiles) {
    assert.ok(config.include.some((pattern) => matches(pattern, route)), `${route} is excluded from Pages Functions`);
    assert.ok(!config.exclude.some((pattern) => matches(pattern, route)), `${route} is explicitly excluded`);
  }
  for (const asset of ["/contact.html", "/contact-form.js", "/styles.css", "/images/brand.svg"]) {
    assert.ok(!config.include.some((pattern) => matches(pattern, asset)), `${asset} should remain static`);
  }
}]);

testCases.push(["protected client and admin APIs fail closed without credentials", async () => {
  const clientResponse = await handleClientProjects({
    request: new Request("https://nearly.example/api/client-projects"),
    env: {},
  });
  const dashboardResponse = await handleLeadSummary({
    request: new Request("https://nearly.example/api/leads-summary"),
    env: {},
  });
  const adminResponse = await handleCreateClient({
    request: new Request("https://nearly.example/api/create-client", { method: "POST" }),
    env: {},
  });
  assert.equal(clientResponse.status, 401);
  assert.equal(dashboardResponse.status, 503);
  assert.equal(adminResponse.status, 401);
}]);

testCases.push(["browser handler prevents overlapping submissions", async () => {
  let resolveResponse;
  const harness = await createContactFormHarness({
    fetch: () => new Promise((resolve) => { resolveResponse = resolve; }),
  });
  let prevented = 0;
  const firstSubmission = harness.handlers.submit({ preventDefault() { prevented += 1; } });
  assert.equal(harness.submit.disabled, true);
  assert.equal(harness.live.textContent, "Sending your enquiry…");

  await harness.handlers.submit({ preventDefault() { prevented += 1; } });
  assert.equal(harness.fetchCalls, 1);
  assert.equal(prevented, 2);

  resolveResponse({
    ok: true,
    async json() { return { success: true }; },
  });
  await firstSubmission;
  assert.equal(harness.success.hidden, false);
  assert.match(harness.live.textContent, /received/i);
  assert.equal(harness.submit.disabled, false);
  assert.deepEqual(harness.resetWidgets, ["widget-1"]);
}]);

testCases.push(["browser sends a JSON enquiry with the form fields and Turnstile token", async () => {
  let submittedRequest;
  const formEntries = {
    name: "Test",
    email: "test@example.test",
    phone: "78 394 0421",
    business: "Example business",
    package: "business-website",
    details: "I would like to discuss a new website.",
    source: "website",
    country_code: "+27",
    _honey: "",
    "cf-turnstile-response": "mock-turnstile-token",
  };
  const harness = await createContactFormHarness({
    formEntries,
    fetch: async (url, init) => {
      submittedRequest = { url, init };
      return {
        ok: true,
        async json() { return { success: true }; },
      };
    },
  });

  assert.equal(harness.submitReadyAtAttach, undefined);
  assert.equal(harness.form.dataset.externalSubmitReady, "true");
  await harness.handlers.submit({ preventDefault() {} });

  assert.equal(submittedRequest.url, "/api/enquiry");
  assert.equal(submittedRequest.init.method, "POST");
  assert.equal(submittedRequest.init.headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(submittedRequest.init.body), formEntries);
  assert.equal(harness.success.hidden, false);
}]);

testCases.push(["generic handler blocks native submission if the dedicated handler is unavailable", async () => {
  const harness = await createGenericSubmitHarness();
  let prevented = false;

  await harness.handlers.submit({
    preventDefault() { prevented = true; },
  });

  assert.equal(prevented, true);
  assert.match(harness.live.textContent, /form could not load.*refresh.*email/i);
  assert.match(harness.live.textContent, /madebynearly@gmail\.com/);
  assert.equal(harness.fetchCalls, 0);
  assert.equal(harness.nativeSubmitCalls, 0);
}]);

testCases.push(["browser handler reports validation and missing-configuration feedback", async () => {
  const invalidForm = await createContactFormHarness({ packageValue: "invalid-service", fetch: async () => assert.fail("Invalid service must not be sent") });
  await invalidForm.handlers.submit({ preventDefault() {} });
  assert.match(invalidForm.live.textContent, /valid service/i);
  assert.equal(invalidForm.fetchCalls, 0);

  const requiredForm = await createContactFormHarness({ valid: false, fetch: async () => assert.fail("Invalid form must not be sent") });
  requiredForm.handlers.invalid({ target: { validationMessage: "Please enter a valid email address." } });
  assert.equal(requiredForm.live.textContent, "Please enter a valid email address.");
  await requiredForm.handlers.submit({ preventDefault() {} });
  assert.match(requiredForm.live.textContent, /correct the highlighted fields/i);

  const missingConfigForm = await createContactFormHarness({
    fetch: async () => ({
      ok: false,
      async json() {
        return {
          success: false,
          code: "configuration_missing",
          message: "The enquiry form is temporarily unavailable.",
          error: { code: "configuration_missing", message: "The enquiry form is temporarily unavailable." },
        };
      },
    }),
  });
  await missingConfigForm.handlers.submit({ preventDefault() {} });
  assert.match(missingConfigForm.live.textContent, /not configured yet/i);
  assert.match(missingConfigForm.live.textContent, /madebynearly@gmail\.com/);

  const serverErrorForm = await createContactFormHarness({
    fetch: async () => ({
      ok: false,
      async json() {
        return {
          success: false,
          code: "provider_failed",
          message: "We couldn't send your enquiry just now.",
          error: { code: "provider_failed", message: "We couldn't send your enquiry just now." },
        };
      },
    }),
  });
  await serverErrorForm.handlers.submit({ preventDefault() {} });
  assert.equal(serverErrorForm.live.textContent, "We couldn't send your enquiry just now.");
}]);

testCases.push(["Turnstile widget tracks the selected theme and resets on theme changes", async () => {
  const harness = await createContactFormHarness({ fetch: async () => mockResponse({ success: true }) });
  assert.equal(harness.turnstileRenders[0].config.theme, "light");

  harness.documentElement.dataset.theme = "dark";
  harness.themeHandlers["nearly:themechange"]({ detail: { theme: "dark" } });

  assert.deepEqual(harness.removedWidgets, ["widget-1"]);
  assert.equal(harness.turnstileRenders[1].config.theme, "dark");
}]);

testCases.push(["contact page loads the cache-busted JSON form handler", async () => {
  const markup = await readFile(join(projectRoot, "contact.html"), "utf8");
  assert.match(markup, /<script src="contact-form\.js\?v=4" defer><\/script>/);
  assert.match(markup, /<script src="script\.js\?v=5" defer><\/script>/);
}]);

test("enquiry flow", async (t) => {
  for (const [name, run] of testCases) await t.test(name, run);
});
