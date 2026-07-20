# Nano Banana Gallery Rich Page Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Awesome Nano Banana Images from the resource library to the rich-pages system at `/nano-banana-gallery`, with a permanent redirect from the old URL and consistent SEO, analytics, engagement, and directory registration.

**Architecture:** The existing `ENGINEERING_WORKS` registry becomes the authoritative rich-page record and automatically feeds `/rich-pages`, the rich-page frame, SEO metadata, JSON-LD, and sitemap generation. The generic content/PV registry gains a `rich-page` category for analytics and engagement resolution without leaving a resource entry behind. The page and client component move to the root site route while the old resource route becomes redirect-only.

**Tech Stack:** Next.js 15 App Router, React 19, JavaScript, Node.js built-in test runner, Cloudflare Pages/D1.

## Global Constraints

- The only canonical page URL is `/nano-banana-gallery`.
- `/resources/nano-banana-gallery` permanently redirects to the canonical URL.
- The page appears only in the rich-pages directory under `ai-engineering` and does not remain in resource-library registries.
- Preserve all existing gallery data, search, input/output comparison, prompt-copy behavior, and upstream source attribution.
- Do not modify `lib/nanoBananaCases.js` or `scripts/generate-nano-banana-gallery.mjs`.
- Do not rewrite historical `resource/nano-banana-gallery` analytics rows; new visits use `rich-page/nano-banana-gallery`.
- Preserve unrelated working-tree changes in the admin SEO files.

## File Structure

- Create `scripts/test-nano-banana-rich-page-migration.mjs`: focused source-contract regression tests for classification, routing, SEO, and sitemap behavior.
- Modify `package.json`: expose the focused regression test command.
- Modify `lib/engineeringWorks.js`: authoritative rich-page directory record.
- Modify `lib/homeResourceItems.js`: remove the resource-directory record.
- Modify `lib/contentRegistry.js`: replace the resource analytics record with a `rich-page` record and register its label/group.
- Modify `lib/contentPipeline.js`: expose the rich-page content label.
- Modify `lib/articleLinks.js` and `lib/contentKeyLite.js`: resolve rich-page engagement keys to the canonical route.
- Move `app/(site)/resources/nano-banana-gallery/NanoBananaGallery.jsx` to `app/(site)/nano-banana-gallery/NanoBananaGallery.jsx`: colocate the client UI with its canonical route.
- Create `app/(site)/nano-banana-gallery/page.jsx`: canonical rich-page wrapper, metadata, JSON-LD, analytics, and engagement.
- Replace `app/(site)/resources/nano-banana-gallery/page.jsx`: permanent redirect only.
- Modify `lib/richPageSeo.js`: Nano Banana-specific SEO overrides.
- Modify `app/(site)/sitemap.js`: remove the old resource URL; the canonical URL comes from rich-page SEO registration.

---

### Task 1: Reclassify the gallery in shared registries

**Files:**
- Create: `scripts/test-nano-banana-rich-page-migration.mjs`
- Modify: `package.json`
- Modify: `lib/engineeringWorks.js`
- Modify: `lib/homeResourceItems.js`
- Modify: `lib/contentRegistry.js`
- Modify: `lib/contentPipeline.js`
- Modify: `lib/articleLinks.js`
- Modify: `lib/contentKeyLite.js`

**Interfaces:**
- Consumes: existing `ENGINEERING_WORKS`, `CONTENT_PV_ENTRIES`, `CONTENT_PV_CATEGORIES`, and content-key resolution conventions.
- Produces: rich-page record `{ id: 'nano-banana-gallery', category: 'ai-engineering', href: '/nano-banana-gallery' }`, PV key `rich-page/nano-banana-gallery`, and engagement key `rich-page:nano-banana-gallery`.

- [ ] **Step 1: Write the failing registry test**

Create `scripts/test-nano-banana-rich-page-migration.mjs`:

```js
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('nano banana is registered only as a rich page', async () => {
  const [works, resources, registry] = await Promise.all([
    read('lib/engineeringWorks.js'),
    read('lib/homeResourceItems.js'),
    read('lib/contentRegistry.js'),
  ])

  assert.match(works, /id: 'nano-banana-gallery'[\s\S]*category: 'ai-engineering'[\s\S]*href: '\/nano-banana-gallery'/)
  assert.doesNotMatch(resources, /href: '\/resources\/nano-banana-gallery'/)
  assert.doesNotMatch(registry, /category: 'resource', slug: 'nano-banana-gallery'/)
  assert.match(registry, /category: 'rich-page', slug: 'nano-banana-gallery'[\s\S]*href: '\/nano-banana-gallery'/)
  assert.match(registry, /'rich-page': '多维页面'/)
  assert.match(registry, /new Set\(\['resource', 'feed', 'rich-page'\]\)/)
})

test('rich-page engagement keys resolve to the canonical route', async () => {
  const [pipeline, articleLinks, keyLite] = await Promise.all([
    read('lib/contentPipeline.js'),
    read('lib/articleLinks.js'),
    read('lib/contentKeyLite.js'),
  ])

  assert.match(pipeline, /'rich-page': '多维页面'/)
  assert.match(articleLinks, /CONTENT_PV_CATEGORIES\.has\(category\)/)
  assert.match(keyLite, /key\.startsWith\('rich-page:'\)/)
  assert.match(keyLite, /return slug \? `\/\$\{slug\}` : null/)
})
```

Add the package command:

```json
"test:nano-banana-migration": "node --test scripts/test-nano-banana-rich-page-migration.mjs"
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm run test:nano-banana-migration`

Expected: FAIL because the gallery still has a resource entry and no rich-page registration.

- [ ] **Step 3: Add the minimal rich-page registrations**

Add this record near the top of `ENGINEERING_WORKS`:

```js
{
  id: 'nano-banana-gallery',
  category: 'ai-engineering',
  title: 'Awesome Nano Banana Images',
  summary: '141 个 Nano Banana 与 Nano Banana Pro 图像生成、编辑案例，支持搜索、输入输出对比和一键复制提示词。',
  date: '2026-07-13',
  href: '/nano-banana-gallery',
  kind: 'AI 视觉案例库',
},
```

Delete the Nano Banana object from `HOME_RESOURCE_ITEMS`. In `contentRegistry.js`, replace its resource record with:

```js
{ category: 'rich-page', slug: 'nano-banana-gallery', title: 'Awesome Nano Banana Images', href: '/nano-banana-gallery', date: '2026-07-13', summary: '141 个 Nano Banana 与 Nano Banana Pro 图像生成、编辑案例，支持搜索、输入输出对比和一键复制提示词。', tags: ['Nano Banana', 'AI 图片', '提示词', '图像编辑', 'AI'] },
```

Extend the shared labels and category whitelist:

```js
export const CONTENT_TYPE_LABELS = {
  companies: '公司观察',
  topics: '专题分析',
  people: '人物',
  resource: '资源',
  feed: '灵感',
  'rich-page': '多维页面',
}

export const CONTENT_TYPE_GROUP = {
  companies: '分析',
  topics: '分析',
  people: '分析',
  resource: '资源',
  feed: '灵感',
  'rich-page': '多维页面',
}

export const CONTENT_PV_CATEGORIES = new Set(['resource', 'feed', 'rich-page'])
```

Add the pipeline display label:

```js
export const CONTENT_PIPELINE_TYPE_LABELS = {
  research: '分析',
  article: '文章',
  resource: '资源',
  feed: '灵感',
  'rich-page': '多维页面',
}
```

Import `CONTENT_PV_CATEGORIES` in `articleLinks.js` and replace the resource/feed-only branch with:

```js
const [category, slug] = key.split(':')
if (CONTENT_PV_CATEGORIES.has(category)) {
  const entry = resolveContentEntry(category, slug)
  if (entry) return { title: entry.title, href: entry.href }
}
```

Add this fallback in `contentKeyLite.js` before the resource branch:

```js
if (key.startsWith('rich-page:')) {
  const slug = key.slice('rich-page:'.length)
  return slug ? `/${slug}` : null
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm run test:nano-banana-migration`

Expected: 2 tests pass, 0 fail.

- [ ] **Step 5: Commit the registry migration**

```bash
git add package.json scripts/test-nano-banana-rich-page-migration.mjs lib/engineeringWorks.js lib/homeResourceItems.js lib/contentRegistry.js lib/contentPipeline.js lib/articleLinks.js lib/contentKeyLite.js
git commit -m "feat: classify nano banana gallery as rich page"
```

### Task 2: Move the canonical page and preserve the old URL

**Files:**
- Modify: `scripts/test-nano-banana-rich-page-migration.mjs`
- Create: `app/(site)/nano-banana-gallery/page.jsx`
- Move: `app/(site)/resources/nano-banana-gallery/NanoBananaGallery.jsx` → `app/(site)/nano-banana-gallery/NanoBananaGallery.jsx`
- Modify: `app/(site)/resources/nano-banana-gallery/page.jsx`
- Modify: `lib/richPageSeo.js`
- Modify: `app/(site)/sitemap.js`

**Interfaces:**
- Consumes: Task 1 page id `nano-banana-gallery`, canonical path `/nano-banana-gallery`, PV category `rich-page`, and engagement content key prefix `rich-page:`.
- Produces: canonical page metadata/JSON-LD, redirect-only legacy route, and sitemap containing only the canonical rich-page URL.

- [ ] **Step 1: Add failing route and SEO tests**

Append to `scripts/test-nano-banana-rich-page-migration.mjs`:

```js
test('canonical page uses rich-page SEO analytics and engagement', async () => {
  const page = await read('app/(site)/nano-banana-gallery/page.jsx')
  assert.match(page, /createRichPageMetadata\('nano-banana-gallery'\)/)
  assert.match(page, /RichPageJsonLd pageId="nano-banana-gallery"/)
  assert.match(page, /ContentPvBeacon category="rich-page" slug=\{PAGE_SLUG\}/)
  assert.match(page, /ContentEngagement contentKey=\{`rich-page:\$\{PAGE_SLUG\}`\}/)
  assert.match(page, /href="\/rich-pages"/)
})

test('legacy resource URL is redirect-only', async () => {
  const legacy = await read('app/(site)/resources/nano-banana-gallery/page.jsx')
  assert.match(legacy, /permanentRedirect\('\/nano-banana-gallery'\)/)
  assert.doesNotMatch(legacy, /NanoBananaGallery cases=/)
})

test('SEO and sitemap expose only the canonical rich-page URL', async () => {
  const [seo, sitemap] = await Promise.all([
    read('lib/richPageSeo.js'),
    read('app/(site)/sitemap.js'),
  ])
  assert.match(seo, /'nano-banana-gallery': \{[\s\S]*schemaType: 'CollectionPage'/)
  assert.doesNotMatch(sitemap, /'\/resources\/nano-banana-gallery'/)
})
```

- [ ] **Step 2: Run only the new tests and verify RED**

Run: `node --test --test-name-pattern='canonical page|legacy resource URL|SEO and sitemap' scripts/test-nano-banana-rich-page-migration.mjs`

Expected: FAIL because the canonical page does not exist and the old page still renders the gallery.

- [ ] **Step 3: Move the page UI and create the canonical wrapper**

Move `NanoBananaGallery.jsx` unchanged into `app/(site)/nano-banana-gallery/`. Create the canonical `page.jsx` from the existing page body, with these integration changes:

```js
import { createRichPageMetadata } from '../../../lib/richPageSeo'
import RichPageJsonLd from '../components/RichPageJsonLd'

const PAGE_SLUG = 'nano-banana-gallery'

export const metadata = createRichPageMetadata(PAGE_SLUG)
```

Render `<RichPageJsonLd pageId="nano-banana-gallery" />` before the page container. Change both PV beacons to `category="rich-page"`, change the breadcrumb to `<Link href="/rich-pages">多维页面</Link>`, and change the engagement key to:

```jsx
<ContentEngagement contentKey={`rich-page:${PAGE_SLUG}`} width="standard" />
```

Replace the legacy page with:

```js
import { permanentRedirect } from 'next/navigation'

export const dynamic = 'force-static'

export default function NanoBananaGalleryRedirectPage() {
  permanentRedirect('/nano-banana-gallery')
}
```

- [ ] **Step 4: Add rich-page SEO overrides and clean the sitemap**

Add to `SEO_OVERRIDES`:

```js
'nano-banana-gallery': {
  metadataTitle: 'Awesome Nano Banana Images｜AI 图片案例与提示词库',
  description: '收录 141 个 Nano Banana 与 Nano Banana Pro 图片生成、图像编辑案例，支持搜索、查看输入输出对比与一键复制提示词。',
  ogDescription: '141 个 Nano Banana 图片案例，附输入输出对比与可复制提示词。',
  keywords: ['Nano Banana', 'Nano Banana Pro', 'AI 图片', '提示词', '图像编辑', 'Gemini', '案例库'],
  schemaType: 'CollectionPage',
  ogType: 'website',
},
```

Remove `'/resources/nano-banana-gallery'` from `staticRoutes` in `app/(site)/sitemap.js`. Do not add the new URL there because `listRichPageSitemapEntries()` already generates it from `ENGINEERING_WORKS`.

- [ ] **Step 5: Run all focused tests and verify GREEN**

Run: `npm run test:nano-banana-migration`

Expected: 5 tests pass, 0 fail.

- [ ] **Step 6: Commit the route migration**

```bash
git add scripts/test-nano-banana-rich-page-migration.mjs app/'(site)'/nano-banana-gallery app/'(site)'/resources/nano-banana-gallery lib/richPageSeo.js app/'(site)'/sitemap.js
git commit -m "feat: move nano banana gallery to rich pages"
```

### Task 3: Verify the complete migration

**Files:**
- Verify only; no production files should change unless a verification failure reveals a defect.

**Interfaces:**
- Consumes: the completed Task 1 and Task 2 implementation.
- Produces: fresh evidence that source contracts and the production Next.js build succeed.

- [ ] **Step 1: Run the focused regression suite**

Run: `npm run test:nano-banana-migration`

Expected: 5 tests pass, 0 fail.

- [ ] **Step 2: Check formatting and unintended changes**

Run: `git diff --check`

Expected: no output and exit code 0.

Run: `git status --short`

Expected: only the user's pre-existing admin SEO changes remain; no uncommitted Nano Banana migration files remain.

- [ ] **Step 3: Run a fresh production build**

Run: `npm run build:check`

Expected: exit code 0; Next.js lists `/nano-banana-gallery` and `/resources/nano-banana-gallery` without compilation or prerender errors.

- [ ] **Step 4: Inspect final commits and route diff**

Run: `git log -3 --oneline`

Expected: the design commit followed by the two implementation commits.

Run: `git show --stat --oneline HEAD~1..HEAD`

Expected: only the canonical/legacy route, SEO, sitemap, and focused test changes from Task 2.
