import Image from 'next/image'
import Link from 'next/link'

import ArticleActionsDropdown from '../../components/ArticleActionsDropdown'
import ArticleFooterCta from '../../components/ArticleFooterCta'
import ContentEngagement from '../../components/ContentEngagement'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import DistributeContentButton from '../../components/DistributeContentButton'
import ForceDarkRoute from '../../components/ForceDarkRoute'
import PageContainer from '../../components/PageContainer'
import RanbiPaywall from '../../components/RanbiPaywall'
import SharePageButton from '../../components/SharePageButton'
import TimingHeatmapClient from './TimingHeatmapClient'

export const dynamic = 'force-static'

const RESOURCE_SLUG = 'x-mutual-aid-circle'
const RESOURCE_URL = `https://2aran.com/resources/${RESOURCE_SLUG}`
const EXTENSION_SHORT_URL = 'https://2aran.com/s/Os0WrDh'
const GROUP_QR_SRC = '/qrcode-x-group.jpg'
const OWNER_QR_SRC = '/qrcode-wechat.jpg'

const title = 'X 互帮互助圈子：真实互动，一起把 X 流量玩明白'
const description =
  '「X 互帮互助」微信圈子主页：X 算法对早期真实互动很敏感，群里互相把优质推文的前 30–60 分钟互动做起来；圈子配套互关清理 Chrome 插件、发帖时段热力图、Tweepcred 评分三件工具。'

const shareText =
  '推文总破不了 1000 曝光？多半是早期互动没启动。我们建了个 X 互帮互助群：真实点赞评论互相带，还配了互关清理插件、发帖时段热力图和 Tweepcred 评分工具，自取。'

export const metadata = {
  title,
  description,
  keywords: [
    'X 互帮互助群',
    'Twitter 互助群',
    '推文互动 微信群',
    'X 涨粉',
    'X 早期互动',
    'X 取消未回关 插件',
    'X 发帖最佳时间',
    'Tweepcred 评分',
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
    sub: { href: '/resources/x-mutual-cleaner-extension', label: '功能与安全性说明 →' },
  },
  {
    step: '02 · 判断时机',
    name: 'Best Time To Tweet',
    desc: '授权你的 X 账号后，按你自己粉丝的实际活跃时间给出发帖时段——比任何通用热力图都准。下面的热力图适合没连账号时先看大盘口径。',
    href: 'https://besttimetotweet.io/',
    action: '分析我的粉丝活跃时间',
  },
  {
    step: '03 · 测账号权重',
    name: 'Tweepcred 计算器',
    desc: 'Tweet Hunter 提供的第三方估算工具，参考 X 内部 Tweepcred（类 PageRank 的账号评分）口径。测完看看自己的分数段，再决定是先清关注比还是先提互动。',
    href: 'https://tweethunter.io/tweepcred-calculator',
    action: '测我的评分',
  },
]

function ToolkitCard({ tool }) {
  return (
    <div className="flex flex-col rounded-2xl border border-[#2f3336] bg-[#080808] p-5 transition hover:border-[#1d9bf0]/70 hover:bg-[#0d0f11]">
      <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#1d9bf0]">
        {tool.step}
      </p>
      <h3 className="m-0 mt-2 text-lg font-semibold text-[#e7e9ea]">{tool.name}</h3>
      <p className="m-0 mt-2 flex-1 text-sm leading-7 text-[#8b98a5]">{tool.desc}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a
          href={tool.href}
          target="_blank"
          rel="noreferrer"
          className="no-external-arrow inline-flex min-h-10 items-center justify-center rounded-full border border-[#1d9bf0] bg-[#1d9bf0] px-4 py-1.5 text-sm font-bold text-white no-underline transition hover:border-[#1a8cd8] hover:bg-[#1a8cd8]"
        >
          {tool.action} →
        </a>
        {tool.sub ? (
          <Link
            href={tool.sub.href}
            className="text-xs text-[#71767b] underline underline-offset-4 hover:text-[#e7e9ea]"
          >
            {tool.sub.label}
          </Link>
        ) : null}
      </div>
    </div>
  )
}

function SectionHeading({ eyebrow, title: heading, desc }) {
  return (
    <div>
      <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#1d9bf0]">
        {eyebrow}
      </p>
      <h2 className="m-0 mt-1 text-2xl font-semibold text-[#e7e9ea]">{heading}</h2>
      {desc ? (
        <p className="m-0 mt-2 max-w-3xl text-sm leading-7 text-[#8b98a5]">{desc}</p>
      ) : null}
    </div>
  )
}

export default function XMutualAidCirclePage() {
  return (
    <>
      <ForceDarkRoute pageBg="#000000" />
      <div className="x-mutual-page min-h-screen bg-black pb-1 text-[#e7e9ea]">
      <PageContainer className="py-10 md:py-12">
        <header className="border-b border-[#2f3336] pb-8">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#71767b]">
            <Link href="/articles?tab=resources" className="underline underline-offset-4 opacity-80 hover:text-[#e7e9ea] hover:opacity-100">
              资源库
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/community" className="underline underline-offset-4 opacity-80 hover:text-[#e7e9ea] hover:opacity-100">
              圈子
            </Link>
            <span aria-hidden="true">·</span>
            <span>2026-07-03</span>
            <span aria-hidden="true">·</span>
            <ContentPvBeacon category="resource" slug={RESOURCE_SLUG} display />
          </div>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#2f3336] bg-[#080808] px-3 py-1 text-xs font-bold text-[#e7e9ea]">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#e7e9ea] font-mono text-[12px] text-black">X</span>
            <span className="text-[#1d9bf0]">Creator Circle</span>
          </div>

          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[0.95] tracking-[-0.01em] text-[#e7e9ea] md:text-7xl">
            X 互帮互助
          </h1>
          <p className="mt-3 text-xl font-semibold text-[#1d9bf0] md:text-2xl">真实互动，一起把 X 流量玩明白。</p>

          <p className="mt-5 max-w-3xl text-base leading-8 text-[#8b98a5]">
            发推一个月的实测观察：X 的推荐算法对<strong>早期真实互动</strong>很敏感——
            一条推文能不能破 1000 曝光，往往取决于发出后 30–60 分钟内有没有 10 个左右真实的点赞和评论。
            这是创作者圈的经验口径，不是官方文档，但它解释了为什么新账号的帖子发出去就沉底：
            没有忠实粉丝，早期互动启动不了。这个圈子，就是一起解决启动问题的。
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {['X 互帮互助群', '真实互动', '互关清理插件', '发帖时段热力图', 'Tweepcred 评分'].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[#2f3336] bg-[#080808] px-3 py-1 text-xs font-medium text-[#e7e9ea]"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <SharePageButton title={title} text={shareText} url={RESOURCE_URL} size="md" idleLabel="分享这个圈子" />
            <ArticleActionsDropdown label="更多">
              <DistributeContentButton
                title={title}
                summary={shareText}
                url={`/resources/${RESOURCE_SLUG}`}
                category="resource"
                slug={RESOURCE_SLUG}
                tags={['Twitter', 'X 平台', '社群', '工具']}
                kindLabel="资源"
              />
            </ArticleActionsDropdown>
          </div>
        </header>

        <section className="mt-8 rounded-[28px] border border-[#2f3336] bg-[#080808] p-6 shadow-[0_0_80px_rgba(29,155,240,0.10)] md:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,500px)] lg:items-start">
            <div>
              <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#1d9bf0]">
                Join the Circle
              </p>
              <h2 className="m-0 mt-1 text-2xl font-semibold text-[#e7e9ea]">进 X 互帮互助群（微信）</h2>
              <p className="m-0 mt-3 max-w-2xl text-sm leading-7 text-[#8b98a5]">
                玩法很简单：你把优质推文发到群里，大家真心点赞、评论、转发，把每条推文最关键的前
                30–60 分钟互动做起来；轮到别人发帖，你也搭把手。互相帮助涨曝光、涨粉丝，一起成长。
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="m-0 text-xs font-semibold uppercase tracking-[0.14em] text-[#1d9bf0]">
                    群里怎么玩
                  </p>
                  <ul className="m-0 mt-2 list-none space-y-1.5 p-0 text-sm leading-6 text-[#c9d1d9]">
                    <li>· 把你的优质推文发到群里</li>
                    <li>· 大家真实点赞、评论、转发</li>
                    <li>· 互相把早期互动做起来，一起涨曝光涨粉</li>
                  </ul>
                </div>
                <div>
                  <p className="m-0 text-xs font-semibold uppercase tracking-[0.14em] text-[#1d9bf0]">
                    群规（必须遵守）
                  </p>
                  <ul className="m-0 mt-2 list-none space-y-1.5 p-0 text-sm leading-6 text-[#c9d1d9]">
                    <li>· 只欢迎优质内容创作者</li>
                    <li>· 真实互动，禁止纯刷量、广告、水军</li>
                    <li>· 积极参与，共同进步</li>
                  </ul>
                </div>
              </div>

              <p className="m-0 mt-5 text-xs leading-6 text-[#71767b]">
                二维码定期更新，扫不上时去
                <Link href="/community" className="text-[#1d9bf0] underline underline-offset-4 hover:text-[#8ecdf8]">
                  社群页
                </Link>
                取最新的，或加站长个人微信拉你进群。
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:justify-items-end">
              <figure className="m-0 flex flex-col items-center gap-2">
                <div className="flex min-h-[236px] w-full items-center justify-center overflow-hidden rounded-3xl border border-[#2f3336] bg-white p-2 shadow-[0_0_48px_rgba(29,155,240,0.16)] sm:w-[220px]">
                  <Image
                    src={GROUP_QR_SRC}
                    alt="X 互帮互助微信群二维码"
                    width={220}
                    height={204}
                    className="h-auto max-h-[220px] w-full object-contain"
                    unoptimized
                  />
                </div>
                <figcaption className="text-center text-xs text-[#71767b]">
                  群聊二维码 · X 互帮互助
                </figcaption>
              </figure>

              <figure className="m-0 flex flex-col items-center gap-2">
                <div className="flex min-h-[236px] w-full items-center justify-center overflow-hidden rounded-3xl border border-[#2f3336] bg-white p-2 shadow-[0_0_48px_rgba(29,155,240,0.16)] sm:w-[220px]">
                  <Image
                    src={OWNER_QR_SRC}
                    alt="站长个人微信二维码"
                    width={220}
                    height={298}
                    className="h-auto max-h-[220px] w-auto max-w-full object-contain"
                    unoptimized
                  />
                </div>
                <figcaption className="text-center text-xs text-[#71767b]">
                  站长个人微信 · 扫码拉你进群
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <SectionHeading
            eyebrow="Circle Toolkit"
            title="圈子三件套"
            desc="互助解决的是「人」的问题，这三件工具解决「账号」的问题。群里大家都在用，按顺序来：先把关注列表清干净，再看自己粉丝几点在线，最后测一下账号权重心里有数。"
          />
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {TOOLKIT.map((tool) => (
              <ToolkitCard key={tool.name} tool={tool} />
            ))}
          </div>
        </section>

        <section className="mt-12">
          <SectionHeading
            eyebrow="Circle Playbook"
            title="圈子方法：挑对时间发"
            desc="互助能把互动带起来，但发帖时机不对，帮你的人也在睡觉。这张热力图整理了公开研究里重合度较高的时段口径，会把受众时区自动换算成你的本地时间。"
          />
          <div className="mt-5">
            <TimingHeatmapClient />
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
              连上自己的账号看真实活跃分布（三件套第二件）永远比通用图准。
            </p>

            <h2>给中文时区用户的三条实操建议</h2>
            <ol>
              <li>
                <strong>写英文帖、面向北美受众</strong>：受众的「工作日中午」是北京时间深夜 22:00–次日 2:00。
                与其熬夜守时段，不如写完存草稿、用定时发送工具在黄金时段发出——发完在群里说一声，让大家把早期互动接上。
              </li>
              <li>
                <strong>写中文帖</strong>：把热力图切到「中文时区」，通勤（8:00–9:00）、午休（12:00–13:00）和
                21:00 之后是中文内容的高活跃窗口，和英文口径并不重合。
              </li>
              <li>
                <strong>别只盯时间</strong>：发帖时段解决的是「同样一条帖多拿 20% 曝光」的问题；
                早期互动（圈子互助）和账号权重（关注比）解决的是「算法愿不愿意推你」的问题，优先级更高。
              </li>
            </ol>

            <h2>为什么要先清理未回关？</h2>
            <p>
              Tweepcred 是 X 开源代码里出现过的账号评分机制（类 PageRank）。外部能观察到的口径是：
              关注数远大于粉丝数的账号评分会被压低，评分低的账号内容进推荐流的机会更少。
              所以「清理未回关」不只是强迫症——把关注比拉回健康区间，是发帖时间之外成本最低的一步。
              先用三件套第三件测个分数，再决定清多少。
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
      </div>
    </>
  )
}
