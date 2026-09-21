import Link from 'next/link'

import ArticleActionsDropdown from '../components/ArticleActionsDropdown'
import DistributeContentButton from '../components/DistributeContentButton'
import SharePageButton from '../components/SharePageButton'
import DownloadTabs from './DownloadTabs'
import {
  DOWNLOAD_ITEMS,
  DOWNLOAD_TYPE_META,
  getDownloadItemsByType,
} from '../../../lib/downloadItems'
import { getWorkStatusLabel } from '../../../lib/workItems'

export const dynamic = 'force-static'

const PAGE_PATH = '/downloads'
const PAGE_URL = `https://2aran.com${PAGE_PATH}`
const title = '下载中心 · 2aran.com'
const description = '涂阿燃维护的浏览器扩展与桌面客户端，按类型集中领取、安装。'

export const metadata = {
  title,
  description,
  keywords: ['下载中心', '浏览器扩展', 'Chrome 插件', '桌面应用', 'macOS', 'Windows', '2aran'],
  alternates: {
    canonical: PAGE_PATH,
  },
  openGraph: {
    title,
    description,
    url: PAGE_URL,
    type: 'website',
  },
}

const RELATED_DOWNLOADS = [
  {
    href: '/resources/wallpapers',
    title: '壁纸原图',
    desc: '按主题筛选后领取原图。',
  },
  {
    href: '/workbuddy-publish-center#downloads-title',
    title: 'WorkBuddy 上架包',
    desc: 'Skill 与 MCP 的 ZIP，给上架审核用。',
  },
]

function isExternalHref(href) {
  return typeof href === 'string' && href.startsWith('http')
}

function CatalogLink({ item, className = '', children }) {
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

function itemMeta(item) {
  if (item.domains?.length) return { label: 'Supported', value: item.domains.join(' / ') }
  if (item.platforms?.length) return { label: 'Platforms', value: item.platforms.join(' / ') }
  return null
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: '下载中心',
  description,
  url: PAGE_URL,
  inLanguage: 'zh-CN',
  mainEntity: {
    '@type': 'ItemList',
    numberOfItems: DOWNLOAD_ITEMS.length,
    itemListElement: DOWNLOAD_ITEMS
      .slice()
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.title,
        url: item.href.startsWith('http') ? item.href : `https://2aran.com${item.href}`,
        description: item.summary,
      })),
  },
}

export default function DownloadsPage() {
  const groups = DOWNLOAD_TYPE_META.map((type) => ({
    ...type,
    items: getDownloadItemsByType(type.id),
  }))

  return (
    <main className="min-h-screen bg-[#f2efe7] text-[#171611] dark:bg-[#0d0f12] dark:text-gray-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <section className="mx-auto max-w-[1080px] px-4 pb-5 pt-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 border-b border-[#d8d1c4] pb-8 dark:border-[#27313d] lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div>
            <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-[#6f6f40] dark:text-[#d7d7a7]">
              Download Center
            </p>
            <h1 className="mb-3 font-serif text-[38px] font-bold leading-tight text-[#15130e] dark:text-white sm:text-[52px]">
              下载中心
            </h1>
            <p className="mb-0 max-w-3xl text-[15px] leading-7 text-[#67645b] dark:text-[#a7b0be]">
              扩展和客户端集中在这里领取。点进对应页面查看版本、安装方式和领取说明。
            </p>
          </div>

          <div className="rounded-lg border border-[#d8d1c4] bg-white/60 p-4 dark:border-[#26313d] dark:bg-[#101720]/70">
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8a877d] dark:text-[#7e8a9b]">Packages</p>
                <strong className="text-3xl">{DOWNLOAD_ITEMS.length}</strong>
              </div>
              <div>
                <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8a877d] dark:text-[#7e8a9b]">Types</p>
                <strong className="text-base">扩展 / 桌面</strong>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <SharePageButton title={title} text={description} url={PAGE_URL} size="md" idleLabel="分享页面" />
              <ArticleActionsDropdown label="更多">
                <DistributeContentButton
                  title={title}
                  summary={description}
                  url={PAGE_PATH}
                  category="tools"
                  slug="downloads"
                  tags={['下载中心', '浏览器扩展', '桌面应用']}
                  kindLabel="工具"
                />
              </ArticleActionsDropdown>
            </div>
          </div>
        </div>
      </section>

      <DownloadTabs groups={groups}>
        {groups.map((group) => (
          <section
            key={group.id}
            aria-labelledby={`${group.anchor}-title`}
            className="py-7"
          >
          <div className="mb-5">
            <h2 id={`${group.anchor}-title`} className="mb-1 font-serif text-2xl font-semibold text-[#15130e] dark:text-white">
              {group.title}
            </h2>
            <p className="mb-0 text-[14px] leading-6 text-[#67645b] dark:text-[#a7b0be]">{group.description}</p>
          </div>

          <div className="grid gap-4">
            {group.items.map((item) => {
              const meta = itemMeta(item)
              return (
                <article
                  key={item.id}
                  className="grid gap-5 rounded-lg border border-[#ded8ca] bg-white/70 p-5 shadow-sm shadow-black/5 dark:border-[#252e38] dark:bg-[#101720]/[0.72] md:grid-cols-[minmax(0,1fr)_220px]"
                >
                  <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[#d8d1c4] bg-[#fbf7ee] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6f6f40] dark:border-[#3a443a] dark:bg-[#1a2118] dark:text-[#d7d7a7]">
                        {getWorkStatusLabel(item.status)}
                      </span>
                      <span className="text-[12px] text-[#7a766b] dark:text-[#8f9aaa]">{item.role}</span>
                    </div>
                    <h3 className="mb-2 text-[24px] font-bold text-[#15130e] dark:text-white">{item.title}</h3>
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
                    {meta ? (
                      <div>
                        <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#8a877d] dark:text-[#7e8a9b]">{meta.label}</p>
                        <p className="mb-0 text-sm text-[#4d493f] dark:text-[#c4ccd8]">{meta.value}</p>
                      </div>
                    ) : null}
                    <CatalogLink
                      item={item}
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#171611] bg-[#171611] px-4 py-2 text-sm font-semibold text-white no-underline transition hover:bg-[#343026] dark:border-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
                    >
                      {item.actionLabel || '打开下载页'} <span className="ml-2">→</span>
                    </CatalogLink>
                  </div>
                </article>
              )
            })}
          </div>
          </section>
        ))}
      </DownloadTabs>

      <section className="mx-auto max-w-[1080px] px-4 pb-12 sm:px-6 lg:px-8" aria-labelledby="related-downloads-title">
        <h2 id="related-downloads-title" className="mb-3 font-serif text-xl font-semibold text-[#15130e] dark:text-white">
          其他下载入口
        </h2>
        <p className="mb-4 max-w-3xl text-[14px] leading-6 text-[#67645b] dark:text-[#a7b0be]">
          壁纸原图和 WorkBuddy 上架包在各自页面领取。
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {RELATED_DOWNLOADS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg border border-[#ded8ca] bg-white/70 px-4 py-4 no-underline transition hover:border-[#171611] dark:border-[#252e38] dark:bg-[#101720]/70 dark:hover:border-white"
            >
              <strong className="block text-[15px] text-[#15130e] dark:text-white">{item.title}</strong>
              <span className="mt-1 block text-[13px] leading-6 text-[#68665e] dark:text-[#a4adba]">{item.desc}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
