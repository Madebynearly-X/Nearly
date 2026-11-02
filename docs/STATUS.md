# Project Status

Last updated: 2026-11-02

## Current phase

Phase 2: Supervised channel execution — LinkedIn text-member publishing implemented and mocked tests pass; live use is gated on owner setup.

## Milestones

| Milestone | State | Verified how | Live or mocked |
|---|---|---|---|
| Repo inspection and findings | Done (verified) | Inspected tracked files, Pages Function, README, CSS, assets, headers and contact flow | Existing Pages paths verified from source |
| `/agent` scaffold | Done (verified) | Wrangler dry-run build and local Worker startup | Separate local Worker; public Pages site unchanged |
| D1 schema and migrations | Done (verified) | Applied migrations to the remote D1 database and test harness applies migrations to its isolated D1 | Remote D1 provisioned; media storage not required for current text-first workflow |
| Access authentication | Done (verified) | Access application and owner policy created; Worker secrets configured; unauthenticated request redirects to Access | Cloudflare Access boundary live; owner login still required for an authenticated API check |
| Brand profile and settings | Done (verified) | D1-backed implementation and test suite | Local D1 |
| Safety controls and pause | Done (verified) | Publish-policy and scheduled-job tests | Local D1; no external publishing |
| Orchestrator and heartbeat | Done (verified) | Job lease/idempotency tests; seeded heartbeat processed by local cron trigger | Local Worker |
| LLM provider and spend caps | Done (verified) | Mock-provider and spend-limit tests | Mock provider only; no paid API call |
| Draft generation, QC and approval workflow | Done (verified) | Content, quality-control, state-transition and policy tests | Local Worker; all exports require approval |
| Dashboard shell | Done (verified) | Local `/` returned HTTP 200 with HTML; health endpoint returned HTTP 200 | Local Worker |
| Tests | Done (verified) | 8 test files, 28 tests passed | Local Workers test pool; LinkedIn API responses mocked |
| Typecheck and lint | Done (verified) | `npm run typecheck`; `npm run lint` | Local |
| Build and dashboard secret scan | Done (verified) | `npm run build`; Wrangler dry-run succeeded; secret-name scan passed across 4 static files | Local dry run |
| Dependency audit | Done (verified) | `npm audit` reported 0 vulnerabilities | Installed dependency tree |
| Canva OAuth and video-template export | Done (verified with mocked Canva responses) | Auth-code/PKCE, encrypted token persistence, brand-template autofill, async job polling, MP4 export and HTTPS download validation covered by integration test | Mocked Canva API; account credentials and template not configured |
| LinkedIn OAuth and text-member publishing | Done (verified with mocked LinkedIn responses) | OAuth state binding, encrypted token storage, member-text post payload, approval and emergency-pause gates, duplicate prevention, cross-origin rejection, and uncertain-result reconciliation covered by tests | Mocked LinkedIn API; app product access, credentials, account authorization, and a live post not verified |
| Adobe Express video editor | Prepared (gated) | Feature remains disabled until Adobe business approval, client ID and matching HTTPS origin; integration status tests cover activation gate | Adobe account/approval not configured |
| Documentation | Done (verified) | Setup, integration, capability, plan and status docs reviewed/updated | Local |
| Public Pages enquiry repair | Done (local) | `npm test` — 31 tests passed, including JSON Content-Type, charset, malformed-body, browser-payload, route and protected-API checks | Providers mocked; Pages routing and live delivery not verified in production |
| Public Pages FAQ and theme | Done (local) | Theme preference, reload, system override, page coverage, FAQ state and reduced-motion checks in `test/theme.test.js` | State simulated; no browser/device visual run |

## Blockers and owner actions

- Cloudflare Access is configured for the Worker with an owner-only policy. An owner-authenticated API check still needs to be completed in a browser. R2 is intentionally not required for the current text-first workflow.
- Real LLM credentials, provider/model selection and current spend rates are not configured. Keep the mock provider selected.
- LinkedIn Developer app, Share on LinkedIn and OpenID Connect product access, server-side credentials, and an owner-authorized LinkedIn account are not configured. A real test post has not been sent.
- Canva OAuth API calls use mocked responses in tests; no Canva account authorization, app credentials, template, or exported video has been verified live.
- Adobe Express embed remains disabled pending Adobe business approval and HTTPS app configuration. Live social analytics, trends, and automated scheduling are not implemented.
- The Pages enquiry and theme changes have not been deployed. Configure `TURNSTILE_SECRET_KEY` and `WEB3FORMS_ACCESS_KEY` as encrypted Cloudflare Pages secrets (and both optional Google Sheets settings if enabled) before a preview test. No real email or Sheets request was made.

## Known limitations

- The Worker is deployed at `https://nearly-marketing-agent.madebynearly.workers.dev`; `/api/health` is verified and protected routes now redirect unauthenticated requests to Cloudflare Access. R2-backed media storage is intentionally deferred.
- LinkedIn publishing currently supports only owner-triggered, approved, text-only member posts. Company-page posts, media, scheduled publishing, trends, and analytics remain unimplemented.
- Dashboard and API local authentication bypass is enabled only by the ignored `.dev.vars` development configuration; it must not be used in production.
- Root `npm test` is scoped to the public Pages tests so it does not discover the separate Worker's TypeScript tests; run the Worker suite independently with `cd agent && npm test` (8 files, 28 tests).
- A desktop/mobile visual browser run and formal HTML/accessibility validator were unavailable in this environment. Responsive rules, semantic native FAQ controls, focus styling, reduced-motion CSS and contrast ratios were checked from source; this is not a WCAG conformance claim.

## Next steps

1. Owner registers/configures the LinkedIn Developer app, obtains the required product access, and adds the HTTPS callback and Worker secrets described in `docs/SETUP.md`.
2. Connect the intended member account and verify a clearly marked test post in LinkedIn before treating publishing as live.
3. Owner selects an LLM provider/model and authorizes a spend cap; configure current official rates before switching from the mock provider.
4. Sign in through Cloudflare Access once to verify the protected dashboard/API route; add R2 only if media storage is later approved and funded.
5. Implement cited trend discovery, analytics, and supervised scheduling as later milestones; do not enable unattended publishing until those safeguards are reviewed.
