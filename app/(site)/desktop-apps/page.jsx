import Link from 'next/link'

import ArticleActionsDropdown from '../components/ArticleActionsDropdown'
import DistributeContentButton from '../components/DistributeContentButton'
import SharePageButton from '../components/SharePageButton'
import { DESKTOP_APP_WORK_ITEMS, getWorkStatusLabel } from '../../../lib/workItems'

export const dynamic = 'force-static'

const PAGE_URL = 'https://2aran.com/desktop-apps'
const title = '桌面应用 · 2aran.com'
const description = '2aran.com 维护的 Windows 与 macOS 桌面客户端下载入口。'

export const metadata = {
  title,
  description,
  keywords: ['桌面应用', 'Windows 下载', 'macOS 下载', '桌面客户端', '2aran'],
  alternates: {
    canonical: '/desktop-apps',
  },
  openGraph: {
    title,
    description,
    url: PAGE_URL,
    type: 'website',
  },
}

function isExternalHref(href) {
  return typeof href === 'string' && href.startsWith('http')
}

function AppLink({ item, className = '', children }) {
  if (isExternalHref(item.href)) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" className={`no-external-arrow ${className}`}>
        {children}
      </a>
    )
  }

  return (
    <Link href={item.href} className={className}>
      {children}
    </Link>
  )
}

export default function DesktopAppsPage() {
  const apps = [...DESKTOP_APP_WORK_ITEMS].sort((a, b) => (b.priority || 0) - (a.priority || 0))

  return (
    <main className="min-h-screen bg-[#f2efe7] text-[#171611] dark:bg-[#0d0f12] dark:text-gray-100">
      <section className="mx-auto max-w-[1080px] px-4 pb-5 pt-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 border-b border-[#d8d1c4] pb-8 dark:border-[#27313d] lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div>
            <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-[#6f6f40] dark:text-[#d7d7a7]">
              Desktop Apps
            </p>
            <h1 className="mb-3 font-serif text-[38px] font-bold leading-tight text-[#15130e] dark:text-white sm:text-[52px]">
              桌面应用
            </h1>
            <p className="mb-0 max-w-3xl text-[15px] leading-7 text-[#67645b] dark:text-[#a7b0be]">
              集中收纳可安装到 Windows 和 macOS 的桌面客户端。每个应用页都会分别给出对应系统的下载位、版本说明和安装提示。
            </p>
          </div>

          <div className="rounded-lg border border-[#d8d1c4] bg-white/60 p-4 dark:border-[#26313d] dark:bg-[#101720]/70">
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8a877d] dark:text-[#7e8a9b]">Apps</p>
                <strong className="text-3xl">{apps.length}</strong>
              </div>
              <div>
                <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8a877d] dark:text-[#7e8a9b]">Platforms</p>
                <strong className="text-base">Win / macOS</strong>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <SharePageButton title={title} text={description} url={PAGE_URL} size="md" idleLabel="分享页面" />
              <ArticleActionsDropdown label="更多">
                <DistributeContentButton
                  title={title}
                  summary={description}
                  url="/desktop-apps"
                  category="tools"
                  slug="desktop-apps"
                  tags={['桌面应用', 'Windows', 'macOS']}
                  kindLabel="工具"
                />
              </ArticleActionsDropdown>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1080px] px-4 py-7 sm:px-6 lg:px-8">
        <div className="grid gap-4">
          {apps.map((item) => (
            <article
              key={item.id}
              className="grid gap-5 rounded-lg border border-[#ded8ca] bg-white/70 p-5 shadow-sm shadow-black/5 dark:border-[#252e38] dark:bg-[#101720]/72 md:grid-cols-[minmax(0,1fr)_220px]"
            >
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[#d8d1c4] bg-[#fbf7ee] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6f6f40] dark:border-[#3a443a] dark:bg-[#1a2118] dark:text-[#d7d7a7]">
                    {getWorkStatusLabel(item.status)}
                  </span>
                  <span className="text-[12px] text-[#7a766b] dark:text-[#8f9aaa]">{item.role}</span>
                </div>
                <h2 className="mb-2 text-[24px] font-bold text-[#15130e] dark:text-white">{item.title}</h2>
                <p className="mb-4 text-[14px] leading-7 text-[#68665e] dark:text-[#a4adba]">{item.summary}</p>
                <div className="flex flex-wrap gap-1.5">
                  {item.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#ded8ca] bg-white/65 px-2.5 py-1 text-[12px] text-[#68645a] dark:border-[#303947] dark:bg-[#101721] dark:text-[#aab4c2]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col justify-between gap-4 border-t border-[#e8e1d5] pt-4 dark:border-[#252e38] md:border-l md:border-t-0 md:pl-5 md:pt-0">
                {item.platforms?.length ? (
                  <div>
                    <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#8a877d] dark:text-[#7e8a9b]">Platforms</p>
                    <p className="mb-0 text-sm text-[#4d493f] dark:text-[#c4ccd8]">{item.platforms.join(' / ')}</p>
                  </div>
                ) : null}
                <AppLink
                  item={item}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#171611] bg-[#171611] px-4 py-2 text-sm font-semibold text-white no-underline transition hover:bg-[#343026] dark:border-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
                >
                  {item.actionLabel || '查看下载'} <span className="ml-2">-&gt;</span>
                </AppLink>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
