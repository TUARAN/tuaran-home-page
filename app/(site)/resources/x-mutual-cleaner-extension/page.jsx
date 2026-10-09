import Link from 'next/link'

import ArticleActionsDropdown from '../../components/ArticleActionsDropdown'
import ArticleFooterCta from '../../components/ArticleFooterCta'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import DistributeContentButton from '../../components/DistributeContentButton'
import PageContainer from '../../components/PageContainer'
import SharePageButton from '../../components/SharePageButton'

export const dynamic = 'force-static'

const RESOURCE_SLUG = 'x-mutual-cleaner-extension'
const RESOURCE_URL = `https://2aran.com/resources/${RESOURCE_SLUG}`
const UPGRADE_URL = '/resources/x-reply-clipboard-extension'

const title = 'X 互关清理助手已升级为 X 互动帮手'
const description =
  '原 X 互关清理助手已并入 X 互动帮手。新版在一个扩展中提供时间线回复、通知回复、互关浇友和 AI 定时发推。'

const shareText =
  'X 互关清理助手已升级为 X 互动帮手：时间线回复、通知回复、互关浇友和 AI 定时发推集中在一个扩展。'

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
    <Link
      href={UPGRADE_URL}
      className={`inline-flex min-h-11 items-center justify-center rounded-full border border-[#0f1419] bg-[#0f1419] px-5 py-2 text-sm font-semibold text-white no-underline transition hover:bg-[#2f3336] dark:border-white dark:bg-white dark:text-black dark:hover:bg-gray-200 ${className}`}
    >
      前往 X 互动帮手
    </Link>
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
      <ContentPvBeacon category="resource" slug={RESOURCE_SLUG} />
      <header className="border-b border-[#eee] pb-7 dark:border-gray-800">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#777] dark:text-gray-400">
          <Link href="/tools" className="underline underline-offset-4 opacity-80 hover:opacity-100">
            工具库
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/tools#downloads" className="underline underline-offset-4 opacity-80 hover:opacity-100">
            浏览器扩展
          </Link>
          <span aria-hidden="true">·</span>
          <span>2026-07-01</span>
        </div>

        <h1 className="mt-4 max-w-4xl font-serif text-3xl font-semibold leading-tight tracking-wide text-[#222] dark:text-gray-100 md:text-5xl">
          X 互关清理助手已升级为「X 互动帮手」
        </h1>

        <p className="mt-4 max-w-3xl text-base leading-8 text-[#555] dark:text-gray-300">
          原来的清理未回关、回关粉丝和关注候选三项功能已经完整合并到新版第三个 Tab「互关浇友」。
          同一个扩展现在还可以在时间线上自动回复，并在通知页给别人发来的回复点赞和继续回复。
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
          <ArticleActionsDropdown label="更多">
            <DistributeContentButton
              title={title}
              summary={shareText}
              url={`/resources/${RESOURCE_SLUG}`}
              category="tools"
              slug={RESOURCE_SLUG}
              tags={['X 平台', 'Chrome 插件', '工具']}
              kindLabel="工具"
            />
          </ArticleActionsDropdown>
          <span className="text-xs text-[#888] dark:text-gray-500">
            工具说明免费阅读；点击领取工具包时使用 10 燃币，之后可永久重复下载。
          </span>
        </div>
      </header>

      <article className="prose-tuaran mt-8">
          <div className="not-prose mb-8 rounded-xl border border-[#e2d9c4] bg-[#fbf7ee] p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7a55] dark:text-amber-300/80">
                  Download
                </p>
                <h2 className="m-0 mt-1 border-0 p-0 text-xl font-semibold text-[var(--site-ink)]">
                  已并入 X 互动帮手
                </h2>
                <p className="m-0 mt-2 text-sm leading-7 text-[#666] dark:text-gray-300">
                  旧版停止单独更新。请安装 X 互动帮手 v3.4.1，在顶部选择「互关浇友」。
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
            打开自己的 Following 页面后，点击“取消未回关”，它会自动处理当前屏幕，并继续向下滚动列表。
          </p>

          <div className="not-prose my-8 grid gap-3 md:grid-cols-2">
            <FeatureCard title="一键执行">
              不需要扫描、不需要配置数量、不需要设置间隔。打开 Following 页面，点一次按钮就开始。
            </FeatureCard>
            <FeatureCard title="只跳过互关">
              看到 Follows you / 关注了你 的账号会跳过；没有互关标记且按钮是 Following 才会处理。
            </FeatureCard>
            <FeatureCard title="测试回关">
              在 Followers / Verified Followers 页面批量点击 Follow back，只处理已经关注你的账号；与候选关注共享频率和额度。
            </FeatureCard>
            <FeatureCard title="候选关注">
              先手动打开其他作者的 Followers 页面，再点击普通 Follow：每 2 秒一个，每 15 个暂停 30 分钟，每日最多 400 个。插件不会跳到自己的粉丝页。
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
            入口标为“功能 2 回关粉丝”。回关与候选关注共用同一个频率状态：每次操作后等待 2 秒，
            两项任务合计每完成 15 个暂停 30 分钟，每日合计最多 400 个。
          </p>
          <p>
            关注候选也属于测试功能。它只会在 Followers / Verified Followers 列表里点击普通
            <strong> Follow</strong> / <strong>关注</strong>，不会处理 Follow back 或已经 Following 的账号。
            当前口径是：每个动作间隔 2 秒；与回关合计完成 15 个后自动暂停 30 分钟，按钮显示倒计时；
            倒计时结束后自动进入下一批，两项任务每日合计最多 400 个。这个功能不会自动跳转，请先打开其他作者的 Followers 页面。
          </p>
          <p>
            <a href="https://www.axios.com/2019/04/08/twitter-spam-follow-limit" target="_blank" rel="noreferrer">
              公开报道
            </a>
            里，Twitter/X 曾为了抑制刷粉把每日关注上限从 1000 降到 400；
            自动关注规则也更强调“别人先关注你之后再回关”的边界。因此插件把回关与候选关注放进同一份每日额度，
            防止切换功能后重新计数。
          </p>

          <h2>使用方法</h2>
          <ol>
            <li>下载并解压插件包。</li>
            <li>打开 Chrome 的 <code>chrome://extensions/</code>。</li>
            <li>开启“开发者模式”。</li>
            <li>点击“加载已解压的扩展程序”，选择解压后的插件目录。</li>
            <li>登录 X，打开 <code>https://x.com/你的用户名/following</code>。</li>
            <li>点击右下角“取消未回关”。需要停止时，再点同一个按钮。</li>
          </ol>

          <h2>如何测试批量 Follow back？</h2>
          <ol>
            <li>登录 X，打开 <code>https://x.com/你的用户名/followers</code> 或 Verified Followers 页面。</li>
            <li>在右下角插件面板里找到“功能 2 回关粉丝”，点击“开始”。</li>
            <li>插件只处理有 Follows you 标记且按钮是 Follow back 的账号，已经 Following 的账号会跳过。</li>
            <li>需要停止时，再点同一个按钮。</li>
          </ol>

          <h2>如何测试关注候选？</h2>
          <ol>
            <li>登录 X，打开任意账号的 <code>https://x.com/目标用户名/followers</code> 或 Verified Followers 页面。</li>
            <li>先打开其他作者的 Followers 页面，再在插件面板选择“关注候选”并点击“开始关注”。</li>
            <li>插件只处理右侧按钮是普通 Follow / 关注的账号；已经 Following、Follow back 或无法识别的行会跳过。</li>
            <li>回关与候选关注共享限制：两个关注动作之间间隔 2 秒；合计完成 15 个后暂停 30 分钟，倒计时结束后继续，每日合计最多 400 个。</li>
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
            <ArticleActionsDropdown label="更多">
              <DistributeContentButton
                title={title}
                summary={shareText}
                url={`/resources/${RESOURCE_SLUG}`}
                category="tools"
                slug={RESOURCE_SLUG}
                tags={['X 平台', 'Chrome 插件', '工具']}
                kindLabel="工具"
              />
            </ArticleActionsDropdown>
          </div>
      </article>
      <ArticleFooterCta />
    </PageContainer>
  )
}
