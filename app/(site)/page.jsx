import Link from 'next/link'
import Image from 'next/image'

import DaysSince from './components/DaysSince'
import SiteFooter from './components/SiteFooter'
import { AVATAR_PATH } from '../../lib/avatar'
import { SITE_HERO_GOAL_PARTS, SITE_HERO_TAGLINE, SITE_HERO_TITLE } from '../../lib/siteIntro'
import { getHomeFeaturedPicks, HOME_SECTION_MORE_LINKS } from '../../lib/homeHighlights'

export const dynamic = 'force-static'

const SECTION_BADGE_CLASS = {
  column: 'home-badge home-badge-column',
  research: 'home-badge home-badge-research',
  resources: 'home-badge home-badge-resource',
}

const START_PATHS = [
  {
    href: '/articles',
    label: '读文章',
    title: '从判断和长期写作开始',
    desc: '原创专栏、AI 协助调研、资料索引，按阅读价值重新组织。',
    meta: 'Column · Research · Archive',
  },
  {
    href: '/works',
    label: '看项目',
    title: '看我把想法做成系统',
    desc: '可视化页面、AI 工具、长期工程和私域工作台，保留能反复演进的作品。',
    meta: 'Systems · Tools · Interfaces',
  },
  {
    href: '/services',
    label: '聊合作',
    title: '让内容、产品和增长连起来',
    desc: '技术内容、产品调研、创作者增长和 AI 工程化协作，适合需要长期判断的项目。',
    meta: 'Consulting · Content · Growth',
  },
]

const PRODUCT_LINKS = [
  {
    href: 'https://blogger-alliance.cn/',
    label: '博主联盟',
    desc: 'AI 产品方与技术博主的连接网络',
  },
  {
    href: 'https://frontendnext.com/',
    label: '前端周看',
    desc: '前端、AI Agent 与大模型工程情报',
  },
  {
    href: 'https://publishlab.cc/',
    label: 'PublishLab',
    desc: '面向创作者的 AI 写作与出版工具',
  },
]

const BLOGGER_ALLIANCE = {
  href: 'https://blogger-alliance.cn/',
  title: '博主联盟',
  eyebrow: '推荐入口',
  subtitle: 'AI 产品方与技术博主的增长协作网络',
  desc: '连接 AI 产品方与技术博主，把产品曝光、内容种草和真实转化放进一个长期协作网络。',
  points: ['AI 产品增长', '技术博主合作', '品牌内容分发'],
}

const PROFILE_LINKS = [
  { href: '/context-memory', label: '上下文记忆' },
  { href: '/publications', label: '出版作品' },
  { href: '/map', label: '全站地图' },
]

function isExternalHref(href) {
  return typeof href === 'string' && href.startsWith('http')
}

function ArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 17L17 7M9 7h8v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function HomeFeaturedLinkItem({ item }) {
  const content = (
    <>
      <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2">
        {item.isLatest ? <span className="home-badge home-badge-latest">最新</span> : null}
        <span className={SECTION_BADGE_CLASS[item.section] || SECTION_BADGE_CLASS.column}>
          {item.sectionLabel}
        </span>
        {item.tagLabel ? <span className="home-badge home-badge-muted">{item.tagLabel}</span> : null}
        {item.date ? <time className="home-item-date">{item.date}</time> : null}
      </div>
      <p className="mb-0 line-clamp-2 text-[15px] font-semibold leading-6 text-[#191813] transition-colors group-hover:text-[#6c4c1f] dark:text-[#f2f3ed] dark:group-hover:text-[#d5d8c4]">
        {item.title}
      </p>
      {item.summary ? (
        <p className="mb-0 mt-1 line-clamp-2 text-[13px] leading-6 text-[#686a5f] dark:text-[#9ca6b4]">
          {item.summary}
        </p>
      ) : null}
    </>
  )

  const className = 'home-reading-item group no-underline'
  if (item.external || isExternalHref(item.href)) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" className={`no-external-arrow ${className}`}>
        {content}
      </a>
    )
  }
  return (
    <Link href={item.href} className={className}>
      {content}
    </Link>
  )
}

function FeaturedReading({ items }) {
  if (!items.length) return null
  return (
    <section className="home-section">
      <div className="home-section-heading">
        <div>
          <p className="home-kicker">Start here</p>
          <h2 className="home-section-title">先读这几篇</h2>
        </div>
        <div className="home-section-tabs" role="group" aria-label="按分类浏览更多内容">
          {HOME_SECTION_MORE_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="home-tab-link">
              <span>{link.label}</span>
              <ArrowIcon />
            </Link>
          ))}
        </div>
      </div>
      <div className="home-reading-list">
        {items.map((item) => (
          <HomeFeaturedLinkItem key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}

function StartPathCard({ item }) {
  return (
    <Link href={item.href} className="home-path-card group no-underline">
      <span className="home-path-label">{item.label}</span>
      <h3>{item.title}</h3>
      <p>{item.desc}</p>
      <span className="home-path-meta">
        {item.meta}
        <ArrowIcon />
      </span>
    </Link>
  )
}

function ProductLink({ item }) {
  return (
    <a href={item.href} target="_blank" rel="noreferrer" className="home-product-link no-external-arrow group">
      <span>
        <strong>{item.label}</strong>
        <small>{item.desc}</small>
      </span>
      <ArrowIcon />
    </a>
  )
}

function HeroGoalText() {
  return (
    <>
      {SITE_HERO_GOAL_PARTS.map((part, i) =>
        typeof part === 'string' ? (
          <span key={i}>{part}</span>
        ) : (
          <span key={i} className="home-emphasis">
            {part.emphasis}
          </span>
        )
      )}
    </>
  )
}

function BloggerAllianceFocus() {
  return (
    <a href={BLOGGER_ALLIANCE.href} target="_blank" rel="noreferrer" className="home-focus-card no-external-arrow">
      <span className="home-focus-kicker">{BLOGGER_ALLIANCE.eyebrow}</span>
      <h2>{BLOGGER_ALLIANCE.title}</h2>
      <p>{BLOGGER_ALLIANCE.desc}</p>
      <span className="home-focus-points">
        {BLOGGER_ALLIANCE.points.map((point) => (
          <span key={point}>{point}</span>
        ))}
      </span>
      <span className="home-focus-action">
        进入博主联盟
        <ArrowIcon />
      </span>
    </a>
  )
}

function ProfileCard() {
  return (
    <section className="home-profile" aria-label="涂阿燃个人信息">
      <div className="home-profile-top">
        <div className="home-avatar-wrap">
          <Image
            src={AVATAR_PATH}
            alt="涂阿燃"
            width={160}
            height={200}
            priority
            sizes="112px"
            className="h-auto w-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="home-profile-name">涂阿燃</p>
          <p className="home-profile-role">前端 · AI Agent · 奶爸</p>
          <p className="home-profile-company">Founder @矩联科技</p>
        </div>
      </div>
      <blockquote>
        <p>
          选一件值得投入 <strong>20 年</strong> 的事，每日复利，高频迭代。
        </p>
        <div className="home-days">
          <DaysSince />
        </div>
      </blockquote>
      <div className="home-profile-links">
        {PROFILE_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="no-underline">
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  )
}

export default function HomePage() {
  const featuredPicks = getHomeFeaturedPicks()

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="home-kicker">2aran.com · Tuaran</p>
          <div className="home-hero-brand">
            <h1>{SITE_HERO_TITLE}</h1>
            <span>{SITE_HERO_TAGLINE}</span>
          </div>
          <p className="home-hero-lead">
            <HeroGoalText />
          </p>
          <div className="home-hero-actions">
            <a href={BLOGGER_ALLIANCE.href} target="_blank" rel="noreferrer" className="home-button home-button-primary no-external-arrow">
              进入博主联盟
            </a>
            <Link href="/services" className="home-button home-button-secondary">
              合作方式
            </Link>
          </div>
        </div>

        <BloggerAllianceFocus />
      </section>

      <section className="home-paths" aria-label="站点主要入口">
        {START_PATHS.map((item) => (
          <StartPathCard key={item.href} item={item} />
        ))}
      </section>

      <div className="home-main-grid">
        <FeaturedReading items={featuredPicks} />

        <aside className="home-side-stack">
          <ProfileCard />

          <section className="home-section home-products">
            <div className="home-section-heading compact">
              <div>
                <p className="home-kicker">Products</p>
                <h2 className="home-section-title">正在经营的东西</h2>
              </div>
            </div>
            <div className="home-product-list">
              {PRODUCT_LINKS.map((item) => (
                <ProductLink key={item.href} item={item} />
              ))}
            </div>
          </section>

          <section className="home-contact-panel">
            <div>
              <p className="home-kicker">Contact</p>
              <h2>保持联系</h2>
              <p>公众号写长线判断，微信适合聊具体项目。这里保留两个入口，不把联系信息藏在页脚。</p>
            </div>
            <div className="home-qr-grid">
              <div>
                <Image src="/qrcodewechat3.png" alt="扫码加好友二维码" width={88} height={88} />
                <span>atar24</span>
              </div>
              <div>
                <Image src="/qrcode_for_gh.jpg" alt="公众号二维码" width={88} height={88} />
                <span>2aran</span>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <SiteFooter className="home-footer" />
    </main>
  )
}
