import Link from 'next/link'
import {
  IconArrowRight,
  IconChartDots3,
  IconClipboardSearch,
  IconLayoutDashboard,
  IconRouteAltLeft,
  IconSpeakerphone,
  IconSparkles,
} from '@tabler/icons-react'

import PageContainer from '../components/PageContainer'
import SharePageButton from '../components/SharePageButton'
import { ENGINEERING_WORK_CATEGORIES, ENGINEERING_WORKS } from '../../../lib/engineeringWorks'

export const dynamic = 'force-static'

const PAGE_URL = 'https://2aran.com/rich-pages'

export const metadata = {
  title: '多维页面 · 2aran.com',
  description:
    '涂阿燃的多维页面专页：把调研、宣发、内容展示和可交互工具做成同一个可阅读、可操作、可传播的页面系统。',
  alternates: {
    canonical: '/rich-pages',
  },
  openGraph: {
    type: 'website',
    siteName: '2aran.com',
    title: '多维页面',
    description: '过去、现在、未来：可交互调研、可交互宣发、可交互内容展示的页面方法论与案例库。',
    url: PAGE_URL,
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: '多维页面',
    description: '把调研、宣发和内容展示做成可交互页面系统。',
    creator: '@Anthony404',
    site: '@Anthony404',
  },
}

const TIME_LAYERS = [
  {
    title: '过去',
    subtitle: '把资料变成可复盘的结构',
    body: '一篇文章通常只能顺序阅读。多维页面先把资料、时间线、数据口径、人物关系和关键判断拆开，让读者可以回到证据本身。',
    points: ['来源归档', '时间线', '关系图谱', '版本记录'],
  },
  {
    title: '现在',
    subtitle: '把判断变成可操作的界面',
    body: '读者不只是看结论，还能筛选、对比、聚焦、复制、分享、下载或进入下一步行动。页面本身就是一个轻量产品。',
    points: ['筛选器', '对比视图', '行动入口', '分享组件'],
  },
  {
    title: '未来',
    subtitle: '把页面变成持续生长的系统',
    body: '一个多维页面发布后还可以继续接入新数据、新案例、新工具和新版本。它不是一次性稿件，而是长期资产。',
    points: ['数据更新', '用户回流', '案例沉淀', '商业转化'],
  },
]

const PLAYBOOK = [
  {
    title: '可交互的调研',
    icon: IconClipboardSearch,
    desc: '适合公司、行业、产品、人物和复杂事件。核心不是堆材料，而是让读者可以沿着自己的问题路径重新进入材料。',
    examples: ['证据卡片', '来源强度', '时间轴', '对照表'],
  },
  {
    title: '可交互的宣发',
    icon: IconSpeakerphone,
    desc: '适合 Skill、工具、社群、课程、开源项目和产品发布。把首屏叙事、可信样本、安装路径、反馈入口放在同一条链路里。',
    examples: ['30 秒 demo', '安装步骤', '传播素材', '回流指标'],
  },
  {
    title: '可交互的内容展示',
    icon: IconLayoutDashboard,
    desc: '适合富数据、榜单、地图、长期写作工程和知识库索引。让内容可以被筛选、比较、追踪，而不是只被滚动浏览。',
    examples: ['地图筛选', '排行榜', '焦点模式', '进度看板'],
  },
]

const PROCESS = [
  ['定义对象', '先说清楚页面服务谁、解决什么判断，避免做成漂亮但空泛的展示页。'],
  ['拆维度', '把内容拆成时间、空间、人物、指标、关系、状态、动作等可交互维度。'],
  ['做最小交互', '优先做筛选、对比、聚焦、分享、复制、跳转这些真正改变阅读路径的交互。'],
  ['补证据链', '把来源、口径、更新时间和不确定性放进页面，让读者知道结论从哪里来。'],
  ['设计回流', '宣发页要有安装、咨询、社群、订阅或反馈入口；调研页要能回到资料库。'],
]

function SectionTitle({ eyebrow, title, desc }) {
  return (
    <div className="mb-7 max-w-3xl">
      <p className="m-0 font-mono text-[10px] font-bold uppercase text-[#1f6f78] dark:text-[#76c6d0]">{eyebrow}</p>
      <h2 className="mt-2 font-serif text-2xl font-semibold text-[#181b18] dark:text-gray-100 md:text-3xl">{title}</h2>
      {desc ? <p className="mt-3 text-sm leading-7 text-[#59605a] dark:text-[#aab4c0]">{desc}</p> : null}
    </div>
  )
}

function categoryLabel(categoryId) {
  return ENGINEERING_WORK_CATEGORIES.find((category) => category.id === categoryId)?.title || '多维页面'
}

export default function RichPagesPage() {
  const featuredWorks = ENGINEERING_WORKS.slice(0, 6)

  return (
    <main className="min-h-screen bg-[#f2f3ec] text-[#181b18] dark:bg-[#0c1114] dark:text-gray-100">
      <PageContainer className="py-10 md:py-14">
        <header className="border-b border-[#d6d9c9] pb-10 dark:border-[#24313a]">
          <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-[#667063] dark:text-[#91a0a9]">
            <Link href="/articles" className="underline-offset-4 hover:underline">
              知识库
            </Link>
            <span>/</span>
            <span>多维页面</span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="mb-3 font-mono text-[11px] font-bold uppercase text-[#1f6f78] dark:text-[#76c6d0]">
                Rich Pages
              </p>
              <h1 className="max-w-4xl font-serif text-[36px] font-semibold leading-tight text-[#151812] md:text-[56px] dark:text-white">
                多维页面不是作品展厅。
                <span className="mt-2 block text-[#6b5228] dark:text-[#d8b772]">它是一种把内容做成系统的方法。</span>
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-[#4f5751] dark:text-[#b5c0c8]">
                普通文章解决表达，多维页面解决进入方式。它把过去的资料、现在的交互和未来的更新放在同一个页面里，
                让调研可以被验证，宣发可以被行动，内容展示可以被反复使用。
              </p>
            </div>

            <div className="border-l-4 border-[#1f6f78] bg-white/72 p-5 shadow-sm dark:border-[#76c6d0] dark:bg-[#121a20]">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1f6f78] text-white dark:bg-[#76c6d0] dark:text-[#071014]">
                  <IconSparkles size={20} aria-hidden="true" />
                </span>
                <div>
                  <p className="m-0 text-sm font-semibold text-[#20261f] dark:text-white">页面判断标准</p>
                  <p className="m-0 text-xs text-[#6c746c] dark:text-[#9aa8b0]">不是信息更多，而是路径更多。</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                {['可读', '可查', '可行动'].map((item) => (
                  <div key={item} className="border border-[#dde0d1] bg-[#f8f8f2] px-2 py-3 dark:border-[#2b3841] dark:bg-[#0f1519]">
                    <p className="m-0 text-sm font-bold text-[#1f6f78] dark:text-[#76c6d0]">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href="#cases"
                  className="inline-flex items-center gap-2 rounded-full bg-[#1f6f78] px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-[#185962] dark:bg-[#76c6d0] dark:text-[#071014] dark:hover:bg-[#9adbe2]"
                >
                  看案例 <IconArrowRight size={16} aria-hidden="true" />
                </Link>
                <SharePageButton title="多维页面" text="可交互调研、可交互宣发、可交互内容展示的方法论与案例库。" url={PAGE_URL} size="sm" />
              </div>
            </div>
          </div>
        </header>

        <section className="py-12">
          <SectionTitle
            eyebrow="Time Layers"
            title="过去、现在、未来放在同一张页面里"
            desc="多维页面的关键是时间结构：过去负责证据，现在负责操作，未来负责持续更新。"
          />
          <div className="grid gap-4 md:grid-cols-3">
            {TIME_LAYERS.map((layer) => (
              <article key={layer.title} className="border border-[#d6d9c9] bg-white p-5 dark:border-[#27343e] dark:bg-[#111920]">
                <p className="font-serif text-3xl font-semibold text-[#6b5228] dark:text-[#d8b772]">{layer.title}</p>
                <h3 className="mt-3 text-lg font-semibold text-[#171b17] dark:text-white">{layer.subtitle}</h3>
                <p className="mt-3 text-sm leading-7 text-[#59605a] dark:text-[#aab4c0]">{layer.body}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {layer.points.map((point) => (
                    <span key={point} className="rounded-full border border-[#d8ddcf] px-2.5 py-1 text-xs text-[#506052] dark:border-[#33424c] dark:text-[#b7c5ce]">
                      {point}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-[#d6d9c9] py-12 dark:border-[#24313a]">
          <SectionTitle
            eyebrow="Use Cases"
            title="三类最适合做成多维页面的内容"
            desc="不是所有内容都需要交互。适合做多维页面的，通常是信息密度高、读者路径不唯一、发布后还会继续演进的内容。"
          />
          <div className="grid gap-4 lg:grid-cols-3">
            {PLAYBOOK.map((item) => {
              const Icon = item.icon
              return (
                <article key={item.title} className="border border-[#d6d9c9] bg-[#fbfbf6] p-5 dark:border-[#27343e] dark:bg-[#10171d]">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8efe7] text-[#1f6f78] dark:bg-[#19313a] dark:text-[#76c6d0]">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <h3 className="m-0 text-lg font-semibold text-[#171b17] dark:text-white">{item.title}</h3>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[#59605a] dark:text-[#aab4c0]">{item.desc}</p>
                  <ul className="mt-4 grid gap-2 text-sm text-[#30382f] dark:text-[#d8e0e5]">
                    {item.examples.map((example) => (
                      <li key={example} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#1f6f78] dark:bg-[#76c6d0]" />
                        {example}
                      </li>
                    ))}
                  </ul>
                </article>
              )
            })}
          </div>
        </section>

        <section className="grid gap-8 border-t border-[#d6d9c9] py-12 dark:border-[#24313a] lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <SectionTitle
              eyebrow="Workflow"
              title="做一个多维页面的基本流程"
              desc="先把问题和维度做清楚，再决定视觉和交互。页面的工程量应该服务读者路径，而不是服务装饰。"
            />
            <div className="inline-flex items-center gap-2 rounded-full border border-[#cbd4c7] bg-white px-3 py-1.5 text-xs font-semibold text-[#506052] dark:border-[#33424c] dark:bg-[#111920] dark:text-[#b7c5ce]">
              <IconRouteAltLeft size={16} aria-hidden="true" />
              从问题到界面
            </div>
          </div>
          <ol className="space-y-3">
            {PROCESS.map(([title, desc], index) => (
              <li key={title} className="grid grid-cols-[44px_1fr] gap-4 border border-[#d6d9c9] bg-white p-4 dark:border-[#27343e] dark:bg-[#111920]">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#6b5228] font-mono text-sm font-bold text-white dark:bg-[#d8b772] dark:text-[#151008]">
                  {index + 1}
                </span>
                <div>
                  <h3 className="m-0 text-base font-semibold text-[#171b17] dark:text-white">{title}</h3>
                  <p className="mt-1 text-sm leading-7 text-[#59605a] dark:text-[#aab4c0]">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="cases" className="border-t border-[#d6d9c9] py-12 dark:border-[#24313a]">
          <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <SectionTitle
              eyebrow="Cases"
              title="已经落地的多维页面"
              desc="这些案例仍会继续迭代。完整列表也会在知识库的“多维页面”筛选中同步出现。"
            />
            <Link
              href="/articles?tab=works"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#1f6f78] no-underline hover:text-[#164f56] dark:text-[#76c6d0] dark:hover:text-[#a2e3ea]"
            >
              查看索引 <IconArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {featuredWorks.map((work) => (
              <Link
                key={work.id}
                href={work.href}
                className="group block border border-[#d6d9c9] bg-white p-5 text-[#181b18] no-underline transition hover:border-[#1f6f78] hover:bg-[#fbfcf8] dark:border-[#27343e] dark:bg-[#111920] dark:text-gray-100 dark:hover:border-[#76c6d0] dark:hover:bg-[#121d24]"
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#e8efe7] px-2.5 py-1 text-xs font-semibold text-[#1f6f78] dark:bg-[#19313a] dark:text-[#76c6d0]">
                    <IconChartDots3 size={14} aria-hidden="true" />
                    {categoryLabel(work.category)}
                  </span>
                  <span className="text-xs text-[#778176] dark:text-[#8f9da6]">{work.date}</span>
                </div>
                <h3 className="text-lg font-semibold leading-snug text-[#171b17] group-hover:text-[#1f6f78] dark:text-white dark:group-hover:text-[#76c6d0]">
                  {work.title}
                </h3>
                <p className="mt-3 line-clamp-3 text-sm leading-7 text-[#59605a] dark:text-[#aab4c0]">{work.summary}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#6b5228] dark:text-[#d8b772]">
                  进入页面 <IconArrowRight size={16} aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </PageContainer>
    </main>
  )
}
