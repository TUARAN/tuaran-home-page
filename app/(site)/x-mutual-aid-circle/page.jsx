import Image from 'next/image'
import Link from 'next/link'

import { createRichPageMetadata } from '../../../lib/richPageSeo'
import ArticleActionsDropdown from '../components/ArticleActionsDropdown'
import ArticleFooterCta from '../components/ArticleFooterCta'
import ContentEngagement from '../components/ContentEngagement'
import ContentPvBeacon from '../components/ContentPvBeacon'
import DistributeContentButton from '../components/DistributeContentButton'
import ForceDarkRoute from '../components/ForceDarkRoute'
import PageContainer from '../components/PageContainer'
import RanbiPaywall from '../components/RanbiPaywall'
import RichPageJsonLd from '../components/RichPageJsonLd'
import SharePageButton from '../components/SharePageButton'
import TimingHeatmapClient from './TimingHeatmapClient'

export const dynamic = 'force-static'

const RESOURCE_SLUG = 'x-mutual-aid-circle'
const RESOURCE_URL = `https://2aran.com/${RESOURCE_SLUG}`
const EXTENSION_SHORT_URL = 'https://2aran.com/s/Os0WrDh'
const GROUP_QR_SRC = '/qrcode-x-group.jpg'
const OWNER_QR_SRC = '/qrcode-wechat.jpg'
const PROFILE_SCREENSHOT_SRC = '/images/diary/x-blue-v-mutual-profile-2026-07-09.png'

const title = 'X 互帮互助圈子：真实互动，一起把 X 流量玩明白'

const shareText =
  '推文总破不了 1000 曝光？多半是早期互动没启动。我们建了个 X 互帮互助群：真实点赞评论互相带，还配了互关清理插件、发帖时段热力图、Tweepcred 评分和账号状态自查工具，自取。'

export const metadata = createRichPageMetadata('x-mutual-aid-circle')

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
  {
    step: '04 · 查可见性',
    name: 'Shadowban Test',
    desc: '输入 X 用户名，检查账号是否疑似 search ban、search suggestion ban、ghostban 或 reply deboosting。互动突然变少时，先测一下是不是被限流。',
    href: 'https://shadowban.yuzurisa.com/',
    action: '检测 ghostban',
  },
  {
    step: '05 · 查违规提示',
    name: 'X 近期违规自查',
    desc: '打开 X Community Notes 加入流程，页面会提示账号近期是否存在影响参与资格的违规记录。适合在互动异常、功能受限时顺手排查。',
    href: 'https://x.com/i/flow/join-birdwatch',
    action: '查看违规提示',
  },
]

const PLATFORM_COMPARISON = [
  {
    name: '微博',
    desc: '最像老 Twitter，也有认证、互粉、超话和评论抱团。但微博蓝 V 更偏企业/机构身份，互粉更多是平台内流量玩法，不像 X 这样把付费蓝勾、开放关注图谱和跨墙中文用户筛到同一个池子里。',
  },
  {
    name: '小红书',
    desc: '有互赞群、评论互助、专业号和蒲公英生态，互动当然有用；只是它的核心仍然是内容标签和推荐算法，用户关注关系没有 X 这么强。',
  },
  {
    name: 'B 站',
    desc: '也有互粉、三连、UP 主认证，但视频内容成本高，不适合高频轻社交。它更像作品平台，不像 X 是一条连续流动的公共时间线。',
  },
  {
    name: '知乎',
    desc: '认证和创作者体系都在，但更重答案质量、议题权威和搜索沉淀。单纯互关很难直接放大，更适合把内容做成长尾。',
  },
  {
    name: '抖音 / 快手 / 视频号',
    desc: '有蓝 V、企业号、直播间互粉和垂类抱团，但核心分发是短视频推荐流。粉丝关系存在，可平台真正奖励的是内容完播、停留和转化。',
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
          className="x-mutual-cta-button no-external-arrow inline-flex min-h-10 items-center justify-center rounded-full border border-[#1d9bf0] bg-[#1d9bf0] px-4 py-1.5 text-sm font-bold no-underline transition hover:border-[#1a8cd8] hover:bg-[#1a8cd8]"
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
      <RichPageJsonLd pageId="x-mutual-aid-circle" />
      <ForceDarkRoute pageBg="#000000" />
      <div className="x-mutual-page min-h-screen bg-black pb-1 text-[#e7e9ea]">
      <PageContainer className="py-10 md:py-12">
        <header className="border-b border-[#2f3336] pb-8">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#71767b]">
            <Link href="/rich-pages" className="underline underline-offset-4 opacity-80 hover:text-[#e7e9ea] hover:opacity-100">
              互动专题
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
                url={`/${RESOURCE_SLUG}`}
                category="resource"
                slug={RESOURCE_SLUG}
                tags={['Twitter', 'X 平台', '社群', '工具']}
                kindLabel="互动专题"
              />
            </ArticleActionsDropdown>
          </div>
        </header>

        <section className="mx-auto mt-10 max-w-[1080px] border-b border-[#2f3336] pb-10">
          <div className="grid gap-6 lg:grid-cols-[minmax(300px,420px)_minmax(0,600px)] lg:items-start lg:justify-center">
            <figure className="m-0 overflow-hidden rounded-2xl border border-[#2f3336] bg-[#080808] shadow-[0_0_60px_rgba(29,155,240,0.10)]">
              <Image
                src={PROFILE_SCREENSHOT_SRC}
                alt="2aRan X 蓝 V 账号主页截图，显示关注数和粉丝数接近"
                width={1196}
                height={956}
                className="h-auto w-full"
                priority
              />
              <figcaption className="border-t border-[#2f3336] px-4 py-3 text-xs leading-6 text-[#71767b]">
                一周多跑下来，关注和粉丝数开始接近。数字只是表层，真正有意思的是时间线变宽了。
              </figcaption>
            </figure>

            <article className="max-w-[600px]">
              <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#1d9bf0]">
                Field Note
              </p>
              <h2 className="m-0 mt-2 text-2xl font-semibold leading-tight text-[#e7e9ea] md:text-[2rem]">
                蓝 V 互关一周涨粉 1k 后，我反而更关心「人」了
              </h2>

              <div className="mt-5 space-y-4 text-[15px] leading-8 text-[#c9d1d9]">
                <p className="m-0">
                  最近一周多，我在 X 上参与蓝 V 互关，涨了大概 1k 粉。一开始我也以为这只是互粉，跑下来才发现，事情没有那么薄。
                </p>
                <p className="m-0">
                  以前我的时间线很窄，基本是程序员、AI、独立开发和出海，内容密度高，但情绪也很单一：AI 焦虑、职业焦虑、产品焦虑、变现焦虑。蓝 V 互关之后，时间线突然变宽了。开发者、设计师、跨境电商、投资、留学、教育、自媒体、法律、外贸、币圈、海外生活，全挤进来了。
                </p>
                <p className="m-0">
                  表面看，这是互关列表。往深一点看，它更像把中文互联网里一批愿意折腾、愿意表达、愿意为工具和身份付费的人聚到了一起。蓝 V 需要订阅，中文用户用 X 还隔着墙、支付、语言和信息源的门槛，所以这一批人并不是随机样本。
                </p>
                <p className="m-0">
                  我观察到的共识也很朴素：光互关没用，后面要多活跃、多表达、多点赞、多评论。你会在一次次互动里记住几个人：谁在做产品，谁在研究流量，谁表达很真，谁只是刷存在感。社交关系不是从「关注」开始的，是从持续可见的行为开始的。
                </p>
                <p className="m-0">
                  所以我现在不把它看成一个纯增长技巧。互关只是入口，真正难的是互关之后继续真实。你要让别人慢慢知道你是谁、在做什么、信什么、反对什么。即使只是互关，要做到被看见、被记住、形成关系，也不容易。
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {[
                  ['门槛', '蓝 V 订阅 + 跨墙环境，先筛掉一批完全随机用户。'],
                  ['动作', '关注只是第一步，点赞评论和持续表达才是社交信号。'],
                  ['边界', '把互关当终点就是刷数，当入口才可能长出关系。'],
                ].map(([label, text]) => (
                  <div key={label} className="rounded-xl border border-[#2f3336] bg-[#080808] p-4">
                    <p className="m-0 text-xs font-bold text-[#1d9bf0]">{label}</p>
                    <p className="m-0 mt-2 text-xs leading-6 text-[#8b98a5]">{text}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="mt-12">
          <SectionHeading
            eyebrow="Platform Map"
            title="其他平台也有类似玩法，但 X 这一波不太一样"
            desc="微博、小红书、B 站、知乎、抖音、快手、视频号都有认证、互粉或互助的局部形态。差别在于，X 中文蓝 V 互关把付费蓝勾、开放关注关系、跨墙门槛和公共时间线叠在了一起。"
          />

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {PLATFORM_COMPARISON.map((platform) => (
              <div key={platform.name} className="rounded-2xl border border-[#2f3336] bg-[#080808] p-5">
                <h3 className="m-0 text-base font-semibold text-[#e7e9ea]">{platform.name}</h3>
                <p className="m-0 mt-2 text-sm leading-7 text-[#8b98a5]">{platform.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-[#2f3336] bg-[#080808] p-5 text-sm leading-7 text-[#8b98a5]">
            <p className="m-0">
              我的判断：这波蓝 V 互关不是万能增长法，更像一个窗口期。它能把一批有行动力的人拉到同一个场里，但最后留下来的，还是那些真实表达、持续互动、有具体事情在推进的人。
            </p>
            <p className="m-0 mt-3">
              更完整的机制拆解，可以看站内调研：
              <Link
                href="/articles/research/topics/x-mutual-follow-ecosystem"
                className="text-[#1d9bf0] underline underline-offset-4 hover:text-[#8ecdf8]"
              >
                X 平台互关生态观察
              </Link>
              ；X 蓝勾和 Premium 机制以
              <a
                href="https://help.x.com/en/managing-your-account/about-x-verified-accounts"
                target="_blank"
                rel="noreferrer"
                className="text-[#1d9bf0] underline underline-offset-4 hover:text-[#8ecdf8]"
              >
                官方说明
              </a>
              为准。
            </p>
          </div>
        </section>

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
            title="圈子五件套"
            desc="互助解决的是「人」的问题，这几件工具解决「账号」的问题。按顺序来：先把关注列表清干净，再看粉丝几点在线，测账号权重，最后排查是不是被 shadowban / ghostban 或近期违规提示影响。"
          />
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
              连上自己的账号看真实活跃分布（五件套第二件）永远比通用图准。
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
              先用五件套第三件测个分数，再决定清多少。
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
