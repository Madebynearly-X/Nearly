# NEARLY Studio

A static, responsive website with an Apple-inspired minimalist direction (without copying Apple branding): generous whitespace, oversized typography, restrained blue accents, product-style mockups and simple navigation.

## Pages
- `index.html` — studio home
- `concept-demos.html` — interactive sample websites with locally bundled stock photography
- `landing-pages.html` — focused landing page service
- `business-websites.html` — starter and business websites
- `website-care.html` — maintenance service
- `contact.html` — enquiry form, with service selection prefilled from page links and a searchable international calling-code picker
- `client-login.html` — client portal login
- `client-portal.html` — client dashboard for project tracking
- `thanks.html` — post-submission confirmation page
- `privacy.html` — plain-language notice for website enquiries and lead handling

## Files
- `styles.css` — shared responsive design system
- `theme.css` and `theme.js` — shared light/dark theme tokens, system preference, accessible navigation toggle and saved local preference
- `concept-demos.css` and `concept-demos.js` — scoped styling and hash-based navigation for the sample websites
- `assets/demo-home-services.jpg` and `assets/demo-fitness-studio.jpg` — Unsplash stock photos used in the illustrative concepts
- `_headers` — Cloudflare Pages security headers and Content Security Policy
- `script.js` — mobile navigation, reveal-on-scroll, year and shared form validation
- `contact-form.js` — enquiry submission, server response states and international phone country-code picker; country flags load as Twemoji SVGs from cdnjs
- `functions/api/enquiry.js` — server-side Web3Forms delivery, enquiry validation, rate limiting and optional authenticated Google Sheets lead recording
- `functions/api/leads-summary.js` — Cloudflare Access-authenticated lead summary endpoint for the operations dashboard
- `functions/api/auth.js` — authentication utilities for client portal
- `functions/api/login.js` — client login endpoint
- `functions/api/logout.js` — client logout endpoint
- `functions/api/client-projects.js` — client project data endpoint
- `functions/api/admin/create-client.js` — admin client creation endpoint
- `functions/api/admin/create-project.js` — admin project creation endpoint
- `dashboard.html` — private operations dashboard showing pipeline status and due follow-ups
- `dashboard.js` — dashboard data loading and rendering, served as a same-origin script for the Content Security Policy
- `scripts/google-sheets-webhook.gs` — Google Apps Script endpoint that records leads, exposes dashboard data and maintains the Sheet's follow-up pipeline

## Motion layer
- `motion-advanced.css` and `motion-advanced.js` are an additive layer on top of `styles.css` and `script.js`: spring-in reveals for cards, 3D card tilt, the eased hero stage tilt, magnetic buttons, price pop on the payment-plan switch, the before/after slider and the ambient wireframe canvas.
- Everything lively sits behind `prefers-reduced-motion: no-preference`; with reduce motion on, the site's own rules in `styles.css` apply.
- The hero stage tilt lives only in `motion-advanced.js`. Do not add a second tilt in `script.js`: an inline transform there overrides the CSS variables and the two fight.
- `_headers` caches `.css` and `.js` for a year as immutable, so bump the `?v=` number on every page whenever either file changes.

## Display theme

The public pages provide light and dark themes. The first visit follows the device colour preference; the navigation toggle switches immediately and saves a manual choice in browser local storage using `nearly-theme`. The preference is local to the browser and is not used for analytics. `theme.js` is loaded early to apply a saved choice before page styles render. The separate operations dashboard is intentionally not affected.

## Before publishing
1. Confirm prices, timelines, included deliverables, revision limits and care plan terms.
2. Confirm public contact details.
3. The enquiry form uses a Cloudflare Pages Function at `/api/enquiry` to send enquiries through Web3Forms. In Cloudflare Pages **Settings → Variables and Secrets**, configure `TURNSTILE_SECRET_KEY` and `WEB3FORMS_ACCESS_KEY` as encrypted secrets for each environment where the form should work. The Turnstile site key in `contact.html` is public; never put the secret or Web3Forms access key in source control or browser code. Redeploy after configuring secrets. The form reports success only when Web3Forms accepts the submission; confirm delivery in Gmail and check Spam during the first live test. Google Sheets is optional: configure both `GOOGLE_SHEETS_WEBHOOK_URL` and `GOOGLE_SHEETS_WEBHOOK_TOKEN` or leave both unset. If the email provider accepts an enquiry but Sheets cannot confirm recording, the visitor sees that partial status. Automated tests use mocked providers only; no live email or Sheets delivery has been verified. To email an enquiry copy to the person who submitted it, configure and test Web3Forms' autoresponder in its dashboard; the provider documents this as a Pro/Agency feature that only works on production websites.
4. Keep `privacy.html` accurate as your data handling, service providers, and retention practices change.
5. Replace illustrative mockups with real work as you have permission to publish it. Concept work should remain clearly labelled.
6. Choose and connect a custom domain and matching business email. Update the canonical and Open Graph URLs from `nearly-x.pages.dev` on all indexable pages, and add the custom hostname to the Turnstile widget before launch.
7. Create and add an Open Graph preview image, then test the favicon and page previews on social platforms.
8. Deploy as a preview first and test every navigation link and enquiry flow on mobile and desktop before pointing your main domain at it.

## Enquiry spam protection

The contact form includes a honeypot field and Cloudflare Turnstile. Turnstile must be validated server-side; the Pages Function does this through Cloudflare Siteverify and checks the configured hostname and `enquiry` action before sending anything to email or Sheets. Its widget is explicitly rendered so its appearance follows the selected site theme; changing themes refreshes the challenge, so solve the current challenge before submitting.

Before deploying the Turnstile integration:
1. Create a Turnstile widget for `nearly-x.pages.dev` and any custom domain you use. Use Managed mode and do not enable pre-clearance.
2. Set the widget's **site key** on the `cf-turnstile` element in `contact.html`. This key is public and belongs in the page; the **secret key must never go into source code or chat**.
3. Add the widget's secret key to the Cloudflare Pages project's **Settings → Variables and Secrets** for Production as the encrypted secret `TURNSTILE_SECRET_KEY`.
4. Only publish after both keys are configured. If either key is missing or does not match, form submissions will be rejected rather than silently bypassing verification.
5. Submit a real test enquiry and verify it reaches both email and the Leads sheet. Expired or reused Turnstile tokens are rejected; visitors can retry the widget and submit again.

Turnstile is provided at no cost by Cloudflare under its current service terms. It sends technical browser and network signals to Cloudflare for bot detection; see `privacy.html`. Keep the privacy notice accurate if you change providers or widget settings.

## Security and cookies

The site does not use advertising or analytics cookies or a cookie-preference store, so it does not need a consent banner for those purposes. Turnstile may use strictly necessary security cookies or similar signals; these are described in the privacy notice. `_headers` applies a restrictive Content Security Policy, clickjacking protection, MIME sniffing protection, a referrer policy, a permissions policy, and HSTS on Cloudflare Pages. Review the CSP whenever adding scripts, fonts, images, or other third-party services.

## Protecting the lead dashboard

The dashboard is not linked from the public navigation or sitemap and is marked `noindex`, but those measures are not access control. Protect both the dashboard page and its API with Cloudflare Access. The API also validates Access JWT signatures itself, returns only fields rendered in the dashboard, and fails closed if its Access configuration is missing or invalid.

1. In Cloudflare Zero Trust, enable **Email one-time PIN** as an identity provider.
2. In **Workers & Pages → nearly-x → Settings → Preview access**, restrict preview deployments so unmerged dashboard previews are not publicly available.
3. Protect the production Pages hostname `nearly-x.pages.dev` in Zero Trust. Cloudflare requires enabling the Pages preview access policy first; follow its [instructions for enabling Access on a Pages `*.pages.dev` domain](https://developers.cloudflare.com/pages/platform/known-issues/#enable-access-on-your-pagesdev-domain). Keep the Access applications path-scoped to `/dashboard.html` and `/api/leads-summary`; do not put the public website behind login. See Cloudflare's [path-scoped application guide](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/).
4. Create an **Allow** policy for each application that includes only `madebynearly@gmail.com`. Do not use an `Everyone` policy.
5. Copy the API application's **Application Audience (AUD) Tag** and your Zero Trust team domain (for example, `your-team.cloudflareaccess.com`).
6. Before merging the dashboard to production, add Production variables to **Workers & Pages → nearly-x → Settings → Variables and Secrets**:
   - `CF_ACCESS_TEAM_DOMAIN` — team domain only, without `https://`.
   - `CF_ACCESS_AUD` — audience tag for the `/api/leads-summary` application.
   Keep the Sheets webhook URL and token as encrypted secrets. Add equivalent Preview variables only if the preview host is covered by an Access app that forwards the Access JWT.
7. Deploy only after both path policies and variables are configured. Verify signed-out requests 

## Client Portal

The client portal allows clients to log in and view their project progress, milestones, and deliverables.

### Setup

See `docs/CLIENT_PORTAL_SETUP.md` for complete setup instructions including:

- Creating the Cloudflare D1 database
- Running database migrations
- Configuring environment variables
- Setting up D1 bindings in Cloudflare Pages

### Required Environment Variables

- `ADMIN_API_KEY` — required for admin API endpoints (client/project creation)
- Existing secrets: `TURNSTILE_SECRET_KEY`, `WEB3FORMS_ACCESS_KEY`, `GOOGLE_SHEETS_WEBHOOK_URL`, `GOOGLE_SHEETS_WEBHOOK_TOKEN`

### Admin API

Admin endpoints for creating clients and projects are documented in `docs/ADMIN_API.md`.

## Tests

Run the public Pages tests with `npm test`. Run the separate marketing Worker suite with `cd agent && npm test`.

## Accessibility
The site includes a skip link, named primary navigation, keyboard-visible focus indicators, keyboard-operable enquiry controls, semantic page landmarks, and reduced-motion support. These code improvements are not a legal ADA compliance certification or a complete WCAG conformance audit; test with assistive technologies and users, and review applicable legal requirements before making a compliance claim.

## Repository safety

`.gitignore` excludes environment files, Wrangler state, editor settings, logs, and dependencies. Review `_headers` whenever adding a third-party script, font, image source or endpoint because the Content Security Policy must be updated deliberately.
