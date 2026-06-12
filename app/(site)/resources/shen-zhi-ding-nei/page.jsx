import Link from 'next/link'

import SharePageButton from '../../components/SharePageButton'
import { getResourceDocument, loadResourceMarkdown } from '../../../../lib/resourceDocuments'
import { buildShenZhiDingNeiArticle } from '../../../../lib/resourceMarkdown'
import ResourceLongformReader from './ResourceLongformReader'

export const dynamic = 'force-static'

const doc = getResourceDocument('shen-zhi-ding-nei')
const rawMarkdown = loadResourceMarkdown('shen-zhi-ding-nei')
const article = rawMarkdown ? buildShenZhiDingNeiArticle(rawMarkdown) : null

export const metadata = {
  title: '置身钉内全文原文：钉钉 ONE 项目离职复盘长文',
  description:
    '《置身钉内》全文原文存档：滕雅辛（幽素）2026 年阿里内网流传的钉钉 ONE 项目 7.5 万字复盘，含发心、定位、设计、用户、敏捷、秩序、军争、长期八卷；配套职场观察调研。',
  keywords: [
    '置身钉内',
    '置身钉内全文',
    '置身钉内原文',
    '钉钉',
    'ONE',
    '滕雅辛',
    '幽素',
    '职场',
    '组织观察',
    'B端AI',
    '离职复盘',
    '涂阿燃',
    'tuaran',
  ],
  alternates: {
    canonical: '/resources/shen-zhi-ding-nei',
  },
  openGraph: {
    title: '置身钉内全文原文：钉钉 ONE 项目离职复盘长文',
    description: doc.summary,
    url: 'https://2aran.com/resources/shen-zhi-ding-nei',
    type: 'article',
  },
  robots: {
    index: true,
    follow: true,
  },
}

const THINKING_POINTS = [
  '付费决策者是管理者、日常承受者是普通员工——协作工具的产品选择，往往先回答「谁需要确定性」，而不是「谁用得最多」。',
  'ONE 的挫败不只在模型能力：当 AI 把消息高亮、待办汇总、留白填补全部自动化，员工失去的「缓冲地带」可能比旧版钉钉更刺。',
  'B 端 AI 的常见敌人不是技术栈，而是组织节奏——「一小时内反馈、二十四小时内交付」会把产品迭代绑死在发信人一侧的焦虑上。',
  '长文的价值在「看产品的方式」：不问功能好不好，而问这个功能在权力结构里服务于谁、代价由谁承担。',
]

export default function ShenZhiDingNeiResourcePage() {
  const url = 'https://2aran.com/resources/shen-zhi-ding-nei'

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 py-12">
      <header className="mb-8 border-b border-[#eee] dark:border-gray-800 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs tracking-[0.14em] text-[#888] dark:text-gray-500">资料库 · 职场</p>
            <h1 className="mt-2 font-serif text-2xl md:text-3xl font-semibold tracking-wide text-[#222] dark:text-gray-100">
              {doc.pageTitle}
            </h1>
            <p className="mt-2 text-sm text-[#666] dark:text-gray-300">{doc.subtitle}</p>
            <p className="mt-3 text-sm leading-relaxed text-[#555] dark:text-gray-400">{doc.summary}</p>
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#888] dark:text-gray-500">
              <span>作者 {doc.author}</span>
              <span aria-hidden="true">·</span>
              <span>首发 {doc.date}</span>
              <span aria-hidden="true">·</span>
              <span>{doc.wordCount}</span>
            </div>
          </div>
          <SharePageButton title={doc.pageTitle} text={doc.summary} url={url} />
        </div>
      </header>

      <section className="mb-10 rounded-xl border border-[#e8e8e2] bg-[#f8f8f4] p-5 dark:border-[#2a2d24] dark:bg-[#141612]">
        <h2 className="text-sm font-semibold text-[#333] dark:text-gray-200">总结思考</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#666] dark:text-gray-300">
          以下为读完全文后的提炼，不构成对任何个人或组织的判决。更完整的观察框架见
          <Link href={doc.researchHref} className="mx-1 underline underline-offset-4">
            《置身钉内》职场调研
          </Link>
          。
        </p>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-[#444] dark:text-gray-300">
          {THINKING_POINTS.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-[#999] dark:text-gray-500">
          文本来源：
          <a href={doc.gistUrl} target="_blank" rel="noopener noreferrer" className="ml-1 underline underline-offset-4">
            GitHub Gist 公开版
          </a>
          ，本站整理存档便于检索与阅读。
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-[#222] dark:text-gray-100">置身钉内 · 全文原文</h2>
        {article?.html ? (
          <ResourceLongformReader toc={article.toc} html={article.html} />
        ) : (
          <div className="rounded-xl border border-dashed border-[#ccc] bg-[#fafaf8] p-6 text-sm leading-relaxed text-[#666] dark:border-[#3a3a32] dark:bg-[#121410] dark:text-gray-300">
            <p>原文文件暂未就绪。可先阅读 Gist 公开版，或查看配套调研。</p>
            <p className="mt-3">
              <a href={doc.gistUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                打开 Gist 全文
              </a>
              {' · '}
              <Link href={doc.researchHref} className="underline underline-offset-4">
                配套调研
              </Link>
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
