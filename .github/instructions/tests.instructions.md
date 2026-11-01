---
applyTo: "**/test/**/*"
---

# Test conventions

- Add focused regression tests for changed behavior and important edge cases. Keep tests deterministic and independent of network services, live accounts, external credentials, and production data.
- Use the repository's existing test runner and established patterns; do not add dependencies without need and approval.
- Assert observable outcomes and failure behavior, not private implementation details. Include reduced-motion, pointer/touch, missing-element, and observer-fallback cases when they apply.
- Keep tests isolated and avoid mutating shared fixtures or environment state. Do not weaken existing security assertions to make a change pass.
- Report exactly which tests and static checks ran; do not describe source inspection as runtime verification.
