import Link from 'next/link'
import PageContainer from '../../../components/PageContainer'
import DocsToc from '../../../resources/x-reply-clipboard-extension/docs/DocsToc'
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
      <nav aria-label="面包屑" className="flex gap-2 text-xs text-[var(--site-muted)]"><Link href="/tools">工具库</Link><span>/</span><Link href="/tools/syncblog-publisher">AI 分发大师</Link><span>/ 文档中心</span></nav>
      <header className="mb-8 mt-5 max-w-3xl">
        <p className="font-mono text-xs text-[var(--site-faint)]">AI 分发大师 · v{docs.version} · 更新于 {docs.updated}</p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--site-ink)]">文档中心</h1>
        <p className="mt-3 leading-7 text-[var(--site-muted)]">{docs.description}</p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm"><Link href="/tools/syncblog-publisher" className="rounded-full border border-[var(--site-line)] px-4 py-2">返回插件介绍</Link><a href="#quick-start" className="rounded-full border border-[var(--site-line)] px-4 py-2">快速开始</a><a href="#xiaohongshu-manager" className="rounded-full border border-[var(--site-line)] px-4 py-2">笔记管理规则</a></div>
      </header>
      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
        <aside className="lg:sticky lg:top-[calc(var(--site-header-height)+1.5rem)] lg:self-start"><DocsToc groups={toc} /></aside>
        <div className="min-w-0 space-y-4">
          {docs.groups.flatMap(group => group.sections).map((section, index) => (
            <details key={section.id} id={section.id} open={index === 0} className="group scroll-mt-24 rounded-2xl border border-[var(--site-line)] bg-[var(--site-panel)]">
              <summary className="cursor-pointer px-5 py-5 text-[var(--site-ink)]"><span className="mr-3 font-mono text-xs text-[var(--site-faint)]">{String(index + 1).padStart(2, '0')}</span><span className="font-semibold">{section.title}</span><span className="mt-2 block pl-7 text-sm text-[var(--site-muted)]">{section.summary}</span></summary>
              <div className="space-y-5 border-t border-[var(--site-line)] px-5 py-5 text-sm leading-7 text-[var(--site-ink)]">
                {section.steps && <ol className="list-decimal space-y-3 pl-5">{section.steps.map(step => <li key={step}>{step}</li>)}</ol>}
                {section.paragraphs?.map(text => <p key={text}>{text}</p>)}
                {section.table && <div className="overflow-x-auto rounded-xl border border-[var(--site-line)]"><table className="w-full min-w-[420px] text-left"><thead><tr>{section.table.headers.map(label => <th key={label} className="bg-[var(--site-panel-strong)] px-4 py-3">{label}</th>)}</tr></thead><tbody>{section.table.rows.map(row => <tr key={row[0]} className="border-t border-[var(--site-line)]">{row.map((cell, i) => <td key={i} className="px-4 py-3 align-top">{cell}</td>)}</tr>)}</tbody></table></div>}
              </div>
            </details>
          ))}
        </div>
      </div>
    </PageContainer>
  )
}
