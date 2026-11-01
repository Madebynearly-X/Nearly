---
name: nearly-browser-qa
description: Run honest regression and responsive QA for NEARLY Studio's public pages and interactive motion.
---

# NEARLY Browser Testing and QA

Use this skill to validate public-site changes. Source checks are not substitutes for browser behavior.

## Safe checks

- Inspect the active worktree and branch with `git status --short --branch` before testing; do not overwrite or clean user work.
- Existing validation commands include `npm test`, `node --check script.js`, `node --check motion-advanced.js`, and `git diff --check`.
- Use `python3 -m http.server 8788 --bind 0.0.0.0` for a static local preview when appropriate. If the port is occupied, identify and choose another unused port; never kill an unidentified process.
- Browser testing requires an actual browser. Do not describe syntax checks, static inspection, or a server health response as a completed browser test.

## Coverage

Check the homepage, demo catalogue and each demo, relevant service pages, and pricing. Exercise navigation, direct hash links and browser history, mobile navigation, image loading, comparison keyboard/pointer/touch controls, stage/card tilt, magnetic buttons, reveal/pricing behavior, and reduced motion at load and after toggling.

Check desktop, tablet, and narrow mobile widths, keyboard focus, console errors, failed network requests, image fallbacks, and horizontal overflow. Record browser/device conditions and report failures explicitly. Do not modify forms, authentication, portal/dashboard, APIs, backend behavior, or deployment configuration during unrelated QA.
