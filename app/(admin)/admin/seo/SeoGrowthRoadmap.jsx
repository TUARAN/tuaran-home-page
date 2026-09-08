import roadmap from '../../../../ai-context/seo-geo-growth-roadmap.md?raw'
import { renderMarkdown } from '../../../../lib/research/markdown'
import { Section, StatusPill } from '../../components/ui'

// 文档是唯一正本；这里只提取目录与完成数，不维护平行任务注册表。
const sections = roadmap.split(/^## /m).slice(1).map((section) => {
  const newline = section.indexOf('\n')
  return { title: section.slice(0, newline).trim(), body: section.slice(newline + 1) }
})
const tasks = [...roadmap.matchAll(/^- \[([ xX])\] \*\*([ABC]\d+)｜/gm)]
const completed = tasks.filter((task) => task[1].toLowerCase() === 'x').length

// 仓库相对链接不是站内路由；在后台标明为仓库文档，避免产生无效跳转。
function documentHtml(markdown) {
  const withRepositoryReferences = markdown.replace(
    /\[([^\]]+)\]\(((?:\.\.\/)?[\w-]+\.md)\)/g,
    '$1（仓库文档：`$2`）',
  )
  return renderMarkdown(withRepositoryReferences)
}

export default function SeoGrowthRoadmap() {
  return (
    <div id="growth-roadmap" className="mb-5 scroll-mt-24">
      <Section
        title="SEO / GEO 审计与改造路线图"
        description="GPT6-Astra 分析与改造 · 2026-09-08 审计基线 · 仅站长可见"
        actions={<StatusPill tone="info" size="sm">{completed}/{tasks.length} 项完成</StatusPill>}
      >
        <p className="mb-3 text-sm leading-7 text-[#55574f] dark:text-gray-300">
          围绕搜索发现、AI 引用、连续阅读与回访，记录已确认问题、待验证项和改造验收标准。
          任务进度以归档文档为准，页面接入不计作 SEO 改造完成。
        </p>
        <div className="space-y-2">
          {sections.map((section, index) => (
            <details
              key={section.title}
              open={section.title.startsWith('6.')}
              className="rounded-lg border border-[#e2e3da] dark:border-[#243040]"
            >
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[#15140f] focus-visible:outline focus-visible:outline-2 dark:text-gray-100">
                {section.title}
              </summary>
              <div
                className="prose prose-sm max-w-none overflow-x-auto border-t border-[#e2e3da] px-4 py-3 dark:prose-invert dark:border-[#243040] [&_table]:min-w-[640px]"
                dangerouslySetInnerHTML={{ __html: documentHtml(section.body) }}
                data-roadmap-section={index + 1}
              />
            </details>
          ))}
        </div>
        <p className="mb-0 mt-3 break-all text-xs leading-6 text-[#67695d] dark:text-gray-400">
          记录来源：ai-context/seo-geo-growth-roadmap.md。更新文档后随部署同步；勾选框仅展示记录状态。
        </p>
      </Section>
    </div>
  )
}
