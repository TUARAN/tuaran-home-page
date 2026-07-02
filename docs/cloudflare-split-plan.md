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

Current commands:

- `npm run pages:build` / `npm run pages:build:all`: current full build, keeps admin routes.
- `npm run pages:build:public`: public-only build, excludes admin routes.

Cutover checklist:

1. Create a separate Cloudflare Pages project for `admin.2aran.com`.
2. Point that project at the full/admin build path first.
3. Bind the same `DB` D1 database and `MEDIA` R2 bucket.
4. Copy required secrets: GitHub/Google OAuth, auth/session secrets, DeepSeek keys, collect secrets.
5. Confirm `https://admin.2aran.com/admin` loads and owner auth works.
6. Change the public `2aran.com` Pages build command from `npm run pages:build` to `npm run pages:build:public`.

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
