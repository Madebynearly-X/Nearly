(() => {
  "use strict";

  const demos = [...document.querySelectorAll("[data-demo]")];
  const catalog = document.querySelector("[data-demo-catalog]");
  const live = document.querySelector("[data-demo-live]");
  if (!demos.length) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let current = null;
  let opener = null;

  const announce = (message) => {
    if (!live) return;
    live.textContent = "";
    window.setTimeout(() => {
      live.textContent = message;
    }, 30);
  };

  const route = (moveFocus = false) => {
    let target = null;
    try {
      target = window.location.hash
        ? document.getElementById(decodeURIComponent(window.location.hash.slice(1)))
        : null;
    } catch (error) {
      target = null;
    }

    const active = target?.closest("[data-demo]") || null;
    const changed = active !== current;
    demos.forEach((demo) => {
      demo.hidden = active ? demo !== active : true;
    });
    if (active) {
      active.querySelectorAll('img[loading="lazy"]').forEach((image) => {
        image.loading = "eager";
      });
    }
    if (catalog) catalog.hidden = Boolean(active);
    current = active;

    if (target) {
      target.scrollIntoView({
        behavior: reducedMotion.matches ? "auto" : "smooth",
        block: "start",
      });
    }

    if (!moveFocus) return;

    if (active && target === active) {
      const heading = active.querySelector("h2");
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
    } else if (!active && changed && opener?.isConnected) {
      opener.focus();
    }

    if (changed) {
      const heading = active?.querySelector("h2");
      announce(active
        ? `Showing ${heading?.innerText.replace(/\s+/g, " ").trim().replace(/[.!?]+$/, "") || "website demo"}.`
        : "Showing all website concepts.");
    }
  };

  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#demo-"], a[href="#all-demos"]');
    if (!link) return;

    if (link.matches('a[href^="#demo-"]')) opener = link;
    if (link.getAttribute("href") === window.location.hash) route(true);
  });

  window.addEventListener("hashchange", () => route(true));
  route();
})();
