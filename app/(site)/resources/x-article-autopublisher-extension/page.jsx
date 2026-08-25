import Link from 'next/link'

import ArticleActionsDropdown from '../../components/ArticleActionsDropdown'
import ArticleFooterCta from '../../components/ArticleFooterCta'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import DistributeContentButton from '../../components/DistributeContentButton'
import PageContainer from '../../components/PageContainer'
import SharePageButton from '../../components/SharePageButton'

export const dynamic = 'force-static'

const RESOURCE_SLUG = 'x-article-autopublisher-extension'
const RESOURCE_URL = `https://2aran.com/resources/${RESOURCE_SLUG}`
const DOWNLOAD_URL = '/api/resources/deliver?resourceKey=resource%3Ax-article-autopublisher-extension&file=extension-zip'
const VERSION = '0.2.6'

const title = 'X Article 自动发布：每天定时发布一篇长文章'
const description =
  '一款配合 2aran.com 使用的 Chrome 扩展：每天按北京时间领取一篇文章，保留标题层级、列表、引用、链接和正文图片，并自动发布到 X Articles。'
const shareText = '让 Chrome 每天自动领取并发布一篇 X Article，保留文章排版、链接与正文图片，失败后按设定间隔重试。'

export const metadata = {
  title,
  description,
  keywords: ['X Article 自动发布', 'Twitter Articles', 'Chrome 浏览器插件', '定时发布', '长文章', '2aran'],
  alternates: { canonical: `/resources/${RESOURCE_SLUG}` },
  openGraph: { title, description, url: RESOURCE_URL, type: 'article' },
  twitter: { card: 'summary_large_image', title, description },
}

function DownloadButton({ className = '' }) {
  return (
    <a
      href={DOWNLOAD_URL}
      download
      className={`inline-flex min-h-11 items-center justify-center rounded-full border border-[#0f1419] bg-[#0f1419] px-5 py-2 text-sm font-semibold text-white no-underline transition hover:-translate-y-0.5 hover:bg-[#2f3336] dark:border-white dark:bg-white dark:text-black dark:hover:bg-gray-200 ${className}`}
    >
      下载 Chrome 插件 v{VERSION}
    </a>
  )
}

function FeatureCard({ label, title, children }) {
  return (
    <div className="rounded-xl border border-[#e1dccf] bg-white/75 p-5 shadow-sm shadow-black/5 dark:border-gray-800 dark:bg-gray-950/45">
      <p className="m-0 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#766529] dark:text-[#d7d7a7]">{label}</p>
      <h3 className="mb-2 mt-2 text-base font-semibold text-[var(--site-ink)]">{title}</h3>
      <p className="m-0 text-sm leading-7 text-[#666] dark:text-gray-300">{children}</p>
    </div>
  )
}

function WorkflowPreview() {
  const steps = [
    ['14:00', '定时检查', '到达设定的北京时间后领取今日任务'],
    ['读取', '整理正文', '过滤站点目录，只保留文章排版与正文图片'],
    ['发布', '写入 X Article', '上传图片、核对顺序，然后调用 X 的发布界面'],
    ['重试', '失败后再检查', '暂时拿不到任务或页面未就绪时按间隔重试'],
  ]

  return (
    <div className="overflow-hidden rounded-2xl border border-[#d8d1c4] bg-[#171611] p-5 text-white shadow-sm dark:border-[#303947] sm:p-7">
      <div className="mb-6 flex items-center justify-between gap-4 border-b border-white/15 pb-4">
        <div>
          <p className="m-0 font-mono text-[10px] uppercase tracking-[0.2em] text-[#d7d7a7]">Daily workflow</p>
          <p className="m-0 mt-1 text-lg font-semibold">X Article 自动发布</p>
        </div>
        <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-200">每日运行</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {steps.map(([time, name, detail]) => (
          <div key={name} className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
            <p className="m-0 font-mono text-[10px] uppercase tracking-[0.16em] text-[#d7d7a7]">{time}</p>
            <p className="m-0 mt-2 font-semibold">{name}</p>
            <p className="m-0 mt-1 text-sm leading-6 text-white/65">{detail}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function XArticleAutopublisherResourcePage() {
  return (
    <PageContainer className="py-10">
      <ContentPvBeacon category="resource" slug={RESOURCE_SLUG} />

      <header className="border-b border-[#eee] pb-8 dark:border-gray-800">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#777] dark:text-gray-400">
          <Link href="/tools" className="underline underline-offset-4 opacity-80 hover:opacity-100">工具库</Link>
          <span aria-hidden="true">·</span>
          <Link href="/browser-extensions" className="underline underline-offset-4 opacity-80 hover:opacity-100">浏览器扩展</Link>
          <span aria-hidden="true">·</span>
          <span>2026-08-24</span>
        </div>

        <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div>
            <p className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#766529] dark:text-[#d7d7a7]">X Article Autopublisher</p>
            <h1 className="m-0 max-w-4xl font-serif text-3xl font-semibold leading-tight tracking-wide text-[#222] dark:text-gray-100 md:text-5xl">
              每天定时发布一篇 X 长文章
            </h1>
            <p className="mb-0 mt-5 max-w-3xl text-base leading-8 text-[#555] dark:text-gray-300">
              插件每天按北京时间从 2aran.com 领取一篇文章，整理正文结构和图片，然后写入并发布为 X Article。
              不需要每天打开后台审核，也不会把站点目录、侧栏和分享组件混进正文。
            </p>
          </div>

          <div className="rounded-xl border border-[#e2d9c4] bg-[#fbf7ee] p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-[#8a7a55] dark:text-amber-300/80">运行条件</p>
            <p className="m-0 mt-2 text-sm leading-7 text-[#666] dark:text-gray-300">
              Chrome 需要保持运行，并已登录具备 Articles 发布权限的 X 账号。插件依赖浏览器里的登录状态，不读取 X 密码。
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {['X Articles', 'Chrome MV3', '北京时间定时', '失败重试', '图片与链接', '无需每日审核'].map((tag) => (
            <span key={tag} className="rounded-full border border-[#e2dac8] bg-[#fbf7ee] px-3 py-1 text-xs text-[#6f5b22] dark:border-[#40472d] dark:bg-[#1a2118] dark:text-[#d7d7a7]">{tag}</span>
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
              tags={['X Articles', 'Chrome 插件', '自动发布']}
              kindLabel="工具"
            />
          </ArticleActionsDropdown>
          <span className="text-xs text-[#888] dark:text-gray-500">领取工具包使用站内工具包价格，领取后可重复下载。</span>
        </div>
      </header>

      <article className="prose-tuaran mt-8">
        <div className="not-prose mb-10"><WorkflowPreview /></div>

        <h2>插件会自动完成什么？</h2>
        <p>
          到达设定时间后，扩展会向 2aran.com 领取当天的文章任务，读取公开文章正文，再打开 X Articles 编辑器完成排版和发布。
          如果暂时没有可领取的文章、页面加载失败或 X 编辑器没有准备好，扩展会等待设定的分钟数后重试。
        </p>

        <div className="not-prose my-8 grid gap-3 md:grid-cols-2">
          <FeatureCard label="Schedule" title="每天自动运行">按北京时间设置每日发布时间；错过时间后仍会补偿检查，当天成功一次后不重复发布。</FeatureCard>
          <FeatureCard label="Article" title="发布长文章，不是普通帖子">目标是 X Articles 编辑器，适合带标题和章节结构的长内容，不走普通推文发布接口。</FeatureCard>
          <FeatureCard label="Format" title="保留文章结构">保留二至四级标题、有序与无序列表、引用、粗体、斜体、安全链接，以及正文中原本的图片位置。</FeatureCard>
          <FeatureCard label="Guardrail" title="发布前检查版式">图片上传后会重新定位到原文位置；正文块数量、格式或图片顺序不一致时停止，等待下一次重试。</FeatureCard>
        </div>

        <h2>安装与配置</h2>
        <ol>
          <li>下载并解压插件包。</li>
          <li>Chrome 打开 <code>chrome://extensions/</code>，开启“开发者模式”。</li>
          <li>点击“加载已解压的扩展程序”，选择包含 <code>manifest.json</code> 的插件目录。</li>
          <li>点击浏览器工具栏里的插件图标，填入站点提供的领取密钥。</li>
          <li>设置北京时间的每日发布时间和失败后的重试间隔，勾选“启用每日自动发布”。</li>
          <li>点击“保存并立即检查”验证配置。以后保持 Chrome 运行并登录 X 即可。</li>
        </ol>

        <h2>领取密钥有什么用？</h2>
        <p>
          领取密钥用于证明这台浏览器有权从 2aran.com 获取待发布任务，避免任何访问者都能领取文章。它不等于 X 密码，
          也不会替代 X 的登录状态。插件更新时，密钥保存在 Chrome 的扩展本地存储中，不需要重复填写。
        </p>

        <h2>正文与图片边界</h2>
        <ul>
          <li>只读取文章正文容器，不复制网站目录、作者操作区、侧栏、分享按钮和页脚。</li>
          <li>只处理正文里的 JPEG、PNG 和 WebP 图片；单张图片最大 8 MiB。</li>
          <li>文章中的 HTTP/HTTPS 链接会保留，站点导航链接不会作为正文混入。</li>
          <li>插件使用 X 自身的图片上传控件和 Articles 编辑器，不需要 X API Token。</li>
        </ul>

        <h2>使用边界</h2>
        <p>
          自动发布依赖 X 网页结构和账号权限。X 改版、登录失效、风控验证或 Articles 权限变化时，插件可能暂停并重试。
          建议偶尔查看插件状态和 X 草稿列表；如果出现“发布状态不确定”，先确认 X 中是否已经生成文章，再决定是否继续。
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
