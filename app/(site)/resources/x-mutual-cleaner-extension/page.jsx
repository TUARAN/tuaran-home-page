import Link from 'next/link'

import ContentPvBeacon from '../../components/ContentPvBeacon'
import PageContainer from '../../components/PageContainer'
import RanbiPaywall from '../../components/RanbiPaywall'
import SharePageButton from '../../components/SharePageButton'

export const dynamic = 'force-static'

const RESOURCE_SLUG = 'x-mutual-cleaner-extension'
const RESOURCE_URL = `https://2aran.com/resources/${RESOURCE_SLUG}`
const DOWNLOAD_URL = '/downloads/x-mutual-cleaner-extension-v0.1.9.zip'

const title = 'X 平台一键取消没有回关你的人：浏览器插件下载'
const description =
  'X 互关清理助手是一款本地运行的 Chrome 浏览器插件：登录 X 后，在 Following 列表一键取消没有回关你的人，也支持在粉丝列表测试慢速批量点击 Follow back。'

const shareText =
  'X 平台一键取消没有回关你的人：本地运行的 Chrome 浏览器插件，支持清理未回关，也支持测试慢速批量 Follow back。'

export const metadata = {
  title,
  description,
  keywords: [
    'x 平台一键取消没有回关你的人 浏览器插件',
    'X 取消未回关',
    'Twitter 取消未回关',
    'X Following 清理',
    'X Follow back 批量回关',
    'Twitter Follow back',
    '互关清理',
    'Chrome 浏览器插件',
    'X 粉丝管理工具',
    'X 关注列表清理',
    '安全本地运行',
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

function DownloadButton({ className = '' }) {
  return (
    <a
      href={DOWNLOAD_URL}
      download
      className={`inline-flex min-h-11 items-center justify-center rounded-full border border-[#0f1419] bg-[#0f1419] px-5 py-2 text-sm font-semibold text-white no-underline transition hover:bg-[#2f3336] dark:border-white dark:bg-white dark:text-black dark:hover:bg-gray-200 ${className}`}
    >
      下载 Chrome 插件 v0.1.9
    </a>
  )
}

function FeatureCard({ title, children }) {
  return (
    <div className="rounded-lg border border-[#e6e0d3] bg-white/70 p-4 dark:border-gray-800 dark:bg-gray-950/40">
      <h3 className="mb-2 text-base font-semibold text-[var(--site-ink)]">{title}</h3>
      <p className="m-0 text-sm leading-7 text-[#666] dark:text-gray-300">{children}</p>
    </div>
  )
}

export default function XMutualCleanerResourcePage() {
  return (
    <PageContainer className="py-10">
      <header className="border-b border-[#eee] pb-7 dark:border-gray-800">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#777] dark:text-gray-400">
          <Link href="/articles?tab=resources" className="underline underline-offset-4 opacity-80 hover:opacity-100">
            资源库
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/works#room-browser-extension" className="underline underline-offset-4 opacity-80 hover:opacity-100">
            浏览器扩展
          </Link>
          <span aria-hidden="true">·</span>
          <span>2026-07-01</span>
          <span aria-hidden="true">·</span>
          <ContentPvBeacon category="resource" slug={RESOURCE_SLUG} display />
        </div>

        <h1 className="mt-4 max-w-4xl font-serif text-3xl font-semibold leading-tight tracking-wide text-[#222] dark:text-gray-100 md:text-5xl">
          X 平台一键取消没有回关你的人
        </h1>

        <p className="mt-4 max-w-3xl text-base leading-8 text-[#555] dark:text-gray-300">
          一个面向 X/Twitter Following 列表的 Chrome 浏览器插件。登录 X 后打开自己的关注列表，点击一次按钮，
          插件会自动往下刷，只取消没有显示 <span className="font-semibold text-[var(--site-ink)]">Follows you</span> 的账号。
          新增测试功能也可以在粉丝列表慢速批量点击 <span className="font-semibold text-[var(--site-ink)]">Follow back</span>。
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {['X 平台', '一键取消未回关', 'Follow back 测试', 'Chrome 插件', '本地运行', '自动下刷列表'].map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[#e2dac8] bg-[#fbf7ee] px-3 py-1 text-xs text-[#7a5b1e] dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <SharePageButton title={title} text={shareText} url={RESOURCE_URL} size="md" idleLabel="分享这个插件" />
          <span className="text-xs text-[#888] dark:text-gray-500">
            打开正文会按资源页扣 10 燃币，解锁后永久可读。
          </span>
        </div>
      </header>

      <RanbiPaywall resourceKey={`resource:${RESOURCE_SLUG}`} unitLabel="资源">
        <article className="prose-tuaran mt-8">
          <div className="not-prose mb-8 rounded-xl border border-[#e2d9c4] bg-[#fbf7ee] p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7a55] dark:text-amber-300/80">
                  Download
                </p>
                <h2 className="m-0 mt-1 border-0 p-0 text-xl font-semibold text-[var(--site-ink)]">
                  X 互关清理助手
                </h2>
                <p className="m-0 mt-2 text-sm leading-7 text-[#666] dark:text-gray-300">
                  Manifest V3 本地 Chrome 扩展。下载后在 Chrome 扩展管理页以“加载已解压”方式安装。
                </p>
              </div>
              <DownloadButton className="shrink-0" />
            </div>
          </div>

          <h2>这个插件解决什么问题？</h2>
          <p>
            如果你在 X 平台长期互关、巡逻、清理关注列表，会遇到一个很机械的动作：打开 Following 列表，
            逐个判断对方有没有显示 <strong>Follows you</strong>，没有显示就点右侧的 <strong>Following</strong> 取消关注。
          </p>
          <p>
            这个动作很重复，也很容易漏。X 互关清理助手就是把这一步做成一个按钮：你确认自己已经登录 X，
            打开自己的 Following 页面后，点击“一键取消未回关”，它会自动处理当前屏幕，并继续向下滚动列表。
          </p>

          <div className="not-prose my-8 grid gap-3 md:grid-cols-3">
            <FeatureCard title="一键执行">
              不需要扫描、不需要配置数量、不需要设置间隔。打开 Following 页面，点一次按钮就开始。
            </FeatureCard>
            <FeatureCard title="只跳过互关">
              看到 Follows you / 关注了你 的账号会跳过；没有互关标记且按钮是 Following 才会处理。
            </FeatureCard>
            <FeatureCard title="测试回关">
              在 Followers / Verified Followers 页面可慢速批量点击 Follow back，只处理已经关注你的账号。
            </FeatureCard>
            <FeatureCard title="本地运行">
              插件运行在你自己的浏览器页面里，不需要你提供账号密码，也不把关注列表上传到第三方服务器。
            </FeatureCard>
          </div>

          <h2>安全性说明</h2>
          <p>
            这个插件不读取密码，不要求 X API Token，不接入后端接口。它的权限只匹配 <code>x.com</code> 和
            <code>twitter.com</code> 页面，本质上是把你原本手动点击 <strong>Following → Unfollow</strong> 的动作自动化。
          </p>
          <p>
            需要注意的是，任何批量取消关注行为都可能触发平台风控。插件内置固定节奏和停止按钮，但仍建议你按自己的账号情况使用，
            不要把它当成无限量清理工具。
          </p>
          <p>
            批量回关属于测试功能。它只会点击显示 <strong>Follow back</strong> / <strong>回关</strong> 的按钮，
            默认每次回关后等待 5.5 秒，每回关 20 个暂停 60 秒，单次运行最多回关 80 个，用来避免连续快速关注。
          </p>
          <p>
            <a href="https://www.axios.com/2019/04/08/twitter-spam-follow-limit" target="_blank" rel="noreferrer">
              公开报道
            </a>
            里，Twitter/X 曾为了抑制刷粉把每日关注上限从 1000 降到 400；
            自动关注规则也更强调“别人先关注你之后再回关”的边界。因此这个测试功能不会跑满公开上限，
            也不会点击普通 Follow，只做低频 Follow back。
          </p>

          <h2>使用方法</h2>
          <ol>
            <li>下载并解压插件包。</li>
            <li>打开 Chrome 的 <code>chrome://extensions/</code>。</li>
            <li>开启“开发者模式”。</li>
            <li>点击“加载已解压的扩展程序”，选择解压后的插件目录。</li>
            <li>登录 X，打开 <code>https://x.com/你的用户名/following</code>。</li>
            <li>点击右下角“一键取消未回关”。需要停止时，再点同一个按钮。</li>
          </ol>

          <h2>如何测试批量 Follow back？</h2>
          <ol>
            <li>登录 X，打开 <code>https://x.com/你的用户名/followers</code> 或 Verified Followers 页面。</li>
            <li>点击右下角“测试：一键回关粉丝”。</li>
            <li>插件只处理有 Follows you 标记且按钮是 Follow back 的账号，已经 Following 的账号会跳过。</li>
            <li>需要停止时，再点同一个按钮。</li>
          </ol>

          <h2>适合谁？</h2>
          <p>
            它适合经常做 X 账号管理、互关清理、创作者社交关系整理的人。尤其是你只想保留真正互关的人，
            又不想手动在长列表里反复判断和点击。
          </p>

          <div className="not-prose mt-8 flex flex-wrap items-center gap-3 border-t border-[#eee] pt-6 dark:border-gray-800">
            <DownloadButton />
            <SharePageButton title={title} text={shareText} url={RESOURCE_URL} size="md" idleLabel="分享给朋友" />
          </div>
        </article>
      </RanbiPaywall>
    </PageContainer>
  )
}
