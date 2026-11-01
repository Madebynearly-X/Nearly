---
name: nearly-frontend
description: Build and review NEARLY Studio's static public-site interfaces using semantic HTML, responsive CSS, and vanilla JavaScript.
---

# NEARLY Frontend Engineering

Use this skill for public website pages and browser-side UI.

## Project constraints

- Preserve the existing static HTML/CSS/JavaScript architecture. Do not introduce a framework, bundler, or dependency without a clear need and owner approval.
- Follow the existing page structure and naming conventions. Reuse tokens and shared rules from `styles.css`; keep page-specific styles in the existing page stylesheet.
- Keep behavior in vanilla JavaScript and presentation in CSS where practical. Reuse existing shared scripts and components instead of creating parallel implementations.
- Preserve the homepage browser stage, before/after comparison, demo catalogue, and existing navigation unless the owner explicitly authorizes a change.
- Do not redesign unrelated pages or change contact forms, authentication, portal/dashboard, API, or backend behavior during an unrelated frontend task.
- Keep business claims, pricing, testimonials, and concept disclosures accurate. Never invent social proof or performance results.

## Implementation workflow

1. Inspect `AGENTS.md`, `.github/copilot-instructions.md`, the relevant page, shared styles/scripts, and nearby pages before editing.
2. Check existing patterns, selectors, IDs, assets, and script loading order. Make the smallest complete change.
3. Keep layouts usable at mobile, tablet, and desktop sizes. Preserve visible focus, semantic landmarks, useful alternative text, and reduced-motion behavior.
4. Validate referenced local assets and links. Run focused syntax checks and the repository's existing tests where relevant.
5. Report what was verified and distinguish source inspection from actual browser testing.
