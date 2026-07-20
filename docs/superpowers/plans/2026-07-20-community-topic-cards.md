# Community Topic Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the six heavy community topic cards with three compact entries for X, 小红书, and 掘金.

**Architecture:** Keep the complete `COMMUNITY_TOPICS` registry unchanged because circle detail pages consume it. Export a discussion-page subset from the registry, render that subset with a simplified card component, and use responsive utility classes for one-column mobile and three-column desktop layout.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS utilities, Node.js built-in test runner

## Global Constraints

- The discussion page shows only X, 小红书, and 掘金 topic entries.
- Visible titles are exactly `X`, `小红书`, and `掘金`.
- Each entry has one short Chinese description.
- English eyebrows, status badges, and the “进入专题” footer are removed from these cards.
- Existing topic detail URLs remain unchanged.
- Desktop uses three equal columns; mobile uses one column.

---

### Task 1: Simplify the discussion-page topic entries

**Files:**
- Create: `scripts/test-community-topic-cards.mjs`
- Modify: `lib/communityTopics.js`
- Modify: `app/(site)/community/DiscussionHubClient.jsx:6,149-168,296-309`
- Modify: `app/globals.css:2578-2593`

**Interfaces:**
- Consumes: `COMMUNITY_TOPICS: Array<CommunityTopic>` and existing `topic.href` values.
- Produces: `DISCUSSION_COMMUNITY_TOPICS: Array<CommunityTopic & { shortLabel: string, shortDesc: string }>` for the discussion page.

- [x] **Step 1: Write the failing source-contract test**

Create `scripts/test-community-topic-cards.mjs`:

```js
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const componentSource = await readFile(
  new URL('../app/(site)/community/DiscussionHubClient.jsx', import.meta.url),
  'utf8',
)
const registrySource = await readFile(
  new URL('../lib/communityTopics.js', import.meta.url),
  'utf8',
)

test('discussion topic subset contains only the three requested platforms', () => {
  assert.match(registrySource, /export const DISCUSSION_COMMUNITY_TOPICS/)
  assert.match(registrySource, /shortLabel: 'X', shortDesc: '真实互动，一起增长。'/)
  assert.match(registrySource, /shortLabel: '小红书', shortDesc: '选题、标题与封面互评。'/)
  assert.match(registrySource, /shortLabel: '掘金', shortDesc: '技术文章互审与共创。'/)
  assert.match(registrySource, /\.filter\(\(topic\) => DISCUSSION_TOPIC_COPY\[topic\.id\]\)/)
})

test('discussion cards use compact content and a responsive three-column grid', () => {
  assert.match(componentSource, /DISCUSSION_COMMUNITY_TOPICS\.map/)
  assert.match(componentSource, /topic\.shortLabel/)
  assert.match(componentSource, /topic\.shortDesc/)
  assert.match(componentSource, /md:grid-cols-3/)
  assert.doesNotMatch(componentSource, /discussion-topic-tag/)
  assert.doesNotMatch(componentSource, /进入专题/)
})
```

- [x] **Step 2: Run the test to verify it fails**

Run: `node --test scripts/test-community-topic-cards.mjs`

Expected: FAIL because `DISCUSSION_COMMUNITY_TOPICS` is not exported.

- [x] **Step 3: Add the page-specific subset and compact copy**

Append to `lib/communityTopics.js` after `COMMUNITY_TOPICS`:

```js
const DISCUSSION_TOPIC_COPY = {
  'x-mutual-aid-circle': { shortLabel: 'X', shortDesc: '真实互动，一起增长。' },
  'xiaohongshu-creator-circle': { shortLabel: '小红书', shortDesc: '选题、标题与封面互评。' },
  'juejin-creator-circle': { shortLabel: '掘金', shortDesc: '技术文章互审与共创。' },
}

export const DISCUSSION_COMMUNITY_TOPICS = COMMUNITY_TOPICS
  .filter((topic) => DISCUSSION_TOPIC_COPY[topic.id])
  .map((topic) => ({ ...topic, ...DISCUSSION_TOPIC_COPY[topic.id] }))
```

- [x] **Step 4: Simplify the component markup and layout**

In `app/(site)/community/DiscussionHubClient.jsx`, import `DISCUSSION_COMMUNITY_TOPICS` instead of `COMMUNITY_TOPICS`. Replace `TopicCircleCard` with:

```jsx
function TopicCircleCard({ topic }) {
  return (
    <Link href={topic.href} className="discussion-topic-card no-underline hover:no-underline">
      <h3 className="mb-0 border-0 p-0 text-base font-semibold text-[var(--site-ink)]">
        {topic.shortLabel}
      </h3>
      <p className="mb-0 mt-1.5 text-sm leading-5 text-[var(--site-muted)]">
        {topic.shortDesc}
      </p>
    </Link>
  )
}
```

Change the section description to `三个平台，找到同路创作者。` and render:

```jsx
<div className="grid gap-3 md:grid-cols-3">
  {DISCUSSION_COMMUNITY_TOPICS.map((topic) => (
    <TopicCircleCard key={topic.id} topic={topic} />
  ))}
</div>
```

- [x] **Step 5: Tighten the card style**

In `app/globals.css`, update `.discussion-topic-card` and remove the unused `.discussion-topic-tag` block:

```css
.discussion-topic-card {
  display: block;
  min-width: 0;
  border-radius: 0.5rem;
  padding: 0.875rem 1rem;
}
```

- [x] **Step 6: Run focused and project checks**

Run: `node --test scripts/test-community-topic-cards.mjs`

Expected: 2 tests pass.

Run: `npm run style:check`

Expected: Tailwind opacity check passes.

Run: `npm run build:check`

Expected: Next.js build succeeds with no new errors.

- [x] **Step 7: Commit the focused change**

```bash
git add scripts/test-community-topic-cards.mjs lib/communityTopics.js 'app/(site)/community/DiscussionHubClient.jsx' app/globals.css docs/superpowers/plans/2026-07-20-community-topic-cards.md
git commit -m "feat: simplify community topic cards"
```
