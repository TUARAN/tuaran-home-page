import Link from 'next/link'
import { readRuntimeKnowledgeItems } from '../../../lib/content/knowledgeRuntime'
import { searchPublicEntries } from '../../../lib/site/publicSearch'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const metadata = { title: '站内搜索', robots: { index: false, follow: true } }

export default async function SearchPage({ searchParams }) {
  const { q } = await searchParams
  const query = String(Array.isArray(q) ? q[0] : q || '').trim().slice(0, 100)
  let items = []
  if (query) {
    try { items = await readRuntimeKnowledgeItems() } catch { /* Keep page links searchable if content is unavailable. */ }
  }
  const results = searchPublicEntries(query, items)
  const pages = results.filter((item) => item.kind === 'page')
  const content = results.filter((item) => item.kind === 'content')

  return <main className="mx-auto w-full max-w-[960px] px-4 py-8 md:py-12">
    <h1 className="mb-2 text-2xl font-semibold text-[var(--site-ink)]">站内搜索</h1>
    <form action="/search" role="search" className="mb-7 flex gap-2">
      <label className="sr-only" htmlFor="site-search-page-input">搜索页面和内容</label>
      <input id="site-search-page-input" type="search" name="q" defaultValue={query} maxLength={100} placeholder="搜索页面、文章、调研、资源" className="min-w-0 flex-1 rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] px-4 py-3 text-[var(--site-ink)] outline-none focus:border-[var(--site-accent)]" />
      <button type="submit" className="rounded-xl bg-[var(--site-accent-strong)] px-5 py-3 font-medium text-white">搜索</button>
    </form>
    {query ? <p className="mb-6 text-sm text-[var(--site-muted)]">“{query}” {results.length === 100 ? '显示前 100 个结果' : `找到 ${results.length} 个结果`}</p> : <p className="text-[var(--site-muted)]">输入关键词查找公开页面和内容。</p>}
    {query && !results.length ? <p className="rounded-xl border border-[var(--site-line)] p-5 text-[var(--site-muted)]">暂无匹配结果。试试更短的关键词，或前往 <Link href="/articles">内容目录</Link> 浏览。</p> : null}
    {[['页面', pages], ['内容', content]].map(([label, entries]) => entries.length ? <section key={label} className="mb-8">
      <h2 className="mb-3 text-lg font-semibold text-[var(--site-ink)]">{label} <span className="text-sm font-normal text-[var(--site-muted)]">{entries.length}</span></h2>
      <ul className="space-y-2">{entries.map((item) => <li key={`${item.kind}:${item.href}`}>
        <Link href={item.href} className="block rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] px-4 py-3 no-underline transition hover:border-[var(--site-accent)] hover:no-underline">
          <span className="block font-medium text-[var(--site-ink)]">{item.title}</span>
          {item.summary ? <span className="mt-1 block line-clamp-2 text-sm text-[var(--site-muted)]">{item.summary}</span> : null}
        </Link>
      </li>)}</ul>
    </section> : null)}
  </main>
}
