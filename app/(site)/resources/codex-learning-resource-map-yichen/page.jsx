import fs from 'node:fs'
import path from 'node:path'
import Link from 'next/link'

import ArticleFooterCta from '../../components/ArticleFooterCta'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import RanbiPaywall from '../../components/RanbiPaywall'
import SharePageButton from '../../components/SharePageButton'
import { renderMarkdown } from '../../../../lib/research/markdown'

export const dynamic = 'force-static'

const RESOURCE_SLUG = 'codex-learning-resource-map-yichen'
const RESOURCE_URL = `https://2aran.com/resources/${RESOURCE_SLUG}`
const RESOURCE_PATH = path.join(process.cwd(), 'resources', '2026-06-29-codex-learning-resource-map-yichen.md')

function parseFrontmatter(raw) {
  if (!raw.startsWith('---')) return { data: {}, content: raw }
  const end = raw.indexOf('\n---', 3)
  if (end === -1) return { data: {}, content: raw }
  const yaml = raw.slice(3, end).trim()
  const content = raw.slice(end + 4).replace(/^\r?\n/, '')
  const data = {}
  for (const line of yaml.split(/\r?\n/)) {
    const match = /^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/.exec(line)
    if (!match) continue
    let value = match[2].trim()
    if (!value) continue
    if (value.startsWith('[') && value.endsWith(']')) {
      data[match[1]] = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean)
      continue
    }
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    data[match[1]] = value
  }
  return { data, content }
}

function getResource() {
  const raw = fs.readFileSync(RESOURCE_PATH, 'utf8')
  const { data, content } = parseFrontmatter(raw)
  return {
    title: data.title || 'Codex 学习资源收集',
    summary: data.summary || '',
    date: data.date || '2026-06-29',
    tags: Array.isArray(data.tags) ? data.tags : [],
    html: renderMarkdown(content, {
      seed: RESOURCE_SLUG,
      title: data.title || 'Codex 学习资源收集',
    }),
  }
}

export function generateMetadata() {
  const resource = getResource()
  return {
    title: resource.title,
    description: resource.summary,
    keywords: ['涂阿燃', 'tuaran', 'Codex', '资源收集', ...resource.tags],
    alternates: {
      canonical: `/resources/${RESOURCE_SLUG}`,
    },
  }
}

export default function CodexLearningResourcePage() {
  const resource = getResource()

  return (
    <main className="mx-auto w-full max-w-[1120px] px-4 py-8">
      <header className="mb-8 border-b border-[#eee] pb-5 dark:border-gray-800">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#777] dark:text-gray-400">
          <Link href="/articles?tab=resources" className="underline underline-offset-4 opacity-80 hover:opacity-100">
            资源库
          </Link>
          <span aria-hidden="true">·</span>
          <span>资源收集</span>
          <span aria-hidden="true">·</span>
          <time dateTime={resource.date}>{resource.date}</time>
          <span aria-hidden="true">·</span>
          <ContentPvBeacon category="resource" slug={RESOURCE_SLUG} display />
        </div>
        <h1 className="mt-3 font-serif text-2xl font-semibold tracking-wide text-[#222] dark:text-gray-100 md:text-3xl">
          {resource.title}
        </h1>
        {resource.summary ? (
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#666] dark:text-gray-300">
            {resource.summary}
          </p>
        ) : null}
        {resource.tags.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {resource.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[#dee0db] bg-white/70 px-2 py-0.5 text-[11px] text-[#666] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-4">
          <SharePageButton
            title={resource.title}
            text={resource.summary || 'Codex 学习资源收集：逸尘 X 链接帖归档'}
            url={RESOURCE_URL}
          />
        </div>
      </header>

      <RanbiPaywall resourceKey={`resource:${RESOURCE_SLUG}`} unitLabel="资源">
        <article className="prose-tuaran" dangerouslySetInnerHTML={{ __html: resource.html }} />
      </RanbiPaywall>
      <ArticleFooterCta />
    </main>
  )
}
