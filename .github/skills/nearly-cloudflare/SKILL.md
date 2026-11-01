---
name: nearly-cloudflare
description: Safely review NEARLY Studio Cloudflare Pages, Functions, Workers, D1, and deployment security.
---

# NEARLY Cloudflare and Backend Security

Use this skill only for explicitly authorized Cloudflare/backend work; its presence does not authorize backend changes during an unrelated frontend task.

## Architecture and safeguards

- Preserve the public site's static HTML/CSS/JavaScript architecture. The marketing agent is a separate Worker under `/agent`; Pages Functions and Worker responsibilities must not be conflated.
- Inspect the existing route, authentication, authorization, validation, database migration, and deployment behavior before proposing a change.
- Preserve authentication and authorization checks, enquiry rate limiting and deduplication, D1 protections, existing migrations, Content Security Policy, and security headers.
- Validate all untrusted request input at the server boundary. Fail closed on authentication/authorization errors and surface operational failures using established logging/notification patterns.
- Keep credentials server-side. Never put secrets in frontend bundles, browser storage, source control, logs, or generated content.
- Do not deploy, change access boundaries, activate integrations, or alter production data without the required explicit authorization. Never weaken a safeguard to make a test pass.

## Verification

Run focused tests and configuration checks. Keep deployment and security claims limited to what was actually verified; do not expose secret values in output.
