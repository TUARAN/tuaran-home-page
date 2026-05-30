import Link from 'next/link'

import { SITE_CHANNELS } from '../../lib/siteNav'

export const metadata = {
  title: '站点地图 · 2aran.com',
  description: '按频道组织的全部页面入口：内容 / 项目 / 服务 / 关于。',
}

export const dynamic = 'force-static'

function ItemLink({ item }) {
  const body = (
    <span className="block">
      <span className="flex items-center gap-1.5 text-[14px] font-medium text-[#1d1a16] dark:text-gray-100">
        {item.label}
        {item.tag ? (
          <span className="rounded-full bg-[#fde6c6] px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.12em] text-[#8b5a1f] dark:bg-[#3a2c14] dark:text-[#f0c776]">
            {item.tag}
          </span>
        ) : null}
        {item.external ? (
          <span className="font-mono text-[10px] tracking-[0.12em] text-[#a09176] dark:text-[#8e9ab0]">↗</span>
        ) : null}
      </span>
      {item.desc ? (
        <span className="mt-1 block text-[12.5px] leading-snug text-[#7c7565] dark:text-[#8e98a8]">
          {item.desc}
        </span>
      ) : null}
      <span className="mt-1 block font-mono text-[10.5px] tracking-[0.04em] text-[#bcb3a1] dark:text-[#6a7585]">
        {item.href}
      </span>
    </span>
  )

  const className =
    'no-external-arrow group block rounded-2xl border border-[#ece5d8] bg-white/80 p-3 no-underline transition-all hover:-translate-y-0.5 hover:border-[#d7cbb7] hover:bg-white hover:shadow-[0_12px_30px_rgba(96,80,53,0.08)] dark:border-[#232c36] dark:bg-[#121821] dark:hover:border-[#33404d]'

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" className={className}>
        {body}
      </a>
    )
  }
  return (
    <Link href={item.href} className={className}>
      {body}
    </Link>
  )
}

export default function SiteMapPage() {
  return (
    <div className="max-w-[1120px] w-full mx-auto px-4 py-6 md:py-10">
      <header className="mb-8 rounded-[28px] border border-[#e6dfd2] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(248,245,240,0.92))] px-5 py-5 dark:border-[#27303a] dark:bg-[linear-gradient(135deg,rgba(20,24,31,0.96),rgba(13,17,23,0.92))] md:px-7 md:py-6">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[#a09176] dark:text-[#8e9ab0]">
          Site Map · 站点地图
        </p>
        <h1 className="mb-2 font-serif text-[1.56rem] font-semibold tracking-[0.03em] text-[#1d1a16] dark:text-gray-100 md:text-[1.86rem]">
          所有页面一览
        </h1>
        <p className="mb-0 max-w-[44rem] text-[14px] leading-[1.8] text-[#5f5a4d] dark:text-gray-300">
          站点共四大频道：<strong>内容</strong>（写作 / 调研 / 人文）、<strong>项目</strong>（AI / 工具）、<strong>服务</strong>（矩联 / 出版 / 社群）、<strong>关于</strong>。
          导航上找不到的页面，都在这里。
        </p>
      </header>

      <div className="space-y-8">
        {SITE_CHANNELS.map((channel) => (
          <section key={channel.key} className="rounded-[24px] border border-[#e8e2d6] bg-[#fcfbf7] p-5 dark:border-[#252d36] dark:bg-[#0f141b] md:p-6">
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <div>
                <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.22em] text-[#a09176] dark:text-[#8e9ab0]">
                  {channel.key}
                </p>
                <h2 className="mb-0 font-serif text-[1.32rem] font-semibold text-[#221f19] dark:text-gray-100">
                  {channel.label}
                </h2>
              </div>
              <Link
                href={channel.href}
                className="font-mono text-[12px] uppercase tracking-[0.12em] text-[#7f6f55] no-underline opacity-80 transition-opacity hover:opacity-100 dark:text-[#c8b99d]"
              >
                进入频道
              </Link>
            </div>
            <div className="space-y-5">
              {channel.sections.map((section) => (
                <div key={section.title}>
                  <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#9e8f75] dark:text-[#8e9ab0]">
                    {section.title}
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {section.items.map((item) => (
                      <ItemLink key={item.href + item.label} item={item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
