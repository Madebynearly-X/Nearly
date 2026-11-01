---
applyTo: "**/*.js"
---

# Browser JavaScript conventions

- Use the existing vanilla JavaScript architecture. Keep scripts same-origin where expected, defer page scripts, and preserve the established load order.
- Guard optional page elements and feature-detect browser APIs. Prefer native controls and clear failure behavior over silent success-shaped fallbacks.
- Assign one owner to each element's transform property. Coordinate pointer effects with `script.js`, CSS hover states, and individual transform properties before adding handlers.
- Handle pointer cancellation and cleanup. Do not block touch scrolling for decorative effects; gate work by pointer capability when appropriate.
- Manage animation lifecycle: batch visual work with `requestAnimationFrame`, stop loops when hidden/off-screen, and respond dynamically to reduced-motion preference changes.
- Avoid unnecessary global listeners, DOM scans, layout reads, and dependencies. Keep logic testable and do not claim browser behavior without a browser test.
