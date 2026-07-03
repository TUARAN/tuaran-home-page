import Link from 'next/link'

import ArticleActionsDropdown from '../../components/ArticleActionsDropdown'
import ArticleFooterCta from '../../components/ArticleFooterCta'
import ContentEngagement from '../../components/ContentEngagement'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import DistributeContentButton from '../../components/DistributeContentButton'
import PageContainer from '../../components/PageContainer'
import RanbiPaywall from '../../components/RanbiPaywall'
import SharePageButton from '../../components/SharePageButton'
import TimingHeatmapClient from './TimingHeatmapClient'

export const dynamic = 'force-static'

const RESOURCE_SLUG = 'x-best-time-to-post'
const RESOURCE_URL = `https://2aran.com/resources/${RESOURCE_SLUG}`
const EXTENSION_SHORT_URL = 'https://2aran.com/s/Os0WrDh'

const title = 'X/Twitter 什么时候发帖最好：时段热力图 + 涨粉工具箱'
const description =
  '一周 7×24 小时的 X 发帖时段热力图（综合公开研究口径），自动把受众时区换算成你的本地时间，并附三件实用工具：互关清理 Chrome 插件、粉丝活跃时间分析、Tweepcred 评分测试。'

const shareText =
  'X 什么时候发帖最好？做了个热力图工具页：受众时区一键换算北京时间，还整合了互关清理插件和 Tweepcred 评分测试。'

export const metadata = {
  title,
  description,
  keywords: [
    'X 发帖最佳时间',
    'Twitter 什么时候发帖',
    'best time to tweet',
    'X 发帖时间 热力图',
    'Twitter 涨粉工具',
    'Tweepcred 评分',
    'X 取消未回关 插件',
    'X 粉丝活跃时间',
    'Twitter 运营工具',
  ],
  alternates: {
    canonical: `/resources/${RESOURCE_SLUG}`,
  },
  openGraph: {
    title,
    description,
    url: RESOURCE_URL,
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

const TOOLKIT = [
  {
    step: '01 · 清理关系',
    name: 'X 互关清理助手',
    desc: '本地运行的 Chrome 插件：在 Following 列表一键取消没有回关你的人，也支持在粉丝列表慢速批量 Follow back（测试功能）。不要账号密码，不上传数据。',
    href: EXTENSION_SHORT_URL,
    action: '下载插件（自取）',
    external: true,
    sub: { href: '/resources/x-mutual-cleaner-extension', label: '功能与安全性说明 →' },
  },
  {
    step: '02 · 判断时机',
    name: 'Best Time To Tweet',
    desc: '授权你的 X 账号后，按你自己粉丝的实际活跃时间给出发帖时段——比任何通用热力图都准。本页的热力图适合没连账号时先看大盘口径。',
    href: 'https://besttimetotweet.io/',
    action: '分析我的粉丝活跃时间',
    external: true,
  },
  {
    step: '03 · 测账号权重',
    name: 'Tweepcred 计算器',
    desc: 'Tweet Hunter 提供的第三方估算工具，参考 X 内部 Tweepcred（类 PageRank 的账号评分）口径。测完看看自己的分数段，再决定是先清关注比还是先提互动。',
    href: 'https://tweethunter.io/tweepcred-calculator',
    action: '测我的评分',
    external: true,
  },
]

function ToolkitCard({ tool }) {
  return (
    <div className="flex flex-col rounded-xl border border-[#ded8ca] bg-white/70 p-5 dark:border-[#252e38] dark:bg-[#101720]/70">
      <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#6f6f40] dark:text-[#d7d7a7]">
        {tool.step}
      </p>
      <h3 className="m-0 mt-2 text-lg font-semibold text-[var(--site-ink)]">{tool.name}</h3>
      <p className="m-0 mt-2 flex-1 text-sm leading-7 text-[#67645b] dark:text-[#a7b0be]">{tool.desc}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a
          href={tool.href}
          target="_blank"
          rel="noreferrer"
          className="no-external-arrow inline-flex min-h-10 items-center justify-center rounded-full border border-[#171611] bg-[#171611] px-4 py-1.5 text-sm font-semibold text-white no-underline transition hover:bg-[#343026] dark:border-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
        >
          {tool.action} →
        </a>
        {tool.sub ? (
          <Link
            href={tool.sub.href}
            className="text-xs text-[#8a877d] underline underline-offset-4 hover:text-[var(--site-ink)] dark:text-[#8f9aaa]"
          >
            {tool.sub.label}
          </Link>
        ) : null}
      </div>
    </div>
  )
}

export default function XBestTimeToPostPage() {
  return (
    <>
      <PageContainer className="py-10">
        <header className="border-b border-[#eee] pb-7 dark:border-gray-800">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#777] dark:text-gray-400">
            <Link href="/articles?tab=resources" className="underline underline-offset-4 opacity-80 hover:opacity-100">
              资源库
            </Link>
            <span aria-hidden="true">·</span>
            <Link
              href="/resources/x-mutual-cleaner-extension"
              className="underline underline-offset-4 opacity-80 hover:opacity-100"
            >
              X 工具
            </Link>
            <span aria-hidden="true">·</span>
            <span>2026-07-03</span>
            <span aria-hidden="true">·</span>
            <ContentPvBeacon category="resource" slug={RESOURCE_SLUG} display />
          </div>

          <h1 className="mt-4 max-w-4xl font-serif text-3xl font-semibold leading-tight tracking-wide text-[#222] dark:text-gray-100 md:text-5xl">
            X 什么时候发帖最好？
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-8 text-[#555] dark:text-gray-300">
            多数公开研究给的答案是「工作日中午前后」，但这句话对北京时间的你没什么用——你的受众在哪个时区，
            决定了你几点该按下发送。下面这张热力图会把受众时区自动换算成你的本地时间，
            配合三件工具，把「发什么之外」的事一次管完。
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {['发帖时段热力图', '时区换算', '互关清理插件', 'Tweepcred 评分', 'X 涨粉'].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[#e2dac8] bg-[#fbf7ee] px-3 py-1 text-xs text-[#7a5b1e] dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <SharePageButton title={title} text={shareText} url={RESOURCE_URL} size="md" idleLabel="分享这个工具页" />
            <ArticleActionsDropdown label="更多">
              <DistributeContentButton
                title={title}
                summary={shareText}
                url={`/resources/${RESOURCE_SLUG}`}
                category="resource"
                slug={RESOURCE_SLUG}
                tags={['Twitter', 'X 平台', '工具']}
                kindLabel="资源"
              />
            </ArticleActionsDropdown>
          </div>
        </header>

        <div className="mt-8">
          <TimingHeatmapClient />
        </div>

        <section className="mt-10">
          <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#6f6f40] dark:text-[#d7d7a7]">
            Toolkit
          </p>
          <h2 className="m-0 mt-1 text-2xl font-semibold text-[var(--site-ink)]">X 运营三件套</h2>
          <p className="m-0 mt-2 max-w-3xl text-sm leading-7 text-[#67645b] dark:text-[#a7b0be]">
            按顺序用：先把关注列表清干净，再看自己粉丝几点在线，最后测一下账号权重心里有数。
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {TOOLKIT.map((tool) => (
              <ToolkitCard key={tool.name} tool={tool} />
            ))}
          </div>
        </section>

        <RanbiPaywall resourceKey={`resource:${RESOURCE_SLUG}`} unitLabel="资源">
          <article className="prose-tuaran mt-12">
            <h2>热力图的数据从哪来？</h2>
            <p>
              上面的矩阵综合了{' '}
              <a href="https://buffer.com/resources/best-time-to-post-on-twitter/" target="_blank" rel="noreferrer">
                Buffer
              </a>
              、
              <a href="https://sproutsocial.com/insights/best-times-to-post-on-twitter/" target="_blank" rel="noreferrer">
                Sprout Social
              </a>
              、
              <a href="https://blog.hootsuite.com/best-time-to-post-on-twitter/" target="_blank" rel="noreferrer">
                Hootsuite
              </a>{' '}
              等公开研究里重合度较高的结论：工作日 9:00–14:00（受众本地时间）互动最好，周二到周四略强于周一周五，
              周末整体走低。它是大盘口径的整理，不是本站实测——不同账号的粉丝结构差异很大，
              连上自己的账号看真实活跃分布（工具箱第二件）永远比通用图准。
            </p>

            <h2>给中文时区用户的三条实操建议</h2>
            <ol>
              <li>
                <strong>写英文帖、面向北美受众</strong>：受众的「工作日中午」是北京时间深夜 22:00–次日 2:00。
                与其熬夜守时段，不如写完存草稿、用定时发送工具在黄金时段发出。
              </li>
              <li>
                <strong>写中文帖</strong>：把热力图切到「中文时区」，通勤（8:00–9:00）、午休（12:00–13:00）和
                21:00 之后是中文内容的高活跃窗口，和英文口径并不重合。
              </li>
              <li>
                <strong>别只盯时间</strong>：发帖时段解决的是「同样一条帖多拿 20% 曝光」的问题；
                关注比（following/followers）和账号权重解决的是「算法愿不愿意推你」的问题，优先级更高。
              </li>
            </ol>

            <h2>为什么要先清理未回关？</h2>
            <p>
              Tweepcred 是 X 开源代码里出现过的账号评分机制（类 PageRank）。外部能观察到的口径是：
              关注数远大于粉丝数的账号评分会被压低，评分低的账号内容进推荐流的机会更少。
              所以「清理未回关」不只是强迫症——把关注比拉回健康区间，是发帖时间之外成本最低的一步。
              先用工具箱第三件测个分数，再决定清多少。
            </p>
            <p>
              需要提醒：批量取消关注和批量回关都可能触发平台风控，插件内置了固定节奏和停止按钮，
              建议按自己账号的体量分批做，细节看
              <Link href="/resources/x-mutual-cleaner-extension">插件的安全性说明</Link>。
            </p>
          </article>
        </RanbiPaywall>
      </PageContainer>

      <ArticleFooterCta />
      <ContentEngagement contentKey={`resource:${RESOURCE_SLUG}`} width="standard" />
    </>
  )
}
