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
    file: `2aran-desktop-macos-arm64-${VERSION}-test.1.dmg`,
    href: downloadUrl('macos-arm64'),
    available: true,
    size: '127.1 MiB',
    sha256: 'a8be7a93eb990704dd6a1e649852bc78e772117ec5da2cbf300da1d2da3907e8',
    note: '适用于 Apple Silicon 芯片的 Mac。',
  },
  {
    key: 'macos-x64',
    platform: 'macOS',
    arch: 'Intel',
    file: `2aran-desktop-macos-x64-${VERSION}-test.1.dmg`,
    href: downloadUrl('macos-x64'),
    available: true,
    size: '132.0 MiB',
    sha256: '8b2e77b17f6468015ae696a39bcff3cd68f88d3be6f57f7904baf932acc10cab',
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

const title = '2aran 客户端：Windows / macOS 下载，iPhone / iPad 测试'
const description = '领取 2aran 的 Windows 与 macOS 测试安装包，并查看 iPhone、iPad 在 Xcode 里的测试步骤。'
const shareText = '2aran 客户端：Windows / macOS 测试安装包，以及 iPhone、iPad 的 Xcode 测试说明。'

export const metadata = {
  title,
  description,
  keywords: ['2aran 桌面应用', 'Windows 下载', 'macOS 下载', 'iPhone', 'iPad', '桌面客户端', '2aran Desktop'],
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
          <Link href="/tools#downloads" className="underline underline-offset-4 opacity-80 hover:opacity-100">
            桌面应用
          </Link>
          <span aria-hidden="true">·</span>
          <span>{VERSION}</span>
        </div>

        <h1 className="mt-4 max-w-4xl font-serif text-3xl font-semibold leading-tight tracking-wide text-[#222] dark:text-gray-100 md:text-5xl">
          2aran 桌面应用
        </h1>

        <p className="mt-4 max-w-3xl text-base leading-8 text-[#555] dark:text-gray-300">
          Windows 和 macOS 安装包已经上传，页面会按当前系统推荐下载。iPhone 和 iPad 的测试步骤写在下方，当前从 Xcode 运行。
        </p>
        <p className="mt-2 text-sm text-[#8a7a55] dark:text-amber-300/80">
          说明免费阅读；首次点击领取任一安装包使用 10 燃币，之后可永久重复下载。
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {['Windows', 'macOS', 'iPhone', 'iPad', '桌面客户端'].map((tag) => (
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
              tags={['桌面应用', 'Windows', 'macOS', 'iPhone', 'iPad']}
              kindLabel="工具"
            />
          </ArticleActionsDropdown>
        </div>
      </header>

      <article className="prose-tuaran mt-8">
        <DesktopDownloadChooser downloads={downloads} version={VERSION} />

        <h2>iPhone 与 iPad</h2>
        <p>
          工程在仓库 <code>ios/Tuaran.xcodeproj</code>，显示名是 2aran。首页读取公开内容索引；内容、工具、圈子和我的打开对应的站内页面。
        </p>
        <ol>
          <li>从 Mac App Store 安装 Xcode。只装命令行工具还不能打开模拟器。</li>
          <li>用 Xcode 打开 <code>ios/Tuaran.xcodeproj</code>，在 Signing 里选中自己的 Apple 团队。</li>
          <li>选择一台 iPhone 模拟器，按 Run。</li>
        </ol>
        <p>
          这页现在不能直接领取 iPhone 安装包。免费 Apple ID 可以把应用装到自己的 iPhone 上，大约 7 天后需要重新安装。TestFlight 需要付费的 Apple Developer Program：在 Xcode 里执行 Product、Archive，上传到 App Store Connect 之后，安装入口在 TestFlight。
        </p>

        <h2>测试版本说明</h2>
        <p>
          当前安装包未做 Apple Developer ID / Windows EV 证书签名，所以首次安装或启动时，macOS Gatekeeper 和 Windows SmartScreen
          可能会拦截或提示风险。macOS 测试包使用本地临时签名，尚未经过 Apple 公证；如提示“已损坏”，请先核对校验值，不要直接忽略提示。
        </p>
        <p>
          如果你对安装包来源敏感，可以先核对页面展示的 SHA-256，再决定是否安装。正式版会在完成证书签名后替换这里的下载入口。
        </p>

        <h2>安装指引</h2>
        <h3>macOS</h3>
        <ol>
          <li>下载对应芯片的 DMG。Apple Silicon 通常是 M1/M2/M3/M4；较早的 Mac 请选择 Intel。Apple Silicon 安装包大约 127 MiB。打开时如果提示没有可装载的文件系统，说明文件没下完，删掉后重新下载。</li>
          <li>打开 DMG，把 2aran Desktop 拖到 Applications 文件夹，再从“应用程序”打开。</li>
          <li>
            如果系统拦截打开，进入“系统设置 - 隐私与安全性”，在安全提示处选择“仍要打开”。
          </li>
        </ol>
        <p>
          若测试包仍提示“已损坏”，仅在确认从本页下载且 SHA-256 一致后，打开“终端”执行下面的命令，再从“应用程序”打开。命令只移除 2aran Desktop 的下载隔离标记。
        </p>
        <pre><code>{'xattr -dr com.apple.quarantine "/Applications/2aran Desktop.app"'}</code></pre>

        <h3>Windows</h3>
        <ol>
          <li>下载 Windows x64 安装程序。</li>
          <li>如果 SmartScreen 出现提示，点击“更多信息”，再选择“仍要运行”。</li>
          <li>按安装向导完成安装；首次启动如果被安全软件拦截，请确认文件名和校验值后再放行。</li>
        </ol>

        <h2>发布约定</h2>
        <p>
          桌面应用安装包统一放在 Cloudflare R2 的 <code>downloads/</code> 前缀。当前版本使用三个文件名：
          <code>2aran-desktop-macos-arm64-{VERSION}-test.1.dmg</code>、<code>2aran-desktop-macos-x64-{VERSION}-test.1.dmg</code> 和
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
              tags={['桌面应用', 'Windows', 'macOS', 'iPhone', 'iPad']}
              kindLabel="工具"
            />
          </ArticleActionsDropdown>
        </div>
      </article>
      <ArticleFooterCta />
    </PageContainer>
  )
}
