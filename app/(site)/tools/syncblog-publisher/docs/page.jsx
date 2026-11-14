import Link from 'next/link'
import BookIdentity from '../../../components/book-reader/BookIdentity'
import PageContainer from '../../../components/PageContainer'
import BookToc from '../../../components/book-reader/BookToc'
import DocsHashNavigation from '../../../resources/x-reply-clipboard-extension/docs/DocsHashNavigation'
import { SYNCBLOG_DOCS as docs, SYNCBLOG_DOCS_TOC as toc } from '../../../../../lib/content/syncblogDocs.mjs'

export const dynamic = 'force-static'
export const metadata = {
  title: docs.title,
  description: docs.description,
  alternates: { canonical: '/tools/syncblog-publisher/docs' },
}
export default function SyncblogDocsPage() {
  return (
    <PageContainer className="pb-16 pt-5 md:pb-24 md:pt-8">
      <DocsHashNavigation />
      <nav aria-label="面包屑" className="flex gap-2 text-xs text-[var(--site-muted)]"><Link href="/tools">工具库</Link><span>/</span><Link href="/tools/syncblog-publisher">AI 分发大师</Link><span>/ 黄皮书</span></nav>
      <header className="mb-8 mt-5 max-w-3xl">
        <p className="font-mono text-xs text-[var(--site-faint)]">AI 分发大师 · v{docs.version} · 更新于 {docs.updated}</p>
        <BookIdentity kind="使用手册" />
        <h1 className="mt-3 text-3xl font-semibold text-[var(--site-ink)]">黄皮书</h1>
        <p className="mt-3 leading-7 text-[var(--site-muted)]">{docs.description}</p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm"><Link href="/tools/syncblog-publisher" className="rounded-full border border-[var(--site-line)] px-4 py-2">返回插件介绍</Link><a href="#quick-start" className="rounded-full border border-[var(--site-line)] px-4 py-2">快速开始</a><a href="#xiaohongshu-manager" className="rounded-full border border-[var(--site-line)] px-4 py-2">笔记管理规则</a></div>
      </header>
      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
        <aside className="lg:sticky lg:top-[calc(var(--site-header-height)+1.5rem)] lg:self-start"><BookToc groups={toc} title="目录" caption="按章查阅" /></aside>
        <article className="min-w-0 space-y-8">
          {docs.groups.flatMap(group => group.sections).map((section, index) => (
            <section key={section.id} id={section.id} className="scroll-mt-24 border-b border-[var(--site-line)] pb-9">
              <header className="mb-5 border-b border-[var(--site-line)] pb-4 text-[var(--site-ink)]"><span className="font-serif text-xs text-[var(--site-faint)]">第{index + 1}章</span><h2 className="mt-2 font-serif text-2xl font-semibold">{section.title}</h2><p className="mt-2 text-sm text-[var(--site-muted)]">{section.summary}</p></header>
              <div className="space-y-5 text-sm leading-8 text-[var(--site-ink)] [&>p]:max-w-[72ch]">
                {section.steps && <ol className="list-decimal space-y-3 pl-5">{section.steps.map(step => <li key={step}>{step}</li>)}</ol>}
                {section.paragraphs?.map(text => <p key={text}>{text}</p>)}
                {section.table && <div className="overflow-x-auto rounded-xl border border-[var(--site-line)]"><table className="w-full min-w-[420px] text-left"><thead><tr>{section.table.headers.map(label => <th key={label} className="bg-[var(--site-panel-strong)] px-4 py-3">{label}</th>)}</tr></thead><tbody>{section.table.rows.map(row => <tr key={row[0]} className="border-t border-[var(--site-line)]">{row.map((cell, i) => <td key={i} className="px-4 py-3 align-top">{cell}</td>)}</tr>)}</tbody></table></div>}
              </div>
            </section>
          ))}
        </article>
      </div>
    </PageContainer>
  )
}
