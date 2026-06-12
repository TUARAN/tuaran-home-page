import Link from 'next/link'

import SharePageButton from '../../components/SharePageButton'
import { getResourceDocument, loadResourceMarkdown } from '../../../../lib/resourceDocuments'
import { buildShenZhiDingNeiArticle, buildShenZhiDingWaiArticle } from '../../../../lib/resourceMarkdown'
import ResourceArticleSwitcher from './ResourceArticleSwitcher'

export const dynamic = 'force-static'

const docNei = getResourceDocument('shen-zhi-ding-nei')
const docWai = getResourceDocument('shen-zhi-ding-wai')

const rawNei = loadResourceMarkdown('shen-zhi-ding-nei')
const rawWai = loadResourceMarkdown('shen-zhi-ding-wai')

const articleNei = rawNei ? buildShenZhiDingNeiArticle(rawNei) : null
const articleWai = rawWai ? buildShenZhiDingWaiArticle(rawWai) : null

export const metadata = {
  title: '《置身钉内》《置身钉外》全文原文：钉钉离职长文双篇存档',
  description:
    '《置身钉内》与《置身钉外》全文原文存档，可切换阅读：滕雅辛（幽素）7.5 万字钉钉 ONE 项目复盘，与钉钉副总裁马锐拉的离职回应长文；配套职场观察调研。',
  keywords: [
    '《置身钉内》',
    '《置身钉内》全文',
    '《置身钉内》原文',
    '置身钉内',
    '《置身钉外》',
    '《置身钉外》全文',
    '《置身钉外》原文',
    '置身钉外',
    '马锐拉',
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
    title: '《置身钉内》《置身钉外》全文原文：钉钉离职长文双篇存档',
    description: docNei.summary,
    url: 'https://2aran.com/resources/shen-zhi-ding-nei',
    type: 'article',
  },
  robots: {
    index: true,
    follow: true,
  },
}

const NEI_POINTS = [
  '付费决策者是管理者、日常承受者是普通员工——协作工具的产品选择，往往先回答「谁需要确定性」，而不是「谁用得最多」。',
  'ONE 的挫败不只在模型能力：当 AI 把消息高亮、待办汇总、留白填补全部自动化，员工失去的「缓冲地带」可能比旧版钉钉更刺。',
  'B 端 AI 的常见敌人不是技术栈，而是组织节奏——「一小时内反馈、二十四小时内交付」会把产品迭代绑死在发信人一侧的焦虑上。',
  '长文的价值在「看产品的方式」：不问功能好不好，而问这个功能在权力结构里服务于谁、代价由谁承担。',
]

const WAI_POINTS = [
  '《置身钉内》写的是身处系统之内的承受者视角；《置身钉外》补上了另一侧——一位副总裁同样被节奏裹挟，「越来越难确认自己是在创造产品，还是只是在消耗身体追赶一个不断前移的节奏」。',
  '两篇对读的价值：高压节奏不是某一层级对另一层级的单向施加，管理者也在为同一套时钟付出健康与判断力。',
  '作者没有把离开写成控诉，文末仍祝福钉钉——情绪克制反而让「我真的想多活几年」更有分量。',
]

export default function ShenZhiDingNeiResourcePage() {
  const url = 'https://2aran.com/resources/shen-zhi-ding-nei'

  const articles = [
    articleNei
      ? {
          key: 'ding-nei',
          tabLabel: '《置身钉内》',
          title: docNei.title,
          author: docNei.author,
          date: docNei.date,
          wordCount: docNei.wordCount,
          intro:
            '以下为读完全文后的提炼，不构成对任何个人或组织的判决。',
          points: NEI_POINTS,
          sourceLabel: 'GitHub Gist 公开版',
          sourceUrl: docNei.gistUrl,
          researchHref: docNei.researchHref,
          toc: articleNei.toc,
          html: articleNei.html,
        }
      : null,
    articleWai
      ? {
          key: 'ding-wai',
          tabLabel: '《置身钉外》',
          title: docWai.title,
          author: docWai.author,
          date: docWai.date,
          wordCount: docWai.wordCount,
          intro:
            '《置身钉内》刷屏后，已离职的钉钉副总裁马锐拉在个人公众号发布的回应长文。以下提炼同样只是阅读观察。',
          points: WAI_POINTS,
          sourceLabel: docWai.sourceLabel,
          sourceUrl: docWai.sourceUrl,
          researchHref: docWai.researchHref,
          toc: articleWai.toc,
          html: articleWai.html,
        }
      : null,
  ].filter(Boolean)

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 py-12">
      <header className="mb-8 border-b border-[#eee] dark:border-gray-800 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs tracking-[0.14em] text-[#888] dark:text-gray-500">资料库 · 职场</p>
            <h1 className="mt-2 font-serif text-2xl md:text-3xl font-semibold tracking-wide text-[#222] dark:text-gray-100">
              《置身钉内》×《置身钉外》：钉钉离职长文双篇存档
            </h1>
            <p className="mt-2 text-sm text-[#666] dark:text-gray-300">
              {docNei.subtitle} ｜ {docWai.subtitle}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#555] dark:text-gray-400">
              员工视角的《置身钉内》（滕雅辛 7.5 万字 ONE 项目复盘）与管理者视角的《置身钉外》（钉钉副总裁马锐拉离职回应），同一事件的两侧记录，可切换对照阅读。更完整的观察框架见
              <Link href={docNei.researchHref} className="mx-1 underline underline-offset-4">
                《置身钉内》职场调研
              </Link>
              。
            </p>
          </div>
          <SharePageButton
            title="《置身钉内》×《置身钉外》全文原文存档"
            text={docNei.summary}
            url={url}
          />
        </div>
      </header>

      {articles.length ? (
        <ResourceArticleSwitcher articles={articles} />
      ) : (
        <div className="rounded-xl border border-dashed border-[#ccc] bg-[#fafaf8] p-6 text-sm leading-relaxed text-[#666] dark:border-[#3a3a32] dark:bg-[#121410] dark:text-gray-300">
          <p>原文文件暂未就绪。可先阅读 Gist 公开版，或查看配套调研。</p>
          <p className="mt-3">
            <a href={docNei.gistUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
              打开 Gist 全文
            </a>
            {' · '}
            <Link href={docNei.researchHref} className="underline underline-offset-4">
              配套调研
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}
