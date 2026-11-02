import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

const themeScript = await readFile(new URL("../theme.js", import.meta.url), "utf8");
const themeStyles = await readFile(new URL("../theme.css", import.meta.url), "utf8");

function createBrowser({ prefersDark = false, storage = new Map() } = {}) {
  const documentEvents = new Map();
  const mediaEvents = new Map();
  const buttonEvents = new Map();
  const buttonAttributes = new Map();
  const root = {
    dataset: {},
    classes: new Set(),
    classList: {
      toggle(name, enabled) {
        if (enabled) root.classes.add(name);
        else root.classes.delete(name);
      },
      remove(name) {
        root.classes.delete(name);
      },
    },
  };
  const meta = { content: "#f5f5f7" };
  const button = {
    setAttribute(name, value) {
      buttonAttributes.set(name, value);
    },
    replaceChildren(icon) {
      this.icon = icon;
    },
    addEventListener(name, handler) {
      buttonEvents.set(name, handler);
    },
  };
  const contactLink = {};
  const nav = {
    insertedBefore: null,
    querySelector(selector) {
      return selector === ".button" ? contactLink : null;
    },
    insertBefore(element, reference) {
      this.insertedBefore = { element, reference };
    },
  };
  const document = {
    documentElement: root,
    querySelector(selector) {
      if (selector === 'meta[name="theme-color"]') return meta;
      return selector === "[data-nav]" ? nav : null;
    },
    addEventListener(name, handler) {
      documentEvents.set(name, handler);
    },
    createElement() {
      return button;
    },
    createElementNS(namespace, name) {
      return {
        name,
        attributes: new Map(),
        setAttribute(attribute, value) {
          this.attributes.set(attribute, value);
        },
        append() {},
      };
    },
  };
  const media = {
    matches: prefersDark,
    addEventListener(name, handler) {
      mediaEvents.set(name, handler);
    },
  };
  const warnings = [];
  const window = {
    localStorage: {
      getItem(key) {
        return storage.get(key) ?? null;
      },
      setItem(key, value) {
        storage.set(key, value);
      },
    },
    matchMedia() {
      return media;
    },
    dispatchEvent() {},
    setTimeout() {},
  };
  runInNewContext(themeScript, {
    window,
    document,
    CustomEvent: class {
      constructor(name, options) {
        this.type = name;
        this.detail = options.detail;
      }
    },
    console: { warn: (...args) => warnings.push(args) },
  });
  documentEvents.get("DOMContentLoaded")();

  return {
    button,
    buttonAttributes,
    buttonEvents,
    mediaEvents,
    meta,
    nav,
    root,
    storage,
    warnings,
  };
}

test("theme follows the system preference until a visitor chooses a theme", () => {
  const browser = createBrowser({ prefersDark: true });

  assert.equal(browser.root.dataset.theme, "dark");
  assert.equal(browser.meta.content, "#0B0D12");
  assert.equal(browser.buttonAttributes.get("aria-label"), "Switch to light mode");

  browser.mediaEvents.get("change")({ matches: false });

  assert.equal(browser.root.dataset.theme, "light");
  assert.equal(browser.meta.content, "#f5f5f7");
});

test("a manual theme choice persists and is restored on the next page load", () => {
  const storage = new Map([["nearly-theme", "dark"]]);
  const firstVisit = createBrowser({ storage });

  assert.equal(firstVisit.root.dataset.theme, "dark");
  firstVisit.buttonEvents.get("click")();

  assert.equal(firstVisit.root.dataset.theme, "light");
  assert.equal(storage.get("nearly-theme"), "light");
  assert.equal(firstVisit.buttonAttributes.get("aria-label"), "Switch to dark mode");

  const nextVisit = createBrowser({ prefersDark: true, storage });
  assert.equal(nextVisit.root.dataset.theme, "light");
  assert.equal(nextVisit.buttonAttributes.get("aria-pressed"), "false");
});

test("a manual choice overrides later operating-system changes", () => {
  const browser = createBrowser();
  browser.buttonEvents.get("click")();
  browser.mediaEvents.get("change")({ matches: false });

  assert.equal(browser.root.dataset.theme, "dark");
  assert.equal(browser.storage.get("nearly-theme"), "dark");
});

test("public site pages load the early theme script and shared theme stylesheet", async () => {
  const pages = [
    "index.html",
    "landing-pages.html",
    "business-websites.html",
    "digital-presence.html",
    "website-care.html",
    "pricing.html",
    "process.html",
    "concept-demos.html",
    "contact.html",
    "thanks.html",
    "privacy.html",
    "client-login.html",
    "client-portal.html",
    "404.html",
  ];

  for (const page of pages) {
    const markup = await readFile(new URL(`../${page}`, import.meta.url), "utf8");
    assert.match(markup, /<script src="\/theme\.js\?v=1"><\/script>/, page);
    assert.match(markup, /<link rel="stylesheet" href="\/theme\.css\?v=1">/, page);
    assert.ok(
      markup.indexOf('<meta name="theme-color"') < markup.indexOf('<script src="/theme.js?v=1">')
        && markup.indexOf('<script src="/theme.js?v=1">') < markup.indexOf('<link rel="stylesheet"'),
      `${page}: theme bootstrap must run after theme metadata and before stylesheets`,
    );
  }

  for (const page of ["index.html", "landing-pages.html", "website-care.html", "pricing.html"]) {
    const markup = await readFile(new URL(`../${page}`, import.meta.url), "utf8");
    assert.match(markup, /<details[\s>]/, page);
    assert.match(markup, /<summary>/, page);
    assert.match(markup, /href="\/theme\.css\?v=1"/, page);
  }

  const operationsDashboard = await readFile(new URL("../dashboard.html", import.meta.url), "utf8");
  assert.doesNotMatch(operationsDashboard, /theme\.(?:js|css)/);
});

test("shared FAQ indicators use native details state and reduced-motion-safe CSS", () => {
  assert.match(themeStyles, /\.faq details > summary::after/);
  assert.match(themeStyles, /\.faq details\[open\] > summary::after/);
  assert.match(themeStyles, /\.faq details\[open\] > summary::after\s*\{[^}]*content:\s*""/);
  assert.match(themeStyles, /@media \(max-width: 760px\)/);
  assert.match(themeStyles, /@media \(prefers-reduced-motion: reduce\)/);
});
