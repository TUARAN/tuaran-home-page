import Link from 'next/link'

import ArticleActionsDropdown from '../../components/ArticleActionsDropdown'
import ArticleFooterCta from '../../components/ArticleFooterCta'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import DistributeContentButton from '../../components/DistributeContentButton'
import PageContainer from '../../components/PageContainer'
import SharePageButton from '../../components/SharePageButton'

export const dynamic = 'force-static'

const RESOURCE_SLUG = 'protal-todo-assistant'
const RESOURCE_URL = `https://2aran.com/resources/${RESOURCE_SLUG}`
const DOWNLOAD_URL = '/api/resources/deliver?resourceKey=resource%3Aprotal-todo-assistant&file=extension-zip'
const VERSION = '0.1.0'

const title = 'protal待办处理助手：逐项完成办公门户待办提交'
const description =
  'protal待办处理助手是本地运行的 Chrome / Edge 扩展，可逐条打开办公门户待办，点击一键提交与弹窗内最终提交，确认返回列表后继续下一条。'
const shareText = 'protal待办处理助手：逐条完成办公门户待办的一键提交闭环，支持单步验收、安全停止与超时保护。'

export const metadata = {
  title,
  description,
  keywords: ['protal待办处理助手', 'Portal 待办', 'OA 待办', 'Chrome 浏览器插件', 'Edge 浏览器插件', '办公自动化'],
  alternates: { canonical: `/resources/${RESOURCE_SLUG}` },
  openGraph: { title, description, url: RESOURCE_URL, type: 'article' },
  twitter: { card: 'summary_large_image', title, description },
}

function DownloadButton({ className = '' }) {
  return (
    <a
      href={DOWNLOAD_URL}
      download
      className={`inline-flex min-h-11 items-center justify-center rounded-full border border-[#0f1419] bg-[#0f1419] px-5 py-2 text-sm font-semibold text-white no-underline transition hover:bg-[#2f3336] dark:border-white dark:bg-white dark:text-black dark:hover:bg-gray-200 ${className}`}
    >
      免费下载插件 v{VERSION}
    </a>
  )
}

function FeatureCard({ title: cardTitle, children }) {
  return (
    <div className="rounded-lg border border-[#e6e0d3] bg-white/70 p-4 dark:border-gray-800 dark:bg-gray-950/40">
      <h3 className="mb-2 text-base font-semibold text-[var(--site-ink)]">{cardTitle}</h3>
      <p className="m-0 text-sm leading-7 text-[#666] dark:text-gray-300">{children}</p>
    </div>
  )
}

export default function ProtalTodoAssistantResourcePage() {
  return (
    <PageContainer className="py-10">
      <ContentPvBeacon category="resource" slug={RESOURCE_SLUG} />
      <header className="border-b border-[#eee] pb-7 dark:border-gray-800">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#777] dark:text-gray-400">
          <Link href="/tools" className="underline underline-offset-4 opacity-80 hover:opacity-100">工具库</Link>
          <span aria-hidden="true">·</span>
          <Link href="/tools#downloads" className="underline underline-offset-4 opacity-80 hover:opacity-100">浏览器扩展</Link>
          <span aria-hidden="true">·</span>
          <span>2026-10-09</span>
        </div>

        <h1 className="mt-4 max-w-4xl font-serif text-3xl font-semibold leading-tight tracking-wide text-[#222] dark:text-gray-100 md:text-5xl">
          protal待办处理助手
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-[#555] dark:text-gray-300">
          在办公门户待办列表里逐条完成固定操作：打开标题、点击“一键提交”、在弹窗中点击最终“提交”，确认回到列表后再处理下一条。
          所有动作都在当前浏览器标签页本地执行。
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {['办公门户', '待办处理', 'Chrome / Edge', '单步验收', '超时停止', '本地运行'].map((tag) => (
            <span key={tag} className="rounded-full border border-[#e2dac8] bg-[#fbf7ee] px-3 py-1 text-xs text-[#7a5b1e] dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
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
              tags={['浏览器扩展', '待办处理', '工具']}
              kindLabel="工具"
            />
          </ArticleActionsDropdown>
          <span className="text-xs text-[#888] dark:text-gray-500">免费领取；之后可在个人资源记录中重复下载。</span>
        </div>
      </header>

      <article className="prose-tuaran mt-8">
        <div className="not-prose mb-8 rounded-xl border border-[#e2d9c4] bg-[#fbf7ee] p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7a55] dark:text-amber-300/80">Download</p>
              <h2 className="m-0 mt-1 border-0 p-0 text-xl font-semibold text-[var(--site-ink)]">protal待办处理助手</h2>
              <p className="m-0 mt-2 text-sm leading-7 text-[#666] dark:text-gray-300">
                Manifest V3 本地扩展，支持 Chrome 与 Edge。解压后通过浏览器扩展管理页加载。
              </p>
            </div>
            <DownloadButton className="shrink-0" />
          </div>
        </div>

        <h2>处理流程</h2>
        <div className="not-prose my-8 grid gap-3 md:grid-cols-2">
          <FeatureCard title="逐条打开">从当前待办列表选择一条尚未处理的标题，每轮只处理一条。</FeatureCard>
          <FeatureCard title="两级提交">先等待详情页的一键提交按钮，再等待弹窗内文案严格等于“提交”的按钮。</FeatureCard>
          <FeatureCard title="确认闭环">两个提交按钮消失且待办列表重新可见后，才把当前条目标记为完成。</FeatureCard>
          <FeatureCard title="异常即停">页面结构变化、按钮未出现或返回列表超时，都会停止批次并保留当前页面供人工检查。</FeatureCard>
        </div>

        <h2>安装与使用</h2>
        <ol>
          <li>下载 ZIP 并解压。</li>
          <li>Chrome 打开 <code>chrome://extensions/</code>；Edge 打开 <code>edge://extensions/</code>。</li>
          <li>开启开发者模式，点击“加载已解压的扩展程序”，选择解压目录。</li>
          <li>登录办公门户并进入待办列表，点击浏览器工具栏中的插件图标。</li>
          <li>第一次先点“单步一条”；核对真实流程完成后，再使用“连续开始”。</li>
        </ol>

        <h2>权限与安全边界</h2>
        <ul>
          <li>插件使用 <code>activeTab</code> 临时权限，只在你点击插件图标后访问当前标签页。</li>
          <li>插件不读取或保存正文、附件、联系人信息和登录凭据。</li>
          <li>标签页进入后台时暂停，回到前台后继续。</li>
          <li>默认单次最多处理 20 条，可调整为 1–200 条。</li>
          <li>当前版本适用于详情和提交弹窗处于同一标签页的页面结构；新窗口、跨域 iframe 或改版后的流程会超时停止。</li>
        </ul>

        <div className="not-prose mt-8 flex flex-wrap items-center gap-3 border-t border-[#eee] pt-6 dark:border-gray-800">
          <DownloadButton />
          <SharePageButton title={title} text={shareText} url={RESOURCE_URL} size="md" idleLabel="分享给同事" />
        </div>
      </article>
      <ArticleFooterCta />
    </PageContainer>
  )
}
