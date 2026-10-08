import Link from 'next/link'

import ArticleActionsDropdown from '../../components/ArticleActionsDropdown'
import ArticleFooterCta from '../../components/ArticleFooterCta'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import DistributeContentButton from '../../components/DistributeContentButton'
import PageContainer from '../../components/PageContainer'
import SharePageButton from '../../components/SharePageButton'

export const dynamic = 'force-static'

const RESOURCE_SLUG = 'x-clipboard-phrase'
const RESOURCE_URL = `https://2aran.com/resources/${RESOURCE_SLUG}`
const DOWNLOAD_URL = '/api/resources/deliver?resourceKey=resource%3Ax-clipboard-phrase&file=macos-app'
const VERSION = '1.0.0'

const title = 'X 粘贴板评论助手：按间隔把话术写入系统粘贴板'
const description =
  'X 粘贴板评论助手是一个 macOS 应用。点启用后，它立刻把一条话术写入系统粘贴板，再按间隔换成下一条。可顺序循环或随机，话术可以自己增删改。'
const shareText = 'X 粘贴板评论助手：macOS 应用，按间隔把下一条话术写入系统粘贴板。'

export const metadata = {
  title,
  description,
  keywords: [
    'X 粘贴板',
    'X 粘贴板评论助手',
    'macOS 粘贴板',
    '话术切换',
    'X 评论',
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
      下载 macOS 应用 v{VERSION}
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

export default function XClipboardPhraseResourcePage() {
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
          <Link href="/downloads#desktop" className="underline underline-offset-4 opacity-80 hover:opacity-100">
            桌面应用
          </Link>
          <span aria-hidden="true">·</span>
          <span>2026-10-08</span>
        </div>

        <h1 className="mt-4 max-w-4xl font-serif text-3xl font-semibold leading-tight tracking-wide text-[#222] dark:text-gray-100 md:text-5xl">
          按间隔把下一条话术写入系统粘贴板
        </h1>

        <p className="mt-4 max-w-3xl text-base leading-8 text-[#555] dark:text-gray-300">
          这是 macOS 上的「X粘贴板评论助手」。点「启用」后，它立刻把一条话术放进系统粘贴板，然后按你设的间隔换成下一条。
          默认 2 秒。可以顺序循环，也可以随机。
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {['macOS', 'Apple Silicon', '系统粘贴板', '顺序 / 随机', '可编辑话术'].map((tag) => (
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
          <SharePageButton title={title} text={shareText} url={RESOURCE_URL} size="md" idleLabel="分享这个应用" />
          <ArticleActionsDropdown label="更多">
            <DistributeContentButton
              title={title}
              summary={shareText}
              url={`/resources/${RESOURCE_SLUG}`}
              category="tools"
              slug={RESOURCE_SLUG}
              tags={['X 平台', 'macOS', '工具']}
              kindLabel="工具"
            />
          </ArticleActionsDropdown>
          <span className="text-xs text-[#888] dark:text-gray-500">
            说明免费阅读；领取安装包按当前工具包价格结算，之后可永久重复下载。
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
                X 粘贴板评论助手
              </h2>
              <p className="m-0 mt-2 text-sm leading-7 text-[#666] dark:text-gray-300">
                macOS 14 或更高版本，Apple Silicon。解压后是一个可直接打开的应用。
              </p>
            </div>
            <DownloadButton className="shrink-0" />
          </div>
        </div>

        <h2>它会做什么</h2>
        <div className="not-prose my-8 grid gap-3 md:grid-cols-2">
          <FeatureCard title="写入粘贴板">
            启用后马上写入当前话术。之后每个间隔替换成下一条，默认 2 秒，可在 0.5 秒到 1 小时之间调整。
          </FeatureCard>
          <FeatureCard title="顺序或随机">
            顺序走到最后会回到第一条。随机时下一条会避开刚刚写过的那句。
          </FeatureCard>
          <FeatureCard title="话术可改">
            自带一组话术，分成认同、夸奖、站台、观望、点头、卖萌。可以添加、删除、改字和上下移动。
          </FeatureCard>
          <FeatureCard title="配合评论插件">
            <Link href="/resources/x-reply-clipboard-extension">X 剪贴板回复</Link>
            自带同一组话术，每次回复随机抽一条。这个应用按间隔把话术写入系统粘贴板，方便你在别的地方自己粘贴。
          </FeatureCard>
        </div>

        <h2>安装</h2>
        <ol>
          <li>下载并解压，得到 <code>ClipboardPhraseApp.app</code>。打开后窗口标题是「X粘贴板评论助手」。</li>
          <li>拖进「应用程序」，或留在下载目录直接打开。</li>
          <li>当前安装包没有 Apple 公证。第一次请按住 Control 点应用，选「打开」，再确认打开。</li>
          <li>点「启用」。需要停下时点「停用」，粘贴板会保留最后一条话术。</li>
        </ol>
        <p>要求 macOS 14 或更高版本，并且是 Apple Silicon Mac。Intel Mac 不能运行这个安装包。</p>

        <div className="not-prose mt-8 flex flex-wrap items-center gap-3 border-t border-[#eee] pt-6 dark:border-gray-800">
          <DownloadButton />
          <SharePageButton title={title} text={shareText} url={RESOURCE_URL} size="md" idleLabel="分享给朋友" />
        </div>
      </article>
      <ArticleFooterCta />
    </PageContainer>
  )
}
