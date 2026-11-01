---
applyTo: "functions/**/*"
---

# Cloudflare Pages Functions safeguards

- Inspect the existing handler, data flow, and tests before changing a Pages Function. Validate untrusted request input at the server boundary.
- Preserve authentication, authorization, enquiry rate limiting and deduplication, database constraints/migrations, and established error handling.
- Keep secrets server-side and out of responses, browser storage, logs, and source control.
- Never weaken Content Security Policy, security headers, or access controls to make a feature work or a test pass.
- Do not change a Function as part of an unrelated public-site task. Require explicit authorization for security-boundary, production-data, integration, or deployment changes.
