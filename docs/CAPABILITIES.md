# Platform and video-tool capability verification

Checked: 2026-10-10.

LinkedIn's text-post API and OAuth prerequisites were checked against official documentation. This verifies the documented API shape only; no LinkedIn app, product access, account connection, or live post has been verified. Other platform API or video-tool facts remain unverified.

## Public Pages platform checks

Checked: 2026-11-02.

Cloudflare Pages documents `_routes.json` `include`/`exclude` rules as controlling when Pages Functions are invoked; wildcard routes match path segments and exclusions take priority. The site configuration now includes only `/api/*`, so static page and asset paths are outside the Function invocation routes. This is verified against the repository configuration and local route tests, not a deployed Pages request.

Cloudflare Turnstile supports explicit rendering with `?render=explicit`; its render options include `theme: "light"` and `theme: "dark"`, and the API supports removing and resetting a widget. The enquiry form uses this to keep the widget aligned with the selected site theme and renew its token after submission. The documented behavior does not verify the production site key, secret, domain allowlist, or successful live verification.

| Platform | Facts checked | Official source | Checked |
|---|---|---|---|
| Cloudflare Pages Functions | `_routes.json` include/exclude behavior, wildcard matching, and exclusion precedence | [Pages Functions routing](https://developers.cloudflare.com/pages/functions/routing/) | 2026-11-02 |
| Cloudflare Turnstile | Explicit rendering, supported light/dark theme values, and widget lifecycle operations | [Client-side rendering](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/) | 2026-11-02 |

| Category | Tool/platform | Connection state | Facts | Official source URL | Checked |
|---|---|---|---|---|---|
| Social publishing | Instagram | Not connected | unverified | Not checked | Not checked |
| Social publishing | Facebook | Not connected | unverified | Not checked | Not checked |
| Social publishing | LinkedIn | Not connected; implementation mocked until owner completes OAuth | Official member text-post endpoint `POST /rest/posts`; requires `w_member_social`, OpenID Connect member identity (`openid profile`), `LinkedIn-Version` in YYYYMM format, and `X-Restli-Protocol-Version: 2.0.0`. This implementation is text-only and owner-triggered; it does not publish to company pages or attach media. API version `202609` was current in the checked documentation. Product access and the live integration remain unverified. | [Posts API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?view=li-lms-2026-09) · [Post schema](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/post-api-schema?view=li-lms-2026-09) · [OAuth authorization code flow](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow) · [OpenID Connect](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2) | 2026-10-10 |
| Social publishing | TikTok | Not connected | unverified | Not checked | Not checked |
| Social publishing | YouTube | Not connected | unverified | Not checked | Not checked |
| Social publishing | Pinterest | Not connected | unverified | Not checked | Not checked |
| Social publishing | X | Not connected | unverified | Not checked | Not checked |
| Social publishing | Threads | Not connected | unverified | Not checked | Not checked |
| Video creation | Canva | Not connected until owner OAuth | OAuth autofill of existing brand templates and MP4 export documented; no arbitrary video timeline authoring | [Canva Autofill](https://www.canva.dev/docs/apps/rest-apis/reference/autofills/) · [Canva Export](https://www.canva.dev/docs/apps/rest-apis/reference/exports/) | 2026-10-09 |
| Video creation | Adobe Express | Awaiting business approval | Interactive Embed SDK video actions documented; headless generation API not verified | [Adobe Express Embed SDK](https://developer.adobe.com/express/embed-sdk/docs/guides/) | 2026-10-09 |

LinkedIn has an owner-triggered member text-post adapter, but it remains disconnected until the owner registers/configures an app, receives the required product access, authorizes the account, and verifies a real post. Canva integration code remains disconnected until its app and account are configured. Adobe Express remains disabled until Adobe business approval, the HTTPS host, and the SDK key are configured. Canva creates from existing template fields; Adobe workflows are interactive and require the owner. Instagram/Facebook/TikTok, company-page posts, media publishing, scheduled publishing, trend research, and analytics do not have implemented live adapters.
