---
name: nearly-accessibility
description: Review and improve accessibility and responsive behavior across NEARLY Studio's static website.
---

# NEARLY Accessibility and Responsive Engineering

Use this skill when building or reviewing public pages, interactive controls, responsive layouts, or motion.

## Requirements

- Prefer semantic landmarks, headings, lists, links, buttons, and native form controls. Keep keyboard order logical and provide visible `:focus-visible` states.
- Ensure every interaction works without pointer precision. Use native keyboard-accessible controls; announce meaningful dynamic changes with appropriate live regions.
- Give images meaningful alt text when informative and empty alt text when decorative. Mark decorative canvas/artwork appropriately.
- Preserve readable contrast, text zoom, clear link purpose, and usable touch targets. Check narrow viewports for clipped content and horizontal overflow.
- Touch gestures must not prevent ordinary page scrolling unless the interaction clearly requires it. Decorative tilt must never be required to access information.
- Respect reduced motion at initial load and when the operating-system preference changes while the page is open. Keep essential information visible without animation.
- Ensure useful content remains available if JavaScript fails; avoid hiding core page content behind script-only navigation or reveal behavior.

## Review workflow

Inspect the shared styles and scripts as well as page markup. Test keyboard navigation, focus visibility, screen-reader semantics, reduced-motion states, and mobile layouts; report which checks were source-only and which were performed in a browser.
