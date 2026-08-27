# Cloudflare split plan

This repo is being split into three runtime surfaces:

- `2aran.com`: public site. Static-first, small Pages Worker, no admin routes.
- `admin.2aran.com`: owner-only admin console. Same D1/R2 bindings, separate Pages/Worker project.
- `api.2aran.com`: future lightweight Worker for comments, notifications, points, and other public APIs.

## Phase 1: public build excludes admin

`npm run pages:build:public` temporarily removes these folders before running `@cloudflare/next-on-pages`, then restores them after the build:

- `app/(admin)`
- `app/api/admin`

Use it only for the public `2aran.com` Cloudflare Pages project after `admin.2aran.com` has its own deployment.

Live Cloudflare Pages config:

- `tuaran` (`2aran.com`): build command `npm run pages:build:public`; build watch paths include `*`.
- `tuaran-admin-git` (`admin.2aran.com`): build command `npm run pages:build`, which delegates to the admin-only build. The build temporarily excludes public pages and unrelated public APIs, while keeping admin routes, auth, and the session APIs used by the admin shell. Build watch paths are compact boundary rules for admin routes, auth/admin API routes, shared runtime code, and build config.

Admin build watch path policy:

- Route surfaces: `app/(admin)*`, admin/auth/private API routes, login/register, and the few shared site components used by admin.
- Shared runtime: `lib/*` intentionally triggers admin rebuilds for any shared library change; this is broader than a per-file allowlist, but avoids stale admin deployments when a shared dependency changes.
- Build config: `package*`, `*.config.js`, `wrangler.toml`, `jsconfig.json`, `public/_headers`, and build helper scripts.

Current commands:

- `npm run pages:build` / `npm run pages:build:admin`: admin-only build, keeps `app/(admin)`, admin/auth APIs, and `/api/me`, `/api/nav-config`, `/api/notifications`, `/api/private-records`, `/api/site-settings`. Static-safe Admin pages are prerendered; Middleware verifies the owner session before returning `/admin`, nested Admin routes, or direct Admin RSC payloads. APIs retain their own owner checks. The verifier rejects unexpected dynamic Admin pages and enforces a 2.5 MiB repository budget below Cloudflare's 3 MiB hard limit.
- `npm run pages:build:all`: full build for local verification or emergency use.
- `npm run pages:build:public`: public-only build, excludes admin routes, reports the largest Worker modules, and enforces a 2.75 MiB repository budget.

### 2026-08-27 Admin page staticization

The previous Admin build generated one Edge function for every Admin page because each page declared `runtime = 'edge'` and `force-dynamic`, while `AdminPageGate` read `headers()` and `cookies()` during page rendering. That left only about 0.035 MiB below the Cloudflare Free limit.

Authorization now runs at two independent boundaries:

1. `middleware.js` verifies the shared `.2aran.com` session before returning Admin HTML or RSC content. Anonymous and non-owner requests are redirected to the canonical login flow with the full Admin return URL.
2. Every protected API continues to verify the owner independently. Page authorization is never treated as API authorization.

Pages that only render a client workspace are prerendered and remain behind Middleware. Five routes still need Edge rendering because they consume request-time search or dynamic path parameters:

- `/admin/article-distribution`
- `/admin/articles/[id]/edit`
- `/admin/planning`
- `/admin/soft-sticker`
- `/admin/stock-analysis/[slug]`

Measured Admin result after the change:

- Edge routes: 114 → 70
- Worker gzip: 2.965 MiB → 1.843 MiB
- Cloudflare Free-limit headroom: 0.035 MiB → 1.157 MiB

Both builds print the ten largest gzip contributors so future growth has an attributable owner instead of appearing only as a deployment failure.

Cutover checklist:

1. Done: Create a separate Cloudflare Pages project for `admin.2aran.com`.
2. Done: Keep the project on `npm run pages:build`; the repository now delegates that command to the admin-only build.
3. Done: Bind the same `DB` D1 database and `MEDIA` R2 bucket.
4. Done: Copy required secrets: GitHub/Google OAuth, auth/session secrets, DeepSeek keys, collect secrets.
5. Done: Confirm `https://admin.2aran.com/admin` loads and owner auth works.
6. Done: Change the public `2aran.com` Pages build command from `npm run pages:build` to `npm run pages:build:public`.
7. Done: Configure `admin.2aran.com` Build watch paths so normal public content changes do not trigger admin builds.

The public middleware redirects `https://2aran.com/admin/*` to `https://admin.2aran.com/admin/*`.

## Phase 2: public API Worker

Move these frontend API routes to `api.2aran.com` after admin is stable:

- `/api/comments`
- `/api/discussions`
- `/api/notifications`
- `/api/points/me`
- `/api/points/checkin`
- `/api/points/unlock`

Recommended migration:

1. Add a small Worker using native Fetch handlers or Hono.
2. Use D1/R2 bindings directly, not Cloudflare REST APIs.
3. Keep auth/session cookie compatibility with `2aran.com` and `admin.2aran.com`.
4. Add a frontend API base helper so client components call `NEXT_PUBLIC_SITE_API_BASE || ''`.
5. Keep old Next routes as temporary proxies until all clients are switched.
6. Remove the proxied Next routes from the public Pages build.

## Phase 3: content catalog externalization

The research markdown catalog is still generated at build time. Move metadata and then body content out in two steps:

1. Sync metadata into D1 `content_index`: title, summary, tags, href, date, status.
2. Move body markdown to D1 or R2 and resolve article details at request time or through a cached API.

Target outcome:

- Public listing and discussion title resolution read `content_index`.
- The Pages Worker no longer imports the generated research catalog for public runtime paths.
- Adding or editing research content does not require rebuilding the whole site.
