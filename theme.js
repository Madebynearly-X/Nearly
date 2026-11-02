(() => {
  "use strict";

  const storageKey = "nearly-theme";
  const root = document.documentElement;
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  let storedTheme = null;
  let currentTheme = "light";
  let toggle;
  let storageAvailable = true;

  try {
    const preference = window.localStorage.getItem(storageKey);
    if (preference === "light" || preference === "dark") storedTheme = preference;
  } catch (error) {
    storageAvailable = false;
    console.warn("Theme preference storage is unavailable; using the system preference.", error);
  }

  function drawIcon(theme) {
    if (!toggle) return;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.8");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");

    if (theme === "dark") {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", "12");
      circle.setAttribute("cy", "12");
      circle.setAttribute("r", "4");
      svg.append(circle);
      const rays = document.createElementNS("http://www.w3.org/2000/svg", "path");
      rays.setAttribute("d", "M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42");
      svg.append(rays);
    } else {
      const crescent = document.createElementNS("http://www.w3.org/2000/svg", "path");
      crescent.setAttribute("d", "M20.1 15.4A8.4 8.4 0 0 1 8.6 3.9 8.5 8.5 0 1 0 20.1 15.4Z");
      svg.append(crescent);
    }

    toggle.replaceChildren(svg);
    const targetTheme = theme === "dark" ? "light" : "dark";
    toggle.setAttribute("aria-label", `Switch to ${targetTheme} mode`);
    toggle.setAttribute("title", storageAvailable
      ? `Switch to ${targetTheme} mode`
      : `Switch to ${targetTheme} mode; this browser cannot save the preference`);
    toggle.setAttribute("aria-pressed", String(theme === "dark"));
  }

  function applyTheme(theme, savePreference = false) {
    currentTheme = theme;
    root.dataset.theme = theme;
    root.classList.toggle("theme-switching", savePreference);
    if (themeColor) themeColor.content = theme === "dark" ? "#0B0D12" : "#f5f5f7";
    drawIcon(theme);
    window.dispatchEvent(new CustomEvent("nearly:themechange", { detail: { theme } }));

    if (savePreference) {
      storedTheme = theme;
      try {
        window.localStorage.setItem(storageKey, theme);
      } catch (error) {
        storageAvailable = false;
        console.warn("Theme changed for this visit but could not be saved.", error);
        if (toggle) {
          toggle.setAttribute("title", `Theme changed to ${theme}, but this browser could not save the preference`);
        }
      }
      window.setTimeout(() => root.classList.remove("theme-switching"), 250);
    }
  }

  applyTheme(storedTheme || (systemTheme.matches ? "dark" : "light"));

  systemTheme.addEventListener("change", (event) => {
    if (!storedTheme) applyTheme(event.matches ? "dark" : "light");
  });

  document.addEventListener("DOMContentLoaded", () => {
    const nav = document.querySelector("[data-nav]");
    if (!nav) return;

    toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "theme-toggle";
    const contactLink = nav.querySelector(".button");
    nav.insertBefore(toggle, contactLink || null);
    drawIcon(currentTheme);

    toggle.addEventListener("click", () => {
      applyTheme(currentTheme === "dark" ? "light" : "dark", true);
    });
  });
})();
