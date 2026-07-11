import Link from 'next/link'

import ArticleActionsDropdown from '../../components/ArticleActionsDropdown'
import ArticleFooterCta from '../../components/ArticleFooterCta'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import DistributeContentButton from '../../components/DistributeContentButton'
import PageContainer from '../../components/PageContainer'
import SharePageButton from '../../components/SharePageButton'
import DesktopDownloadChooser from './DesktopDownloadChooser'

export const dynamic = 'force-static'

const RESOURCE_SLUG = '2aran-desktop'
const RESOURCE_URL = `https://2aran.com/resources/${RESOURCE_SLUG}`
const VERSION = 'v0.1.0'
function downloadUrl(fileKey) {
  return `/api/resources/deliver?resourceKey=resource%3A2aran-desktop&file=${encodeURIComponent(fileKey)}`
}

const downloads = [
  {
    key: 'macos-arm64',
    platform: 'macOS',
    arch: 'Apple Silicon',
    file: `2aran-desktop-macos-arm64-${VERSION}.dmg`,
    href: downloadUrl('macos-arm64'),
    available: true,
    size: '114 MB',
    sha256: 'c141656540ae0fe58c5e48068dfb228b5a7a91a73e11de0b6968f0fafe563b8c',
    note: '适用于 Apple Silicon 芯片的 Mac。',
  },
  {
    key: 'macos-x64',
    platform: 'macOS',
    arch: 'Intel',
    file: `2aran-desktop-macos-x64-${VERSION}.dmg`,
    href: downloadUrl('macos-x64'),
    available: true,
    size: '116 MB',
    sha256: 'e47d3ec133122fe2ab6c492537a9f907b88a934207c3e2654ac35f8c19a7e2af',
    note: '适用于 Intel 芯片的 Mac。',
  },
  {
    key: 'windows-x64',
    platform: 'Windows',
    arch: 'x64',
    file: `2aran-desktop-windows-${VERSION}.exe`,
    href: downloadUrl('windows-x64'),
    available: true,
    size: '99 MB',
    sha256: '97aa08e9d8be7589b528a33be03f20212954e5eeff63ed2f7808a0e628099685',
    note: '适用于 Windows 10/11 的安装程序。',
  },
]

const title = '2aran 桌面应用下载：Windows / macOS'
const description = '2aran 桌面应用测试版本下载入口，会根据当前系统推荐 Windows 或 macOS 安装包，并提供首次安装指引。'
const shareText = '2aran 桌面应用测试版本下载入口：自动推荐 Windows / macOS 安装包，并提供首次安装指引。'

export const metadata = {
  title,
  description,
  keywords: ['2aran 桌面应用', 'Windows 下载', 'macOS 下载', '桌面客户端', '2aran Desktop'],
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

export default function DesktopResourcePage() {
  return (
    <PageContainer className="py-10">
      <ContentPvBeacon category="resource" slug={RESOURCE_SLUG} />
      <header className="border-b border-[#eee] pb-7 dark:border-gray-800">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#777] dark:text-gray-400">
          <Link href="/tools" className="underline underline-offset-4 opacity-80 hover:opacity-100">
            工具库
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/desktop-apps" className="underline underline-offset-4 opacity-80 hover:opacity-100">
            桌面应用
          </Link>
          <span aria-hidden="true">·</span>
          <span>{VERSION}</span>
        </div>

        <h1 className="mt-4 max-w-4xl font-serif text-3xl font-semibold leading-tight tracking-wide text-[#222] dark:text-gray-100 md:text-5xl">
          2aran 桌面应用
        </h1>

        <p className="mt-4 max-w-3xl text-base leading-8 text-[#555] dark:text-gray-300">
          面向 Windows 和 macOS 的桌面客户端下载页。当前是测试版本，安装包已经上传到 Cloudflare R2；
          页面会根据当前系统推荐下载，其他架构和平台可以展开后手动选择。
        </p>
        <p className="mt-2 text-sm text-[#8a7a55] dark:text-amber-300/80">
          说明免费阅读；首次点击领取任一安装包使用 10 燃币，之后可永久重复下载。
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
              category="tools"
              slug={RESOURCE_SLUG}
              tags={['桌面应用', 'Windows', 'macOS']}
              kindLabel="工具"
            />
          </ArticleActionsDropdown>
        </div>
      </header>

      <article className="prose-tuaran mt-8">
        <DesktopDownloadChooser downloads={downloads} version={VERSION} />

        <h2>测试版本说明</h2>
        <p>
          当前安装包未做 Apple Developer ID / Windows EV 证书签名，所以首次安装或启动时，macOS Gatekeeper 和 Windows SmartScreen
          可能会拦截或提示风险。这不代表安装包损坏，而是系统对未签名测试版本的常规提示。
        </p>
        <p>
          如果你对安装包来源敏感，可以先核对页面展示的 SHA-256，再决定是否安装。正式版会在完成证书签名后替换这里的下载入口。
        </p>

        <h2>安装指引</h2>
        <h3>macOS</h3>
        <ol>
          <li>下载对应芯片的 DMG。Apple Silicon 通常是 M1/M2/M3/M4；较早的 Mac 请选择 Intel。</li>
          <li>打开 DMG，把 2aran 拖到 Applications 文件夹。</li>
          <li>
            如果系统提示“无法验证开发者”，进入“系统设置 - 隐私与安全性”，在安全提示处选择“仍要打开”；也可以在应用图标上右键选择“打开”。
          </li>
        </ol>

        <h3>Windows</h3>
        <ol>
          <li>下载 Windows x64 安装程序。</li>
          <li>如果 SmartScreen 出现提示，点击“更多信息”，再选择“仍要运行”。</li>
          <li>按安装向导完成安装；首次启动如果被安全软件拦截，请确认文件名和校验值后再放行。</li>
        </ol>

        <h2>发布约定</h2>
        <p>
          桌面应用安装包统一放在 Cloudflare R2 的 <code>downloads/</code> 前缀。当前版本使用三个文件名：
          <code>2aran-desktop-macos-arm64-{VERSION}.dmg</code>、<code>2aran-desktop-macos-x64-{VERSION}.dmg</code> 和
          <code>2aran-desktop-windows-{VERSION}.exe</code>。
        </p>
        <p>
          本地构建产物保留在 <code>desktop-dist/</code>。不要把 Electron 安装包提交到 <code>public/</code>，
          因为它们超过 Cloudflare Pages 单文件 25MiB 限制；发布时用 wrangler 上传到 R2。
        </p>

        <h2>适合放进桌面应用的能力</h2>
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
              category="tools"
              slug={RESOURCE_SLUG}
              tags={['桌面应用', 'Windows', 'macOS']}
              kindLabel="工具"
            />
          </ArticleActionsDropdown>
        </div>
      </article>
      <ArticleFooterCta />
    </PageContainer>
  )
}
