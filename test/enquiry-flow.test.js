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

function createMockElement(tagName, operations = []) {
  const listeners = {};
  const classes = new Set();
  const element = {
    tagName,
    children: [],
    dataset: {},
    attributes: {},
    style: { setProperty() {}, removeProperty() {} },
    hidden: false,
    textContent: "",
    value: "",
    className: "",
    parentNode: null,
    classList: {
      add(name) {
        if (element.throwOnClassAdd) throw new Error("Mock optional UI failure.");
        classes.add(name);
      },
      contains(name) { return classes.has(name); },
    },
    setAttribute(name, value) {
      this.attributes[name] = String(value);
      if (name === "autocomplete") this.autocomplete = String(value);
    },
    append(...nodes) {
      for (const node of nodes) {
        if (node.parentNode?.children) {
          const previousIndex = node.parentNode.children.indexOf(node);
          if (previousIndex >= 0) node.parentNode.children.splice(previousIndex, 1);
        }
        node.parentNode = this;
        this.children.push(node);
      }
    },
    replaceChildren(...nodes) {
      this.children.forEach((child) => { child.parentNode = null; });
      this.children = [];
      this.append(...nodes);
    },
    insertBefore(node, reference) {
      const index = this.children.indexOf(reference);
      node.parentNode = this;
      this.children.splice(index < 0 ? this.children.length : index, 0, node);
    },
    addEventListener(name, handler) {
      listeners[name] = handler;
    },
    dispatch(name, event = {}) {
      return listeners[name]?.(event);
    },
    querySelectorAll(selector) {
      const matches = [];
      const visit = (node) => {
        for (const child of node.children || []) {
          if (selector === '[role="option"]' && child.attributes?.role === "option") matches.push(child);
          visit(child);
        }
      };
      visit(this);
      return matches;
    },
    contains(target) {
      return this === target || this.children.some((child) => child.contains?.(target));
    },
    focus() {},
    closest(selector) {
      return selector === ".field" ? this.parentNode : null;
    },
    throwOnClassAdd: false,
  };
  operations.push(`element:${tagName}`);
  return element;
}

async function createContactFormHarness(options = {}) {
  const source = await readFile(join(projectRoot, "contact-form.js"), "utf8");
  const handlers = {};
  const entries = [];
  const operations = [];
  const logs = [];
  const packageField = { value: options.packageValue || "" };
  const submit = { textContent: "Send enquiry", disabled: false };
  const summary = { hidden: true, focus() {} };
  const list = {
    replaceChildren() { entries.length = 0; },
    append(item) { entries.push(item.textContent); },
  };
  const live = { textContent: "" };
  const turnstileStatus = { hidden: true, textContent: "" };
  const successMessage = { textContent: "" };
  const success = {
    hidden: true,
    querySelector() { return successMessage; },
    focus() {},
  };
  const clickSubmit = (event = { preventDefault() {} }) => {
    if (submit.disabled) return Promise.resolve();
    return handlers.submit(event);
  };
  const phoneField = createMockElement("div", operations);
  const phone = createMockElement("input", operations);
  phone.id = "q-phone";
  phone.name = "phone";
  phone.type = "tel";
  phone.closest = (selector) => selector === ".field" ? phoneField : null;
  phone.parentNode = phoneField;
  phoneField.children.push(phone);
  phoneField.throwOnClassAdd = Boolean(options.phonePickerThrows);
  const turnstileContainer = createMockElement("div", operations);
  turnstileContainer.id = "enquiry-turnstile";
  turnstileContainer.dataset = { sitekey: "mock-site-key", action: "enquiry" };
  const themeHandlers = {};
  const turnstileRenders = [];
  const removedWidgets = [];
  const resetWidgets = [];
  let submitReadyAtAttach;
  const dataset = new Proxy({ externalSubmit: "true" }, {
    set(target, property, value) {
      target[property] = value;
      if (property === "externalSubmitReady" && value === "true") operations.push("submit-ready");
      return true;
    },
  });
  const form = {
    action: "/api/enquiry",
    dataset,
    querySelector(selector) {
      return {
        "#q-phone": phone,
        "#q-package": packageField,
        "#q-source": null,
        "#enquiry-turnstile": turnstileContainer,
        "[data-turnstile-status]": turnstileStatus,
        'button[type="submit"]': submit,
        "[data-error-summary]": summary,
        "[data-error-list]": list,
        "[data-live]": live,
        "[data-form-success]": success,
      }[selector] ?? null;
    },
    addEventListener(name, handler) {
      if (name === "submit") {
        operations.push("submit-listener");
        if (options.submitListenerThrows) throw new Error("Mock listener registration failure.");
        submitReadyAtAttach = this.dataset.externalSubmitReady;
      }
      handlers[name] = handler;
    },
    reportValidity() { return options.valid !== false; },
    reset() {},
  };
  class MockFormData {
    constructor() {
      this.entries = options.formEntries || {
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
    }

    get(name) {
      return Object.hasOwn(this.entries, name) ? this.entries[name] : null;
    }

    [Symbol.iterator]() {
      return Object.entries(this.entries)[Symbol.iterator]();
    }
  }
  const document = {
    documentElement: { dataset: { theme: options.theme || "light" } },
    activeElement: null,
    querySelector() { return form; },
    createElement(tagName) {
      operations.push("dom-create");
      return createMockElement(tagName, operations);
    },
    createTextNode(text) { return { textContent: text, parentNode: null }; },
    addEventListener() {},
  };
  let readyCallback;
  let readyCalls = 0;
  let turnstileWidgetNumber = 0;
  const turnstile = {
    ready(callback) {
      operations.push("turnstile-ready");
      readyCalls += 1;
      if (options.turnstileReadyThrows || options.turnstileReadyThrowsOnCall === readyCalls) {
        throw new Error("Mock API readiness failure.");
      }
      if (options.deferTurnstileReady) readyCallback = callback;
      else callback();
    },
    render(container, config) {
      operations.push("turnstile-render");
      if (options.turnstileRenderThrows) throw new Error("Mock rendering failure.");
      turnstileRenders.push({ container, config });
      turnstileWidgetNumber += 1;
      return `widget-${turnstileWidgetNumber}`;
    },
    remove(widgetId) { removedWidgets.push(widgetId); },
    reset(widgetId) { resetWidgets.push(widgetId); },
  };
  const window = {
    location: { search: options.search || "" },
    addEventListener(name, handler) {
      if (options.themeListenerThrows && name === "nearly:themechange") {
        throw new Error("Mock theme listener failure.");
      }
      themeHandlers[name] = handler;
    },
    ...(options.turnstileUnavailable ? {} : { turnstile }),
  };
  let fetchCalls = 0;
  const fetch = (...args) => {
    fetchCalls += 1;
    return options.fetch(...args);
  };
  const SearchParams = options.prefillThrows
    ? class { constructor() { throw new Error("Mock query parsing failure."); } }
    : URLSearchParams;
  const console = { error(...args) { logs.push(args.join(" ")); } };

  runInNewContext(source, {
    document,
    window,
    URLSearchParams: SearchParams,
    FormData: MockFormData,
    fetch,
    console,
  });

  return {
    form, handlers, entries, live, packageField, submit, success, successMessage, summary, clickSubmit,
    documentElement: document.documentElement, themeHandlers, turnstileRenders, removedWidgets,
    resetWidgets, submitReadyAtAttach, operations, logs, phone, phoneField, turnstileStatus,
    phoneGroup: phone.parentNode,
    countryCode: phone.parentNode.children.find((child) => child.id === "q-country-code"),
    countryPicker: phoneField.children.find((child) => child.className === "phone-entry")?.children[0],
    countryTrigger: phoneField.children.find((child) => child.className === "phone-entry")?.children[0]
      ?.children[0],
    countryOptions: phoneField.children.find((child) => child.className === "phone-entry")?.children[0]
      ?.children[1]?.children[1],
    completeTurnstileReady() { readyCallback?.(); },
    get fetchCalls() { return fetchCalls; },
  };
}

async function createGenericSubmitHarness(options = {}) {
  const source = await readFile(join(projectRoot, "script.js"), "utf8");
  const handlers = {};
  const scriptHandlers = {};
  const logs = [];
  const live = { textContent: "" };
  const summary = { hidden: true, focus() {} };
  const entries = [];
  const list = {
    replaceChildren() { entries.length = 0; },
    append(item) { entries.push(item.textContent); },
  };
  let fetchCalls = 0;
  let nativeSubmitCalls = 0;
  const form = {
    action: "/api/enquiry",
    dataset: {
      externalSubmit: "true",
      ...(options.ready ? { externalSubmitReady: "true" } : {}),
      ...(options.ready ? { externalSubmitState: "ready" } : {}),
    },
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
    querySelector(selector) {
      if (selector === "[data-form]") return form;
      if (selector === 'script[src*="contact-form.js"]' && options.hasDedicatedScript !== false) {
        return {
          addEventListener(name, handler) { scriptHandlers[name] = handler; },
        };
      }
      return null;
    },
    querySelectorAll() { return []; },
    getElementById() { return null; },
    createElement() {
      return { textContent: "", setAttribute() {}, style: { setProperty() {} } };
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
  const console = { error(...args) { logs.push(args.join(" ")); } };

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
    console,
  });

  return {
    form, handlers, live, summary, entries, scriptHandlers, logs,
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
  const firstSubmission = harness.clickSubmit({ preventDefault() { prevented += 1; } });
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

testCases.push(["core handler becomes ready before actual phone picker and Turnstile initialization", async () => {
  const harness = await createContactFormHarness({
    fetch: async () => mockResponse({ success: true }),
  });
  const submitListenerIndex = harness.operations.indexOf("submit-listener");
  assert.deepEqual(harness.operations.slice(submitListenerIndex, submitListenerIndex + 2), [
    "submit-listener",
    "submit-ready",
  ]);
  assert.ok(harness.operations.indexOf("dom-create") > submitListenerIndex);
  assert.ok(harness.operations.indexOf("turnstile-ready") > submitListenerIndex);
  assert.equal(harness.form.dataset.externalSubmitReady, "true");
}]);

testCases.push(["failed core handler registration is explicitly reported", async () => {
  const harness = await createContactFormHarness({
    submitListenerThrows: true,
    fetch: async () => assert.fail("A failed handler registration cannot submit"),
  });
  assert.notEqual(harness.form.dataset.externalSubmitReady, "true");
  assert.equal(harness.form.dataset.externalSubmitState, "failed");
  assert.ok(harness.logs.some((message) => message.startsWith("[NEARLY Enquiry] Core submit handler registration failed.")));
}]);

testCases.push(["phone picker initializes its country options and updates the calling code", async () => {
  const harness = await createContactFormHarness({
    fetch: async () => mockResponse({ success: true }),
  });
  assert.equal(harness.phone.autocomplete, "tel-national");
  assert.equal(harness.countryCode.value, "+27");
  assert.ok(harness.countryOptions.children.length > 200);

  const canada = harness.countryOptions.children.find((option) => option.dataset.country === "canada");
  assert.ok(canada);
  canada.dispatch("click");
  assert.equal(harness.countryCode.value, "+1");
  assert.equal(harness.countryTrigger.attributes["aria-label"], "Canada, +1");
}]);

testCases.push(["phone picker exceptions do not block the core submit handler", async () => {
  const harness = await createContactFormHarness({
    phonePickerThrows: true,
    fetch: async () => mockResponse({ success: true }),
  });
  assert.equal(harness.form.dataset.externalSubmitReady, "true");
  assert.ok(harness.logs.some((message) => message.startsWith("[NEARLY Enquiry] Country calling-code picker initialization failed.")));
  assert.ok(harness.logs.every((message) => !message.includes("test@example.test")));
  await harness.clickSubmit();
  assert.equal(harness.fetchCalls, 1);
  assert.equal(harness.success.hidden, false);
}]);

testCases.push(["query-string prefill exceptions are isolated from core submission", async () => {
  const harness = await createContactFormHarness({
    prefillThrows: true,
    fetch: async () => mockResponse({ success: true }),
  });
  assert.equal(harness.form.dataset.externalSubmitReady, "true");
  assert.ok(harness.logs.some((message) => message.startsWith("[NEARLY Enquiry] Query-string form prefilling failed.")));
  await harness.clickSubmit();
  assert.equal(harness.fetchCalls, 1);
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
  await harness.clickSubmit();

  assert.equal(submittedRequest.url, "/api/enquiry");
  assert.equal(submittedRequest.init.method, "POST");
  assert.equal(submittedRequest.init.headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(submittedRequest.init.body), formEntries);
  assert.equal(harness.success.hidden, false);
}]);

testCases.push(["Turnstile API unavailability blocks submission and shows visible feedback", async () => {
  const harness = await createContactFormHarness({
    turnstileUnavailable: true,
    fetch: async () => assert.fail("Unavailable Turnstile must block submission"),
  });
  assert.equal(harness.form.dataset.externalSubmitReady, "true");
  assert.equal(harness.turnstileStatus.hidden, false);
  assert.match(harness.turnstileStatus.textContent, /security check couldn't load.*email/i);
  await harness.clickSubmit();
  assert.equal(harness.fetchCalls, 0);
  assert.match(harness.entries.join(" "), /security check couldn't load/i);
}]);

testCases.push(["Turnstile ready failure leaves the core handler active and blocks submission", async () => {
  const harness = await createContactFormHarness({
    turnstileReadyThrows: true,
    fetch: async () => assert.fail("Failed Turnstile readiness must block submission"),
  });
  assert.equal(harness.form.dataset.externalSubmitReady, "true");
  assert.equal(harness.turnstileStatus.hidden, false);
  assert.match(harness.turnstileStatus.textContent, /security check couldn't load/i);
  assert.ok(harness.logs.some((message) => message.startsWith("[NEARLY Enquiry] Turnstile API readiness failed.")));
  await harness.clickSubmit();
  assert.equal(harness.fetchCalls, 0);
}]);

testCases.push(["Turnstile render failure leaves the core handler active and blocks submission", async () => {
  const harness = await createContactFormHarness({
    turnstileRenderThrows: true,
    fetch: async () => assert.fail("Failed Turnstile rendering must block submission"),
  });
  assert.equal(harness.form.dataset.externalSubmitReady, "true");
  assert.equal(harness.turnstileStatus.hidden, false);
  assert.match(harness.turnstileStatus.textContent, /security check couldn't load/i);
  assert.ok(harness.logs.some((message) => message.startsWith("[NEARLY Enquiry] Turnstile widget rendering failed.")));
  await harness.clickSubmit();
  assert.equal(harness.fetchCalls, 0);
}]);

testCases.push(["Turnstile loading state blocks submission until a widget is ready", async () => {
  const harness = await createContactFormHarness({
    deferTurnstileReady: true,
    fetch: async () => mockResponse({ success: true }),
  });
  assert.equal(harness.turnstileStatus.hidden, false);
  assert.match(harness.turnstileStatus.textContent, /loading the security check/i);
  await harness.clickSubmit();
  assert.equal(harness.fetchCalls, 0);
  assert.match(harness.entries.join(" "), /security check is still loading/i);

  harness.completeTurnstileReady();
  assert.equal(harness.turnstileStatus.hidden, true);
  await harness.clickSubmit();
  assert.equal(harness.fetchCalls, 1);
}]);

testCases.push(["theme update failures stay isolated and block submissions after widget failure", async () => {
  const harness = await createContactFormHarness({
    turnstileReadyThrowsOnCall: 2,
    fetch: async () => assert.fail("A failed theme update must block submission"),
  });
  assert.equal(harness.turnstileStatus.hidden, true);

  harness.documentElement.dataset.theme = "dark";
  harness.themeHandlers["nearly:themechange"]();
  assert.equal(harness.turnstileStatus.hidden, false);
  assert.match(harness.turnstileStatus.textContent, /security check couldn't load/i);
  assert.ok(harness.logs.some((message) => message.startsWith("[NEARLY Enquiry] Turnstile API readiness failed.")));
  await harness.clickSubmit();
  assert.equal(harness.fetchCalls, 0);

  const listenerFailure = await createContactFormHarness({
    themeListenerThrows: true,
    fetch: async () => mockResponse({ success: true }),
  });
  assert.equal(listenerFailure.form.dataset.externalSubmitReady, "true");
  assert.equal(listenerFailure.turnstileStatus.hidden, true);
  assert.ok(listenerFailure.logs.some((message) => message.startsWith("[NEARLY Enquiry] Turnstile theme update listener failed.")));
  await listenerFailure.clickSubmit();
  assert.equal(listenerFailure.fetchCalls, 1);
}]);

testCases.push(["submit button click reaches the dedicated form handler", async () => {
  const markup = await readFile(join(projectRoot, "contact.html"), "utf8");
  assert.match(markup, /<button class="button form-submit" type="submit">Send enquiry<\/button>/);

  const harness = await createContactFormHarness({
    fetch: async () => ({
      ok: true,
      async json() { return { success: true }; },
    }),
  });
  await harness.clickSubmit();

  assert.equal(harness.fetchCalls, 1);
  assert.equal(harness.success.hidden, false);
}]);

testCases.push(["generic handler distinguishes loading from genuine dedicated-handler failure", async () => {
  const harness = await createGenericSubmitHarness();
  let prevented = false;

  await harness.handlers.submit({
    preventDefault() { prevented = true; },
  });

  assert.equal(prevented, true);
  assert.equal(harness.form.dataset.externalSubmitState, "loading");
  assert.match(harness.live.textContent, /form is still loading/i);
  assert.equal(harness.fetchCalls, 0);
  assert.equal(harness.nativeSubmitCalls, 0);

  harness.scriptHandlers.error();
  assert.equal(harness.form.dataset.externalSubmitState, "failed");
  await harness.handlers.submit({ preventDefault() {} });
  assert.match(harness.live.textContent, /form could not load.*refresh.*email/i);
  assert.match(harness.live.textContent, /madebynearly@gmail\.com/);
  assert.equal(harness.summary.hidden, false);
  assert.match(harness.entries.join(" "), /form could not load.*refresh.*email/i);
  assert.equal(harness.fetchCalls, 0);
  assert.equal(harness.nativeSubmitCalls, 0);
}]);

testCases.push(["generic handler marks a loaded script without a ready handler as failed", async () => {
  const harness = await createGenericSubmitHarness();
  harness.scriptHandlers.load();
  assert.equal(harness.form.dataset.externalSubmitState, "failed");
  assert.ok(harness.logs.some((message) => message.startsWith("[NEARLY Enquiry] Dedicated form handler did not initialize.")));
}]);

testCases.push(["generic handler allows the registered dedicated submit handler to run", async () => {
  const generic = await createGenericSubmitHarness({ ready: true });
  const dedicated = await createContactFormHarness({
    fetch: async () => ({
      ok: true,
      async json() { return { success: true }; },
    }),
  });
  let prevented = 0;
  const event = { preventDefault() { prevented += 1; } };

  await generic.handlers.submit(event);
  await dedicated.handlers.submit(event);

  assert.equal(generic.form.dataset.externalSubmitReady, "true");
  assert.equal(prevented, 1);
  assert.equal(generic.fetchCalls, 0);
  assert.equal(dedicated.fetchCalls, 1);
  assert.equal(dedicated.success.hidden, false);
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

testCases.push(["browser reports missing or expired Turnstile tokens visibly", async () => {
  const missingToken = await createContactFormHarness({
    formEntries: {
      name: "Test",
      email: "test@example.test",
      phone: "",
      business: "",
      package: "",
      details: "I would like to discuss a new website.",
      source: "website",
      country_code: "+27",
      _honey: "",
    },
    fetch: async () => assert.fail("A missing Turnstile token must not be sent"),
  });
  await missingToken.clickSubmit();
  assert.equal(missingToken.fetchCalls, 0);
  assert.match(missingToken.entries.join(" "), /complete the security check/i);
  assert.equal(missingToken.summary.hidden, false);
  assert.equal(missingToken.submit.disabled, false);

  const expiredToken = await createContactFormHarness({
    fetch: async () => ({
      ok: false,
      async json() {
        return {
          success: false,
          code: "verification_failed",
          message: "The security check failed or expired. Please retry it and submit again.",
        };
      },
    }),
  });
  await expiredToken.clickSubmit();
  assert.equal(expiredToken.fetchCalls, 1);
  assert.match(expiredToken.entries.join(" "), /security check failed or expired/i);
  assert.equal(expiredToken.summary.hidden, false);
  assert.equal(expiredToken.submit.disabled, false);
  assert.deepEqual(expiredToken.resetWidgets, ["widget-1"]);
}]);

testCases.push(["submit button is restored after a failed request", async () => {
  const harness = await createContactFormHarness({
    fetch: async () => { throw new Error("Network unavailable."); },
  });
  await harness.clickSubmit();

  assert.equal(harness.submit.disabled, false);
  assert.equal(harness.submit.textContent, "Send enquiry");
  assert.equal(harness.summary.hidden, false);
  assert.match(harness.live.textContent, /couldn't confirm your enquiry was sent/i);
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
  assert.match(markup, /<link rel="stylesheet" href="styles\.css\?v=5">/);
  assert.match(markup, /<script src="contact-form\.js\?v=6" defer><\/script>/);
  assert.match(markup, /<script src="script\.js\?v=7" defer><\/script>/);
  assert.ok(markup.indexOf("script.js?v=7") < markup.indexOf("challenges.cloudflare.com"));
  assert.ok(markup.indexOf("challenges.cloudflare.com") < markup.indexOf("contact-form.js?v=6"));
  assert.match(markup, /<p class="field__error" data-turnstile-status role="status" aria-live="polite" hidden><\/p>/);
  assert.match(markup, /<div class="cf-turnstile"[^>]+id="enquiry-turnstile"/);
}]);

testCases.push(["all active pages use the current immutable styles and script assets", async () => {
  const htmlFiles = (await readdir(projectRoot)).filter((file) => file.endsWith(".html"));
  const pages = await Promise.all(htmlFiles.map((file) => readFile(join(projectRoot, file), "utf8")));
  const markup = pages.join("\n");
  assert.doesNotMatch(markup, /styles\.css\?v=4/);
  assert.doesNotMatch(markup, /script\.js\?v=(?:[0-6])(?:["&])/);
  assert.doesNotMatch(markup, /contact-form\.js\?v=(?:[0-5])(?:["&])/);
  assert.match(markup, /styles\.css\?v=5/);
  assert.match(markup, /script\.js\?v=7/);
  assert.match(markup, /contact-form\.js\?v=6/);
  for (const page of htmlFiles) {
    const pageMarkup = await readFile(join(projectRoot, page), "utf8");
    for (const match of pageMarkup.matchAll(/(?:\/?)script\.js\?v=(\d+)/g)) {
      assert.equal(match[1], "7", `${page} uses an outdated script.js version`);
    }
    for (const match of pageMarkup.matchAll(/(?:\/?)contact-form\.js\?v=(\d+)/g)) {
      assert.equal(match[1], "6", `${page} uses an outdated contact-form.js version`);
    }
  }
}]);

testCases.push(["enabled and disabled button cursors are distinguishable", async () => {
  const styles = await readFile(join(projectRoot, "styles.css"), "utf8");
  assert.match(styles, /\.button\s*\{[^}]*cursor:\s*pointer[^}]*pointer-events:\s*auto/);
  assert.match(styles, /\.button:disabled\s*\{[^}]*cursor:\s*not-allowed[^}]*opacity:/);
  assert.match(styles, /\.button:before\s*\{[^}]*pointer-events:none/);
}]);

test("enquiry flow", async (t) => {
  for (const [name, run] of testCases) await t.test(name, run);
});
