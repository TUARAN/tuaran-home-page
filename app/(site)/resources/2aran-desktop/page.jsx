import Link from 'next/link'

import ArticleActionsDropdown from '../../components/ArticleActionsDropdown'
import ArticleFooterCta from '../../components/ArticleFooterCta'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import DistributeContentButton from '../../components/DistributeContentButton'
import PageContainer from '../../components/PageContainer'
import SharePageButton from '../../components/SharePageButton'

export const dynamic = 'force-static'

const RESOURCE_SLUG = '2aran-desktop'
const RESOURCE_URL = `https://2aran.com/resources/${RESOURCE_SLUG}`
const VERSION = 'v0.1.0'
const R2_PUBLIC_BASE =
  (process.env.NEXT_PUBLIC_R2_PUBLIC_BASE || process.env.R2_PUBLIC_BASE || 'https://pub-09012f26768b4d39908a8a574af8fde1.r2.dev').replace(
    /\/+$/,
    ''
  )

function downloadUrl(file) {
  return `${R2_PUBLIC_BASE}/downloads/${file}`
}

const downloads = [
  {
    platform: 'macOS',
    arch: 'Apple Silicon',
    file: `2aran-desktop-macos-arm64-${VERSION}.dmg`,
    href: downloadUrl(`2aran-desktop-macos-arm64-${VERSION}.dmg`),
    available: true,
    size: '114 MB',
    sha256: 'c141656540ae0fe58c5e48068dfb228b5a7a91a73e11de0b6968f0fafe563b8c',
    note: '适用于 Apple Silicon 芯片的 Mac。',
  },
  {
    platform: 'macOS',
    arch: 'Intel',
    file: `2aran-desktop-macos-x64-${VERSION}.dmg`,
    href: downloadUrl(`2aran-desktop-macos-x64-${VERSION}.dmg`),
    available: true,
    size: '116 MB',
    sha256: 'e47d3ec133122fe2ab6c492537a9f907b88a934207c3e2654ac35f8c19a7e2af',
    note: '适用于 Intel 芯片的 Mac。',
  },
  {
    platform: 'Windows',
    arch: 'x64',
    file: `2aran-desktop-windows-${VERSION}.exe`,
    href: downloadUrl(`2aran-desktop-windows-${VERSION}.exe`),
    available: true,
    size: '99 MB',
    sha256: '97aa08e9d8be7589b528a33be03f20212954e5eeff63ed2f7808a0e628099685',
    note: '适用于 Windows 10/11 的安装程序。',
  },
]

const title = '2aran 桌面版下载：Windows / macOS'
const description = '2aran 桌面版的 Windows 与 macOS 下载入口，后续用于承接站内工具、资源领取、通知和本地工作流。'
const shareText = '2aran 桌面版下载入口：Windows 和 macOS 安装包会在这里集中发布。'

export const metadata = {
  title,
  description,
  keywords: ['2aran 桌面版', 'Windows 下载', 'macOS 下载', '桌面客户端', '2aran Desktop'],
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

function PlatformDownload({ item }) {
  const className = item.available
    ? 'border-[#0f1419] bg-[#0f1419] text-white hover:bg-[#2f3336] dark:border-white dark:bg-white dark:text-black dark:hover:bg-gray-200'
    : 'cursor-not-allowed border-[#d8d1c4] bg-[#f4efe5] text-[#8a8376] dark:border-[#303947] dark:bg-[#17202b] dark:text-[#7e8a9b]'

  return (
    <div className="rounded-lg border border-[#e6e0d3] bg-white/70 p-4 dark:border-gray-800 dark:bg-gray-950/40">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a7a55] dark:text-amber-300/80">
            {item.platform}
          </p>
          <h3 className="m-0 mt-1 text-xl font-semibold text-[var(--site-ink)]">{item.platform} 桌面版</h3>
          <p className="m-0 mt-1 text-sm text-[#777] dark:text-gray-400">{item.arch}</p>
        </div>
        <span className="rounded-full border border-[#e2dac8] bg-[#fbf7ee] px-2.5 py-1 text-xs text-[#7a5b1e] dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          {item.available ? '可下载' : '待上传'}
        </span>
      </div>
      <p className="m-0 text-sm leading-7 text-[#666] dark:text-gray-300">{item.note}</p>
      <p className="m-0 mt-2 text-xs text-[#8a8376] dark:text-gray-500">
        {item.size} · SHA-256
      </p>
      <p className="m-0 mt-1 break-all font-mono text-[11px] text-[#8a8376] dark:text-gray-500">
        {item.sha256}
      </p>
      <p className="m-0 mt-2 break-all font-mono text-[12px] text-[#8a8376] dark:text-gray-500">
        R2 downloads/{item.file}
      </p>
      {item.available ? (
        <a
          href={item.href}
          download
          className={`mt-4 inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2 text-sm font-semibold no-underline transition ${className}`}
        >
          下载 {item.platform} 版
        </a>
      ) : (
        <span className={`mt-4 inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2 text-sm font-semibold ${className}`}>
          安装包待上传
        </span>
      )}
    </div>
  )
}

export default function DesktopResourcePage() {
  return (
    <PageContainer className="py-10">
      <header className="border-b border-[#eee] pb-7 dark:border-gray-800">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#777] dark:text-gray-400">
          <Link href="/articles?tab=resources" className="underline underline-offset-4 opacity-80 hover:opacity-100">
            资源库
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/desktop-apps" className="underline underline-offset-4 opacity-80 hover:opacity-100">
            桌面版
          </Link>
          <span aria-hidden="true">·</span>
          <span>{VERSION}</span>
          <span aria-hidden="true">·</span>
          <ContentPvBeacon category="resource" slug={RESOURCE_SLUG} display />
        </div>

        <h1 className="mt-4 max-w-4xl font-serif text-3xl font-semibold leading-tight tracking-wide text-[#222] dark:text-gray-100 md:text-5xl">
          2aran 桌面版
        </h1>

        <p className="mt-4 max-w-3xl text-base leading-8 text-[#555] dark:text-gray-300">
          面向 Windows 和 macOS 的桌面客户端下载页。后续桌面版会优先承接站内工具、资源领取、通知提醒和本地工作流，
          不再把桌面安装包散落在文章或网盘链接里。
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {['Windows', 'macOS', '桌面客户端', '本地工作流', '站内工具'].map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[#e2dac8] bg-[#fbf7ee] px-3 py-1 text-xs text-[#7a5b1e] dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <SharePageButton title={title} text={shareText} url={RESOURCE_URL} size="md" idleLabel="分享下载页" />
          <ArticleActionsDropdown label="更多">
            <DistributeContentButton
              title={title}
              summary={shareText}
              url={`/resources/${RESOURCE_SLUG}`}
              category="resource"
              slug={RESOURCE_SLUG}
              tags={['桌面版', 'Windows', 'macOS']}
              kindLabel="资源"
            />
          </ArticleActionsDropdown>
        </div>
      </header>

      <article className="prose-tuaran mt-8">
        <div className="not-prose mb-8 rounded-xl border border-[#e2d9c4] bg-[#fbf7ee] p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7a55] dark:text-amber-300/80">
                Desktop Downloads
              </p>
              <h2 className="m-0 mt-1 border-0 p-0 text-xl font-semibold text-[var(--site-ink)]">
                Windows / macOS 下载位
              </h2>
              <p className="m-0 mt-2 text-sm leading-7 text-[#666] dark:text-gray-300">
                安装包已放在 Cloudflare R2 的 downloads/ 前缀下，页面按钮会直接指向公开 R2 下载地址。
              </p>
            </div>
            <Link
              href="/desktop-apps"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-[#0f1419] bg-[#0f1419] px-5 py-2 text-sm font-semibold text-white no-underline transition hover:bg-[#2f3336] dark:border-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              返回桌面版列表
            </Link>
          </div>
        </div>

        <div className="not-prose grid gap-4 md:grid-cols-2">
          {downloads.map((item) => (
            <PlatformDownload key={item.file} item={item} />
          ))}
        </div>

        <h2>发布约定</h2>
        <p>
          桌面版安装包统一放在 Cloudflare R2 的 <code>downloads/</code> 前缀。当前版本使用三个文件名：
          <code>2aran-desktop-macos-arm64-{VERSION}.dmg</code>、<code>2aran-desktop-macos-x64-{VERSION}.dmg</code> 和
          <code>2aran-desktop-windows-{VERSION}.exe</code>。
        </p>
        <p>
          本地构建产物保留在 <code>desktop-dist/</code>。不要把 Electron 安装包提交到 <code>public/</code>，
          因为它们超过 Cloudflare Pages 单文件 25MiB 限制；发布时用 wrangler 上传到 R2。
        </p>

        <h2>适合放进桌面版的能力</h2>
        <ul>
          <li>站内工具的桌面快捷入口。</li>
          <li>资源领取、版本更新和下载管理。</li>
          <li>本地通知、剪贴板、文件处理等浏览器不适合长期承载的工作流。</li>
        </ul>

        <div className="not-prose mt-8 flex flex-wrap items-center gap-3 border-t border-[#eee] pt-6 dark:border-gray-800">
          <SharePageButton title={title} text={shareText} url={RESOURCE_URL} size="md" idleLabel="分享给朋友" />
          <ArticleActionsDropdown label="更多">
            <DistributeContentButton
              title={title}
              summary={shareText}
              url={`/resources/${RESOURCE_SLUG}`}
              category="resource"
              slug={RESOURCE_SLUG}
              tags={['桌面版', 'Windows', 'macOS']}
              kindLabel="资源"
            />
          </ArticleActionsDropdown>
        </div>
      </article>
      <ArticleFooterCta />
    </PageContainer>
  )
}
