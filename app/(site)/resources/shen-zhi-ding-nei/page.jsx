import Link from 'next/link'
import RanbiPaywall from '../../components/RanbiPaywall'
import ContentPvBeacon from '../../components/ContentPvBeacon'

import SharePageButton from '../../components/SharePageButton'
import PageContainer from '../../components/PageContainer'
import { getResourceDocument, loadResourceMarkdown } from '../../../../lib/resourceDocuments'
import {
  buildShenZhiDingNeiArticle,
  buildShenZhiDingWaiArticle,
  buildShenZhiDouNeiArticle,
  buildShenZhiMiNeiArticle,
  buildShenZhiTuanNeiArticle,
} from '../../../../lib/resourceMarkdown'
import ResourceArticleSwitcher from './ResourceArticleSwitcher'

export const dynamic = 'force-static'

const docNei = getResourceDocument('shen-zhi-ding-nei')
const docWai = getResourceDocument('shen-zhi-ding-wai')
const docTuan = getResourceDocument('shen-zhi-tuan-nei')
const docMi = getResourceDocument('shen-zhi-mi-nei')
const docDou = getResourceDocument('shen-zhi-dou-nei')

const rawNei = loadResourceMarkdown('shen-zhi-ding-nei')
const rawWai = loadResourceMarkdown('shen-zhi-ding-wai')
const rawTuan = loadResourceMarkdown('shen-zhi-tuan-nei')
const rawMi = loadResourceMarkdown('shen-zhi-mi-nei')
const rawDou = loadResourceMarkdown('shen-zhi-dou-nei')

const articleNei = rawNei ? buildShenZhiDingNeiArticle(rawNei) : null
const articleWai = rawWai ? buildShenZhiDingWaiArticle(rawWai) : null
const articleTuan = rawTuan ? buildShenZhiTuanNeiArticle(rawTuan) : null
const articleMi = rawMi ? buildShenZhiMiNeiArticle(rawMi) : null
const articleDou = rawDou ? buildShenZhiDouNeiArticle(rawDou) : null

export const metadata = {
  title: '置身 X 内：大厂职场文本存档合集（钉内·钉外·团内·米内·抖内）',
  description:
    '「置身 X 内」系列大厂职场文本存档合集，可切换阅读：钉钉《置身钉内》×《置身钉外》、美团《置身团内》、小米《置身米内》OCR 文字版，以及字节《置身 dou 内 / 抖内》短帖；各篇配套职场观察调研。',
  keywords: [
    '置身X内',
    '置身x内',
    '大厂离职长文',
    '大厂职场长文',
    '《置身钉内》',
    '《置身钉内》全文',
    '置身钉内',
    '《置身钉外》',
    '置身钉外',
    '马锐拉',
    '钉钉',
    'ONE',
    '滕雅辛',
    '幽素',
    '《置身团内》',
    '置身团内',
    '美团',
    '美团到餐',
    '《置身米内》',
    '置身米内',
    '小米',
    '雷军',
    '《置身dou内》',
    '置身dou内',
    '《置身抖内》',
    '置身抖内',
    '字节跳动',
    '抖音',
    'AI CLI',
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
    title: '置身 X 内：大厂职场文本存档合集（钉内·钉外·团内·米内·抖内）',
    description:
      '钉钉《置身钉内》×《置身钉外》、美团《置身团内》、小米《置身米内》、字节《置身 dou 内 / 抖内》——可切换对照阅读并附配套调研。',
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

const TUAN_POINTS = [
  '《置身团内》把美团的组织问题从「执行力强」反过来追问：强执行是否正在遮蔽一线重新定义问题的能力。',
  '作者描述的到餐 PM 更像「拆解上级意图」的执行者而非问题定义者——长期如此，沉淀的是组织生存技巧，不是可迁移的产品判断力。',
  '「有数据」不等于「数据资产化」：拥有本地生活交易数据，与一线能否用它回答供给与用户预期，是两件事。',
  '相比单点人事归因，长文更像在提醒一种路径依赖：曾帮公司打赢的低成本、强管控机制，换到新竞争周期可能变成惯性。',
]

const MI_POINTS = [
  '《置身米内》的火力不在某款产品好坏，而在「爆款是否过度绑定创始人亲自操盘」这一结构问题。',
  '雷军被类比为项羽：亲自抓的产品线易出爆款，放手的易遇瓶颈——优势与「难长出二号人物」是同一枚硬币的两面。',
  '作者把「高强度节奏 + 薪酬被指偏低」与校招人才流失挂钩，并在原文中举出 16k vs 26k 的校招薪酬对比。',
  '低端起步、短期见效，但「低端转高端」被放回组织能力与人才结构语境讨论，而非单纯营销定价问题。',
]

const DOU_POINTS = [
  '《置身 dou 内 / 抖内》不是长文，而是一条脉脉短帖：工期大于 5 的需求要被 review，小于等于 3 的需求强制用内部 AI CLI。',
  '评论区的第一反应是「所有需求排 4 天」和「化整为零」——阈值管理很容易把效率目标变成绕规则游戏。',
  '这条短帖最像古德哈特定律案例：当工期数字和 AI 工具使用率成为目标，它们就不再天然代表真实质量。',
  '放进「置身 X 内」系列看，它补上的不是又一篇离职长文，而是 AI 转型期大厂工具推广和管理审查的微型切片。',
]

function ShenZhiXNeiResourceContent() {
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
          intro: '以下为读完全文后的提炼，不构成对任何个人或组织的判决。',
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
    articleTuan
      ? {
          key: 'tuan-nei',
          tabLabel: '《置身团内》',
          title: docTuan.title,
          author: docTuan.author,
          date: docTuan.date,
          wordCount: docTuan.wordCount,
          intro: '以下为读完公开文字版后的提炼，不构成对美团或任何个人的判决。',
          points: TUAN_POINTS,
          sourceLabel: docTuan.sourceLabel,
          sourceUrl: docTuan.sourceUrl,
          researchHref: docTuan.researchHref,
          toc: articleTuan.toc,
          html: articleTuan.html,
        }
      : null,
    docMi
      ? {
          key: 'mi-nei',
          tabLabel: '《置身米内》',
          title: docMi.title,
          author: docMi.author,
          date: docMi.date,
          wordCount: docMi.wordCount,
          intro: '以下为用户提供长图的 OCR 文字版，个别字句按上下文做明显错字校正；不构成对小米或任何个人的判决。',
          points: MI_POINTS,
          sourceLabel: docMi.sourceLabel,
          sourceUrl: docMi.sourceUrl,
          researchHref: docMi.researchHref,
          toc: articleMi?.toc || [],
          html: articleMi?.html || null,
        }
      : null,
    articleDou
      ? {
          key: 'dou-nei',
          tabLabel: '《置身抖内》',
          title: docDou.title,
          author: docDou.author,
          date: docDou.date,
          wordCount: docDou.wordCount,
          intro: '这是一条脉脉短帖与评论区摘录，以下为外部阅读提炼，不构成对字节、抖音或任何个人的判决。',
          points: DOU_POINTS,
          sourceLabel: docDou.sourceLabel,
          sourceUrl: docDou.sourceUrl,
          researchHref: docDou.researchHref,
          toc: articleDou.toc,
          html: articleDou.html,
        }
      : null,
  ].filter(Boolean)

  return (
    <PageContainer className="py-12">
      <header className="mb-8 border-b border-[#eee] dark:border-gray-800 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs tracking-[0.14em] text-[#888] dark:text-gray-500">
              资源库 · 职场资料
              <span className="ml-1.5 tracking-normal text-[#aaa] dark:text-gray-500">
                · <ContentPvBeacon category="resource" slug="shen-zhi-ding-nei" display />
              </span>
            </p>
            <h1 className="mt-2 font-serif text-2xl md:text-3xl font-semibold tracking-wide text-[#222] dark:text-gray-100">
              置身 X 内：大厂职场文本存档合集
            </h1>
            <p className="mt-2 text-sm text-[#666] dark:text-gray-300">
              钉钉《置身钉内》×《置身钉外》 ｜ 美团《置身团内》 ｜ 小米《置身米内》 ｜ 字节《置身抖内》
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#555] dark:text-gray-400">
              「置身 X 内」是 2026 年 6 月起一批大厂员工借用兰小欢《置身事内》命名格式写下的职场文本。本页按标签切换对照阅读：钉钉、美团、小米三篇有文字版全文或 OCR 存档，字节《置身抖内》为脉脉短帖与评论摘录。每篇均配套
              <Link href={docNei.researchHref} className="mx-1 underline underline-offset-4">
                职场观察调研
              </Link>
              。
            </p>
          </div>
          <SharePageButton
            title="置身 X 内：大厂职场文本存档合集（钉内·钉外·团内·米内·抖内）"
            text="钉钉《置身钉内》×《置身钉外》、美团《置身团内》、小米《置身米内》、字节《置身抖内》——大厂职场文本存档合集。"
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
    </PageContainer>
  )
}

export default function ShenZhiXNeiResourcePage() {
  return (
    <>
      <RanbiPaywall resourceKey="resource:shen-zhi-ding-nei" unitLabel="资料">
        <ShenZhiXNeiResourceContent />
      </RanbiPaywall>
    </>
  )
}
