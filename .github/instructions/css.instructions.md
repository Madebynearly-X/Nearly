---
applyTo: "**/*.css"
---

# CSS and motion conventions

- Reuse existing design tokens and page styles. Prefer focused selectors and responsive rules over duplicate or competing overrides.
- Before changing `transform`, trace every CSS and JavaScript writer for that element. Keep one clear owner per transform property; use nested elements or individual transform properties to compose independent effects.
- Preserve responsive behavior, visible focus, readable contrast, and content visibility when scripts or animation are unavailable.
- Respect `prefers-reduced-motion`, including continuous and decorative animation. Keep essential information and interactions usable without motion.
- Avoid expensive effects and unbounded animation. Preserve cache/security conventions and coordinate CSS cache versions across pages when shared assets change.
