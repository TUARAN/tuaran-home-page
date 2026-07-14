import Link from 'next/link'

import ArticleActionsDropdown from '../../components/ArticleActionsDropdown'
import ArticleFooterCta from '../../components/ArticleFooterCta'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import DistributeContentButton from '../../components/DistributeContentButton'
import PageContainer from '../../components/PageContainer'
import SharePageButton from '../../components/SharePageButton'

export const dynamic = 'force-static'

const RESOURCE_SLUG = 'x-tweet-to-pdf-extension'
const RESOURCE_URL = `https://2aran.com/resources/${RESOURCE_SLUG}`
const DOWNLOAD_URL = '/api/resources/deliver?resourceKey=resource%3Ax-tweet-to-pdf-extension&file=extension-zip'
const VERSION = '0.1.0'

const title = 'X 推文转 PDF：一键保存干净的推文归档'
const description =
  'X Tweet to PDF 是一个本地运行的 Chrome / Edge 浏览器扩展，可提取当前推文的作者、正文、时间、图片与原文链接，并整理成适合 A4 打印的 PDF。'
const shareText = '把 X 推文一键整理成干净的 A4 PDF：保留正文、作者、图片和原文链接，全程在浏览器本地处理。'

export const metadata = {
  title,
  description,
  keywords: [
    'X 推文转 PDF',
    'Twitter 转 PDF',
    '推文保存 PDF',
    'X 内容归档',
    'Chrome 浏览器插件',
    'Edge 浏览器扩展',
    '网页转 PDF',
    '本地处理',
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
      className={`inline-flex min-h-11 items-center justify-center rounded-full border border-[#0f1419] bg-[#0f1419] px-5 py-2 text-sm font-semibold text-white no-underline transition hover:-translate-y-0.5 hover:bg-[#2f3336] dark:border-white dark:bg-white dark:text-black dark:hover:bg-gray-200 ${className}`}
    >
      下载浏览器扩展 v{VERSION}
    </a>
  )
}

function FeatureCard({ eyebrow, title, children }) {
  return (
    <div className="rounded-xl border border-[#e1dccf] bg-white/75 p-5 shadow-sm shadow-black/5 dark:border-gray-800 dark:bg-gray-950/45">
      <p className="m-0 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a6422] dark:text-amber-300/80">
        {eyebrow}
      </p>
      <h3 className="mb-2 mt-2 text-base font-semibold text-[var(--site-ink)]">{title}</h3>
      <p className="m-0 text-sm leading-7 text-[#666] dark:text-gray-300">{children}</p>
    </div>
  )
}

function PdfPreview() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#d7d1c4] bg-[#e9edf1] p-5 shadow-sm dark:border-gray-700 dark:bg-[#161b22] sm:p-7">
      <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-sky-300/20 blur-2xl" />
      <div className="relative mx-auto max-w-xl rounded-sm bg-white px-7 py-8 shadow-[0_20px_60px_rgba(15,20,25,0.15)] sm:px-10">
        <div className="flex items-center gap-2 border-b border-gray-200 pb-4 font-mono text-[9px] font-bold tracking-[0.18em] text-gray-400">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#0f1419] text-xs text-white">X</span>
          POST ARCHIVE
        </div>
        <div className="pt-7">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500" />
            <div>
              <p className="m-0 text-sm font-bold text-gray-900">TUARAN</p>
              <p className="m-0 mt-0.5 text-xs text-gray-500">@tuaran</p>
            </div>
          </div>
          <p className="m-0 mt-6 text-lg font-medium leading-8 text-gray-900 sm:text-xl">
            值得保存的推文，不应该淹没在时间线里。把正文、图片和出处整理成一份干净的 PDF，留给以后阅读。
          </p>
          <div className="mt-6 grid grid-cols-2 gap-1 overflow-hidden rounded-xl">
            <div className="h-24 bg-gradient-to-br from-[#0f1419] to-[#334155]" />
            <div className="h-24 bg-gradient-to-br from-sky-100 to-blue-300" />
          </div>
          <div className="mt-5 flex items-center gap-2 border-t border-gray-200 pt-4 text-[10px] text-gray-500">
            <span>2026年7月14日</span>
            <span>·</span>
            <span className="text-sky-600">查看原文</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function XTweetToPdfResourcePage() {
  return (
    <PageContainer className="py-10">
      <ContentPvBeacon category="resource" slug={RESOURCE_SLUG} />

      <header className="border-b border-[#eee] pb-8 dark:border-gray-800">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#777] dark:text-gray-400">
          <Link href="/tools" className="underline underline-offset-4 opacity-80 hover:opacity-100">
            工具库
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/browser-extensions" className="underline underline-offset-4 opacity-80 hover:opacity-100">
            浏览器扩展
          </Link>
          <span aria-hidden="true">·</span>
          <span>2026-07-14</span>
        </div>

        <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_310px] lg:items-end">
          <div>
            <p className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#8a6422] dark:text-amber-300">
              X Tweet to PDF
            </p>
            <h1 className="m-0 max-w-4xl font-serif text-3xl font-semibold leading-tight tracking-wide text-[#222] dark:text-gray-100 md:text-5xl">
              把值得保存的推文，整理成一份干净的 PDF
            </h1>
            <p className="mb-0 mt-5 max-w-3xl text-base leading-8 text-[#555] dark:text-gray-300">
              打开一条 X/Twitter 推文，点击扩展按钮，即可提取作者、正文、发布时间、图片与原文链接。
              新页面会自动排成适合阅读和归档的 A4 版式，再由浏览器保存为 PDF。
            </p>
          </div>

          <div className="rounded-xl border border-[#e2d9c4] bg-[#fbf7ee] p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-[#8a7a55] dark:text-amber-300/80">
              Local first
            </p>
            <p className="m-0 mt-2 text-sm leading-7 text-[#666] dark:text-gray-300">
              不要求 X API Token，不读取密码，不把推文内容上传到服务器。
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {['X / Twitter', 'Chrome / Edge', 'A4 PDF', '图片保留', '本地处理', '原文溯源'].map((tag) => (
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
              tags={['X 平台', 'PDF', 'Chrome 插件']}
              kindLabel="工具"
            />
          </ArticleActionsDropdown>
          <span className="text-xs text-[#888] dark:text-gray-500">领取按站内当前工具包价格结算，之后可重复下载。</span>
        </div>
      </header>

      <article className="prose-tuaran mt-8">
        <div className="not-prose mb-10">
          <PdfPreview />
        </div>

        <h2>它会保存什么？</h2>
        <p>
          扩展只读取你当前打开的推文详情页，把适合归档的信息重新排版。它不会把 X 的侧栏、推荐内容、评论区和页面按钮一起塞进 PDF，
          因此成品比直接打印网页更干净，也更适合后续搜索、分享和整理资料。
        </p>

        <div className="not-prose my-8 grid gap-3 md:grid-cols-2">
          <FeatureCard eyebrow="Content" title="正文与作者">
            保留显示名称、账号、头像、推文正文、发布时间和原始链接，方便以后确认来源。
          </FeatureCard>
          <FeatureCard eyebrow="Media" title="最多四张图片">
            自动收集当前推文中的静态图片，打印前等待图片加载，减少 PDF 中出现空白图块的情况。
          </FeatureCard>
          <FeatureCard eyebrow="Layout" title="A4 阅读版式">
            独立排版页针对 A4 打印优化，支持中文换行、长链接、分页和浏览器原生“另存为 PDF”。
          </FeatureCard>
          <FeatureCard eyebrow="Privacy" title="只在本机处理">
            提取、整理和打印都发生在你的浏览器里；插件只匹配 x.com 与 twitter.com 页面。
          </FeatureCard>
        </div>

        <h2>使用方法</h2>
        <ol>
          <li>下载并解压扩展工具包。</li>
          <li>Chrome 打开 <code>chrome://extensions/</code>，Edge 打开 <code>edge://extensions/</code>。</li>
          <li>开启“开发者模式”，点击“加载已解压的扩展程序”，选择解压后的目录。</li>
          <li>登录 X，进入一条推文的详情页，网址中应包含 <code>/status/数字</code>。</li>
          <li>点击浏览器工具栏中的扩展图标，再点击“提取当前推文”。</li>
          <li>在新打开的排版页检查内容，点击“打印 / 保存 PDF”，选择“另存为 PDF”。</li>
        </ol>

        <h2>为什么不直接打印 X 网页？</h2>
        <p>
          X 的详情页是为连续浏览设计的：左右侧栏、互动按钮、推荐和回复都会占用版面，打印样式也会随平台更新而变化。
          这个扩展先把主推文提取成结构化内容，再用自己的打印版式输出，因此更稳定、更易读，也更适合做资料归档。
        </p>

        <h2>当前版本的边界</h2>
        <ul>
          <li>一次导出当前详情页中的主推文，不自动抓取整条 Thread 或全部回复。</li>
          <li>视频不会下载进 PDF；当前版本主要保留正文和静态图片。</li>
          <li>X 改版后页面结构可能变化，后续版本会继续维护核心提取规则。</li>
        </ul>

        <div className="not-prose mt-8 flex flex-wrap items-center gap-3 border-t border-[#eee] pt-6 dark:border-gray-800">
          <DownloadButton />
          <SharePageButton title={title} text={shareText} url={RESOURCE_URL} size="md" idleLabel="分享给朋友" />
        </div>
      </article>
      <ArticleFooterCta />
    </PageContainer>
  )
}
