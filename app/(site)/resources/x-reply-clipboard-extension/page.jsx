import Link from 'next/link'

import ArticleActionsDropdown from '../../components/ArticleActionsDropdown'
import ArticleFooterCta from '../../components/ArticleFooterCta'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import DistributeContentButton from '../../components/DistributeContentButton'
import PageContainer from '../../components/PageContainer'
import SharePageButton from '../../components/SharePageButton'

export const dynamic = 'force-static'

const RESOURCE_SLUG = 'x-reply-clipboard-extension'
const RESOURCE_URL = `https://2aran.com/resources/${RESOURCE_SLUG}`
const DOWNLOAD_URL = '/api/resources/deliver?resourceKey=resource%3Ax-reply-clipboard-extension&file=extension-zip'
const VERSION = '0.2.4'

const title = 'X 时间线回复助手：按时间线打开评论并发送'
const description =
  'X 时间线回复助手是一个本地运行的 Chrome 扩展。在已登录的 X 时间线上，它从上往下打开评论弹窗，从固定话术里随机抽一条写进去，再点 Reply。满 35 条后刷新页面，从顶部继续。'
const shareText = 'X 时间线回复助手：在时间线上打开评论，随机抽一条固定话术并发送。满 35 条后刷新，再从顶部继续。'

export const metadata = {
  title,
  description,
  keywords: [
    'X 评论回复',
    'X 时间线回复助手',
    'Twitter 回复插件',
    'Chrome 浏览器插件',
    'X 时间线',
    '本地运行',
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
      下载 Chrome 插件 v{VERSION}
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

export default function XReplyClipboardResourcePage() {
  return (
    <PageContainer className="py-10">
      <ContentPvBeacon category="resource" slug={RESOURCE_SLUG} />
      <header className="border-b border-[#eee] pb-7 dark:border-gray-800">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#777] dark:text-gray-400">
          <Link href="/tools" className="underline underline-offset-4 opacity-80 hover:opacity-100">
            工具库
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/tools#x-platform" className="underline underline-offset-4 opacity-80 hover:opacity-100">
            推特工具
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/downloads#extensions" className="underline underline-offset-4 opacity-80 hover:opacity-100">
            浏览器扩展
          </Link>
          <span aria-hidden="true">·</span>
          <span>2026-10-08</span>
        </div>

        <h1 className="mt-4 max-w-4xl font-serif text-3xl font-semibold leading-tight tracking-wide text-[#222] dark:text-gray-100 md:text-5xl">
          在 X 时间线上打开评论，随机抽一条话术并发送
        </h1>

        <p className="mt-4 max-w-3xl text-base leading-8 text-[#555] dark:text-gray-300">
          登录 X 后打开首页、个人主页或搜索结果。左下角点一次「开始回复」，插件会从上往下打开每条帖子的评论弹窗，
          从 55 条固定话术里随机抽一条写进去，再点 Reply。成功 35 条后刷新页面，从顶部再来一轮。
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {['X 平台', '评论弹窗', '固定话术', 'Chrome 插件', '本地运行', '满 35 条刷新'].map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[#e2dac8] bg-[#fbf7ee] px-3 py-1 text-xs text-[#7a5b1e] dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <DownloadButton />
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
            工具说明免费阅读；领取工具包按当前工具包价格结算，之后可永久重复下载。
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
                X 时间线回复助手
              </h2>
              <p className="m-0 mt-2 text-sm leading-7 text-[#666] dark:text-gray-300">
                Manifest V3 本地 Chrome 扩展。下载后在 Chrome 扩展管理页以「加载已解压」方式安装。
              </p>
            </div>
            <DownloadButton className="shrink-0" />
          </div>
        </div>

        <h2>它会做什么</h2>
        <div className="not-prose my-8 grid gap-3 md:grid-cols-2">
          <FeatureCard title="从上往下">
            从当前时间线最上面的帖子开始，点评论图标，等弹窗出现。
          </FeatureCard>
          <FeatureCard title="随机话术">
            从和桌面应用相同的 55 条话术里随机抽一条，写进评论框。发出去之后才换下一条，下一条不会和刚用过的那句相同。
          </FeatureCard>
          <FeatureCard title="满 35 条刷新">
            本页成功 35 条后刷新页面，再从顶部继续。关闭这个标签页会停止。
          </FeatureCard>
          <FeatureCard title="只在本机运行">
            插件匹配 x.com 和 twitter.com，使用你已经登录的页面。不读取密码，也不把评论内容上传到本站。
          </FeatureCard>
        </div>

        <h2>使用方法</h2>
        <ol>
          <li>下载并解压插件包。</li>
          <li>打开 Chrome 的 <code>chrome://extensions/</code>，开启「开发者模式」。</li>
          <li>点击「加载已解压的扩展程序」，选择解压后的目录。</li>
          <li>登录 X，打开首页、个人主页或搜索结果。</li>
          <li>点击页面左下角「开始回复」。需要停下时，点「停止」。</li>
        </ol>
        <p>
          已经加载过这个目录时，到扩展管理页点一次刷新，再回到 X 重新开始。
          这个标签页要留在前台。切到别的标签页会暂停，回到该页后继续。每次成功回复会换成另一条话术。
          Reply 暂时不可用时，插件会重新同步编辑器状态再试一次；仍未成功则关闭弹窗并点击 Save，把内容留在 X 草稿中。
          只有确认发出的回复才计入每轮 35 条。
          话术和 macOS 上的
          <Link href="/resources/x-clipboard-phrase">X 粘贴板评论助手</Link>
          是同一组，插件自己随机抽取。
        </p>

        <div className="not-prose mt-8 flex flex-wrap items-center gap-3 border-t border-[#eee] pt-6 dark:border-gray-800">
          <DownloadButton />
          <SharePageButton title={title} text={shareText} url={RESOURCE_URL} size="md" idleLabel="分享给朋友" />
        </div>
      </article>
      <ArticleFooterCta />
    </PageContainer>
  )
}
