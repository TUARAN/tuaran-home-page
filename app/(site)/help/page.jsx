import Link from 'next/link'
import {
  IconArrowRight,
  IconBook2,
  IconCoin,
  IconEdit,
  IconFileText,
  IconHistory,
  IconHome,
  IconMail,
  IconMap2,
  IconMessageCircle,
  IconRocket,
  IconShieldLock,
  IconUserCircle,
} from '@tabler/icons-react'

import PageContainer from '../components/PageContainer'

export const dynamic = 'force-static'

export const metadata = {
  title: '帮助与文档',
  description: '2aran.com 使用指南：了解本站、浏览内容、管理账号、参与讨论、使用燃币，以及查看规则和参考资料。',
  alternates: { canonical: '/help' },
}

const HELP_SECTIONS = [
  {
    id: 'getting-started',
    title: '新手入门',
    items: [
      {
        href: '/site',
        title: '认识这个站点',
        description: '了解 2aran.com 是什么、内容如何组织，以及你可以怎样参与。',
        icon: IconHome,
      },
      {
        href: '/articles',
        title: '浏览文章与分析',
        description: '从文章、调研、人物、公司和资源分类进入本站的主要内容库。',
        icon: IconBook2,
      },
      {
        href: '/account',
        title: '登录与账号',
        description: '管理站内身份、绑定登录方式，并查看账号关联和授权信息。',
        icon: IconUserCircle,
      },
    ],
  },
  {
    id: 'participation',
    title: '参与和权益',
    items: [
      {
        href: '/community',
        title: '评论与讨论',
        description: '查看全站讨论动态，在具体文章和资源下补充观点或提出问题。',
        icon: IconMessageCircle,
      },
      {
        href: '/ranbi',
        title: '燃币说明',
        description: '了解燃币如何获得、消耗和记录，以及它与资源权益之间的关系。',
        icon: IconCoin,
      },
      {
        href: '/articles?tab=resources',
        title: '查找与领取资源',
        description: '进入资源库查找资料、插件、下载内容和站长整理的专题入口。',
        icon: IconFileText,
      },
    ],
  },
  {
    id: 'reference',
    title: '规则与参考',
    items: [
      {
        href: '/editorial',
        title: '内容说明',
        description: '查看作者责任、工具使用、来源标注和内容更正机制。',
        icon: IconEdit,
      },
      {
        href: '/privacy',
        title: '隐私政策',
        description: '了解登录、评论、Cookie、访问统计和第三方服务如何处理数据。',
        icon: IconShieldLock,
      },
      {
        href: '/map',
        title: '全站导航',
        description: '按频道查看完整站点结构，快速找到没有出现在主导航里的页面。',
        icon: IconMap2,
      },
      {
        href: '/changelog',
        title: '更新记录',
        description: '按周查看本站已经完成的功能迭代、内容建设和后续计划。',
        icon: IconHistory,
      },
      {
        href: '/contact',
        title: '联系与反馈',
        description: '遇到登录、资源、内容或合作问题时，直接联系站长。',
        icon: IconMail,
      },
    ],
  },
]

function Sidebar() {
  return (
    <aside className="lg:sticky lg:top-[calc(var(--site-header-height)+1.5rem)] lg:self-start">
      <nav
        aria-label="帮助目录"
        className="flex gap-3 overflow-x-auto border-b border-[var(--site-line)] pb-4 lg:block lg:space-y-6 lg:overflow-visible lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6"
      >
        {HELP_SECTIONS.map((section) => (
          <div key={section.id} className="min-w-[190px] lg:min-w-0">
            <p className="mb-2 px-2 text-[11px] font-semibold tracking-[0.08em] text-[var(--site-faint)]">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] text-[var(--site-muted)] no-underline transition hover:bg-[var(--site-panel)] hover:text-[var(--site-ink)]"
                  >
                    <Icon size={17} stroke={1.65} aria-hidden="true" />
                    <span>{item.title}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}

function HelpCard({ item }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      className="group flex min-h-[176px] flex-col rounded-2xl border border-[var(--site-line)] bg-[color-mix(in_srgb,var(--site-panel-strong)_62%,transparent)] p-5 text-[var(--site-ink)] no-underline transition hover:-translate-y-0.5 hover:border-[var(--site-line-strong)] hover:shadow-[0_12px_30px_color-mix(in_srgb,var(--site-shadow)_38%,transparent)]"
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--site-green)_12%,var(--site-panel))] text-[var(--site-green)]">
        <Icon size={21} stroke={1.7} aria-hidden="true" />
      </span>
      <h3 className="mt-5 text-[16px] font-semibold leading-6 text-[var(--site-ink)]">{item.title}</h3>
      <p className="mt-2 text-[13.5px] leading-6 text-[var(--site-muted)]">{item.description}</p>
      <IconArrowRight
        size={17}
        stroke={1.7}
        className="mt-auto pt-4 box-content text-[var(--site-faint)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--site-accent)]"
        aria-hidden="true"
      />
    </Link>
  )
}

export default function HelpPage() {
  return (
    <PageContainer className="py-8 md:py-12">
      <div className="grid gap-8 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-12">
        <Sidebar />

        <div className="min-w-0">
          <header className="pb-8 md:pb-10">
            <div className="inline-flex items-center gap-2 text-[12px] font-semibold text-[var(--site-green)]">
              <IconRocket size={17} stroke={1.7} aria-hidden="true" />
              新手入门
            </div>
            <h1 className="mt-3 font-serif text-[34px] font-semibold leading-tight text-[var(--site-ink)] md:text-[42px]">
              帮助与文档
            </h1>
            <p className="mt-3 max-w-2xl text-[14px] leading-7 text-[var(--site-muted)]">
              从浏览内容到参与讨论，这里集中整理本站的使用指南、机制说明与参考入口。
            </p>
          </header>

          <div className="space-y-12">
            {HELP_SECTIONS.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="mb-4 text-[13px] font-semibold tracking-[0.06em] text-[var(--site-muted)]">
                  {section.title}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {section.items.map((item) => <HelpCard key={item.href} item={item} />)}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
