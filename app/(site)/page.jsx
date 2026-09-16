import Link from 'next/link'
import Image from 'next/image'
import {
  IconBrandBaidu,
  IconBrandJuejin,
  IconBrandTopbuzz,
  IconBrandWeibo,
  IconBrandX,
  IconBrandZhihu,
  IconArchive,
  IconBuildingSkyscraper,
  IconBulb,
  IconCloud,
  IconCode,
  IconCodeCircle,
  IconCoin,
  IconEye,
  IconFeather,
  IconFileText,
  IconHeartHandshake,
  IconMessages,
  IconNews,
  IconPointer,
  IconRobot,
  IconSchool,
  IconTools,
  IconUserCircle,
  IconUsers,
} from '@tabler/icons-react'

import DaysSince from './components/DaysSince'
import HomeSpacexEgg from './components/HomeSpacexEgg'
import { HomeHeroGoal } from './components/HomeHeroGoal'
import HomeOpenClawAchievement from './components/HomeOpenClawAchievement'
import { T } from './components/LocaleProvider'
import SiteFooter from './components/SiteFooter'
import HomeDiscoveryPanel from './components/HomeDiscoveryPanel'
import HomeFeaturedReadingClient from './components/HomeFeaturedReadingClient'
import { HomeInspirations } from './components/HomePrimaryColumnsClient'
import { HOME_MOBILE_CHANNELS } from '../../lib/siteMobileNav'
import { AVATAR_PATH } from '../../lib/avatar'
import { SITE_HERO_TAGLINE, SITE_HERO_TITLE } from '../../lib/siteIntro'
import { getHomeRecommendationCatalog } from '../../lib/homeHighlights'
import { HOME_RECOMMENDATION_MAX_BATCH_SIZE } from '../../lib/homeRecommendationEngine'
import { getFeedItemsWithPinned } from './feed/data'
import { SECONDARY_SITES } from '../../lib/secondarySites'
import HomeOpinionSignals from './components/HomeOpinionSignals'

const weeklySite = SECONDARY_SITES.find((site) => site.id === 'weekly')
const syncblogSite = SECONDARY_SITES.find((site) => site.id === 'syncblog')

const SITE_HERO_TITLE_EN = 'Frontend · AI Engineering · and a Dad'
const SITE_HERO_TAGLINE_EN = 'Writing code, raising a family, building for the long run'
const MATRIXLINK_URL = 'https://matrixlink.tech/'
const HOME_PINNED_INSPIRATION_IDS = ['gemma-4-agent-vllm-challenge']

export const dynamic = 'force-static'

const SECTION_BADGE_CLASS = {
  column: 'home-badge home-badge-column',
  research: 'home-badge home-badge-research',
  resources: 'home-badge home-badge-resource',
  tools: 'home-badge home-badge-resource',
  feed: 'home-badge home-badge-feed',
}

const HOME_EXPLORE_GROUPS = [
  {
    id: 'read',
    label: '内容与研究',
    labelEn: 'Read & research',
    tone: 'knowledge',
    items: [
      { id: 'learn-ai', href: '/articles?subject=ai_dev', title: 'AI 与开发', titleEn: 'AI & development', desc: '模型、Agent 与开发工具', descEn: 'Models, agents and developer tools', icon: IconRobot },
      { id: 'companies', href: '/articles?subject=company_research', title: '公司调研', titleEn: 'Company research', desc: '公司画像与商业分析', descEn: 'Companies and business analysis', icon: IconBuildingSkyscraper },
      { id: 'practice', href: '/articles?group=practice', title: '工程实践', titleEn: 'Engineering practice', desc: '案例、实作与指南', descEn: 'Cases, build logs and guides', icon: IconTools },
      { id: 'subscribe', href: '/frontend-weekly', title: '前端周看', titleEn: 'Frontend Weekly', desc: '前端与 AI 工程情报', descEn: 'Frontend and AI engineering briefings', icon: IconNews },
    ],
  },
  {
    id: 'make',
    label: '作品与资源',
    labelEn: 'Works & resources',
    tone: 'works',
    items: [
      { id: 'interactive', href: '/rich-pages', title: '互动专题', titleEn: 'Interactives', desc: '可筛选、可操作的内容', descEn: 'Filterable, interactive stories', icon: IconPointer },
      { id: 'works', href: '/works', title: '原创项目', titleEn: 'Original projects', desc: '产品、工具与实验作品', descEn: 'Products, tools and experiments', icon: IconBulb },
      { id: 'resources', href: '/articles?group=resource', title: '资源', titleEn: 'Resources', desc: '档案、下载与收藏', descEn: 'Archives, downloads and bookmarks', icon: IconArchive },
      { id: 'workbuddy', href: 'https://workbuddy.2aran.com/', title: 'WorkBuddy 学习手册', titleEn: 'WorkBuddy guides', desc: '手册、案例与课程', descEn: 'Guides, cases and courses', icon: IconSchool, external: true, analyticsId: 'workbuddy' },
    ],
  },
  {
    id: 'connect',
    label: '关于与连接',
    labelEn: 'About & connect',
    tone: 'collaborate',
    items: [
      { id: 'about', href: '/about', title: '了解作者', titleEn: 'About the author', desc: '经历与长期方向', descEn: 'Background and long-term direction', icon: IconUserCircle },
      { id: 'community', href: '/community', title: '交友进社群', titleEn: 'Join the community', desc: '认识同行、交流实践', descEn: 'Meet peers and share practice', icon: IconMessages },
      { id: 'blogger-alliance', href: 'https://blogger-alliance.cn/', title: '合作推广', titleEn: 'Collaboration', desc: '博主联盟与项目合作', descEn: 'Blogger Alliance and partnerships', icon: IconHeartHandshake, external: true, analyticsId: 'blogger-alliance' },
    ],
  },
  {
    id: 'more',
    label: '其他站点',
    labelEn: 'More sites',
    tone: 'external',
    collapsed: true,
    items: [
      { id: 'poetry', href: 'https://poemcn.2aran.com/', title: '阿燃诗词', titleEn: 'Aran Poetry', desc: '古典诗词作品', descEn: 'Classical Chinese poetry', icon: IconFeather, external: true },
      { id: 'codex-credit', href: 'https://gptplus.2aran.com', title: '低价 Codex 直充', titleEn: 'Codex credits', desc: '独立服务入口', descEn: 'Independent service', icon: IconCoin, external: true },
    ],
  },
]

const SOCIAL_MEDIA_LINKS = [
  {
    href: 'https://juejin.cn/user/1521379823340792',
    label: '掘金',
    labelEn: 'Juejin',
    followers: '1.2w',
    followersCount: 12000,
    reads: '300w+',
    icon: IconBrandJuejin,
  },
  {
    href: 'https://www.xiaohongshu.com/user/profile/68b313f9000000001901d07e',
    label: '小红书',
    labelEn: 'RedNote',
    followers: '1.2w',
    followersCount: 12000,
    reads: '200w+',
    icon: IconFileText,
  },
  {
    href: 'https://x.com/tarsixseveneig1',
    label: 'X 平台',
    labelEn: 'X',
    followers: '5.1k',
    followersCount: 5100,
    reads: '200w',
    icon: IconBrandX,
  },
  {
    href: 'https://blog.csdn.net/aifs2025',
    label: 'CSDN',
    labelEn: 'CSDN',
    followers: '5k',
    followersCount: 5000,
    reads: '28.4w',
    icon: IconCode,
    accounts: [
      { label: 'aifs2025', href: 'https://blog.csdn.net/aifs2025?spm=1003.2018.3001.10640' },
      { label: 'Anthony1453', href: 'https://blog.csdn.net/Anthony1453' },
    ],
  },
  {
    href: 'https://weibo.com/',
    label: '微博',
    labelEn: 'Weibo',
    followers: '3k',
    followersCount: 3014,
    reads: '<2w',
    icon: IconBrandWeibo,
  },
  {
    href: 'https://www.toutiao.com/',
    label: '今日头条',
    labelEn: 'Toutiao',
    followers: '<1k',
    followersCount: 709,
    reads: '12.9w',
    icon: IconBrandTopbuzz,
  },
  {
    href: 'https://www.zhihu.com/',
    label: '知乎',
    labelEn: 'Zhihu',
    followers: '<1k',
    followersCount: 345,
    reads: '38w',
    icon: IconBrandZhihu,
  },
  {
    href: 'https://www.oschina.net/',
    label: '开源中国',
    labelEn: 'OSChina',
    followers: '<1k',
    followersCount: 100,
    reads: '<2w',
    icon: IconCodeCircle,
  },
  {
    href: 'https://www.infoq.cn/',
    label: 'InfoQ',
    labelEn: 'InfoQ',
    followers: '<1k',
    followersCount: 100,
    reads: '<2w',
    icon: IconFileText,
  },
  {
    href: 'https://baijiahao.baidu.com/',
    label: '百家号',
    labelEn: 'Baijiahao',
    followers: '<1k',
    followersCount: 100,
    reads: '<2w',
    icon: IconBrandBaidu,
  },
  {
    href: 'https://cloud.tencent.com/developer',
    label: '腾讯云',
    labelEn: 'Tencent Cloud',
    followers: '<1k',
    followersCount: 100,
    reads: '<2w',
    icon: IconCloud,
  },
  {
    href: 'https://developer.aliyun.com/',
    label: '阿里云',
    labelEn: 'Alibaba Cloud',
    followers: '<1k',
    followersCount: 100,
    reads: '<2w',
    icon: IconCloud,
  },
  {
    href: 'https://developer.huaweicloud.com/',
    label: '华为云',
    labelEn: 'Huawei Cloud',
    followers: '<1k',
    followersCount: 100,
    reads: '<2w',
    icon: IconCloud,
  },
  {
    href: 'https://segmentfault.com/',
    label: '思否',
    labelEn: 'SegmentFault',
    followers: '<1k',
    followersCount: 100,
    reads: '<2w',
    icon: IconCode,
  },
  {
    href: 'https://blog.51cto.com/u_15298598',
    label: '51CTO',
    labelEn: '51CTO',
    followers: '<1k',
    followersCount: 21,
    reads: '17.1w',
    icon: IconCode,
  },
]

const ORDERED_SOCIAL_MEDIA_LINKS = SOCIAL_MEDIA_LINKS
  .map((item, index) => ({ ...item, priority: index < 3, rank: index + 1 }))

const PRIMARY_SOCIAL_MEDIA_LINKS = ORDERED_SOCIAL_MEDIA_LINKS.slice(0, 3)

const SOCIAL_MEDIA_TOTALS = {
  followers: '3.5w+',
  reads: '600w+',
}

const HOME_ACHIEVEMENT_LINKS = [
  {
    href: '/publications',
    title: '技术作品出版 · 2 本',
    compact: true,
    emoji: '📖',
    image: '/images/books/ai-bots-guide.png',
    imageAlt: '《扣子：AI Bots 通关指南》掘金小册封面',
    icon: IconFileText,
  },
]

const CLASSIC_SITE_HERO_TAGLINE = `${SITE_HERO_TITLE}：${SITE_HERO_TAGLINE}`
const CLASSIC_SITE_HERO_TAGLINE_EN = `${SITE_HERO_TITLE_EN}: ${SITE_HERO_TAGLINE_EN}`

function HomeMobileChannels() {
  return (
    <nav className="home-mobile-channels md:hidden" aria-label="首页频道">
      {HOME_MOBILE_CHANNELS.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={item.key === 'feed' ? 'is-active' : undefined}
          data-analytics-event="entry_click"
          data-analytics-surface="home_mobile_channel"
          data-analytics-destination-kind="page"
          data-analytics-destination-id={item.key}
        >
          <T zh={item.label} en={item.labelEn} />
        </Link>
      ))}
    </nav>
  )
}

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

function ClassicFeaturedLinkItem({ item }) {
  const className =
    'group block rounded-xl px-2 py-2 no-underline transition hover:bg-[#f4f0f8] dark:hover:bg-[#18202a]'
  const content = (
    <>
      <div className="mb-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        {item.isLatest ? (
          <span className="home-badge home-badge-latest shrink-0">
            <T zh="最新" en="Latest" />
          </span>
        ) : null}
        <span
          className={[
            'min-w-0 shrink truncate',
            SECTION_BADGE_CLASS[item.section] || SECTION_BADGE_CLASS.column,
          ].join(' ')}
        >
          {item.sectionLabel}
        </span>
        {item.tagLabel ? (
          <span className="home-badge home-badge-muted min-w-0 shrink truncate">
            {item.tagLabel}
          </span>
        ) : null}
        {item.date ? (
          <span className="home-item-date shrink-0 whitespace-nowrap">
            {item.date}
          </span>
        ) : null}
      </div>
      <p className="mb-0 line-clamp-2 text-[13.5px] font-medium leading-5 text-[#1a1814] group-hover:text-[#49345f] dark:text-gray-100 dark:group-hover:text-[#d8c5f3]">
        {item.title}
      </p>
      {item.summary ? (
        <p className="mb-0 mt-0.5 line-clamp-1 text-[12px] leading-5 text-[#716779] dark:text-gray-400">
          {item.summary}
        </p>
      ) : null}
    </>
  )

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

function ClassicFeaturedSection({ items }) {
  if (!items.length) return null
  return (
    <section className="classic-home-surface-panel rounded-[24px] border p-5 shadow-[0_12px_40px_var(--hero-shadow)] dark:border-[#252d36] dark:bg-[#0f141b] dark:shadow-none md:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[#8e8798] dark:text-[#8e9ab0]">
            Start Here
          </p>
          <h2 className="classic-home-section-title"><T zh="推荐阅读" en="Recommended reading" /></h2>
        </div>
      </div>
      <div className="classic-home-surface-card rounded-2xl border p-3">
        <div className="space-y-1">
          {items.map((item) => (
            <ClassicFeaturedLinkItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  )
}

function SocialMediaCard({ item }) {
  const Icon = item.icon
  const showFollowers = !item.followers.startsWith('<')
  const showReads = !item.reads.startsWith('<')
  const ariaLabel = [
    item.label,
    showFollowers ? `${item.followers} followers` : null,
    showReads ? `${item.reads} views` : null,
  ].filter(Boolean).join(', ')
  const content = (
    <>
      <span className="home-social-icon" aria-hidden="true">
        <Icon size={item.priority ? 24 : 18} stroke={1.8} />
      </span>
      <span className="home-social-main">
        {item.priority ? <small>TOP {item.rank}</small> : null}
        <strong><T zh={item.label} en={item.labelEn} /></strong>
      </span>
      {!item.accounts && (showFollowers || showReads) ? (
        <span className="home-social-metrics" aria-hidden="true">
          {showFollowers ? <span><IconUsers size={11} stroke={1.8} />{item.followers}</span> : null}
          {showReads ? <span><IconEye size={11} stroke={1.8} />{item.reads}</span> : null}
        </span>
      ) : null}
    </>
  )

  if (item.accounts) {
    return (
      <div className="home-social-card" aria-label={ariaLabel} tabIndex={0}>
        {content}
        <div className="home-social-account-picker">
          <div className="home-social-account-summary" aria-hidden="true">
            {showFollowers ? <span><IconUsers size={11} stroke={1.8} />{item.followers}</span> : null}
            {showReads ? <span><IconEye size={11} stroke={1.8} />{item.reads}</span> : null}
          </div>
          <div className="home-social-account-links">
            {item.accounts.map((account) => (
              <a
                key={account.href}
                href={account.href}
                target="_blank"
                rel="noreferrer"
                className="no-external-arrow"
              >
                {account.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <a
      href={item.href}
      target="_blank"
      rel="noreferrer"
      className={item.priority ? 'home-social-card is-priority no-external-arrow group' : 'home-social-card no-external-arrow group'}
      aria-label={ariaLabel}
    >
      {content}
    </a>
  )
}

function AchievementMiniCard({ item }) {
  const Icon = item.icon
  const content = item.compact ? (
    <>
      {item.image ? (
        <span className="home-achievement-compact-media" aria-hidden="true">
          <Image src={item.image} alt="" width={48} height={48} sizes="36px" unoptimized />
        </span>
      ) : null}
      <strong>{item.emoji ? `${item.emoji} ` : ''}{item.title}</strong>
    </>
  ) : (
    <>
      {item.image ? (
        <span className="home-achievement-media-slot">
          <span className="home-achievement-card-cover">
            <Image src={item.image} alt={item.imageAlt || ''} width={96} height={96} sizes="80px" unoptimized />
          </span>
        </span>
      ) : (
        <span className="home-achievement-card-icon" aria-hidden="true">
          <Icon size={19} stroke={1.8} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="home-achievement-kicker">{item.kicker}</span>
        <strong>{item.title}</strong>
        <small>{item.desc}</small>
      </span>
    </>
  )

  if (isExternalHref(item.href)) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" className={`home-achievement-card no-external-arrow ${item.compact ? 'is-compact' : ''}`}>
        {content}
      </a>
    )
  }

  return (
    <Link href={item.href} className={`home-achievement-card ${item.compact ? 'is-compact' : ''}`}>
      {content}
    </Link>
  )
}

function BuilderAndSignalsPanel() {
  return (
    <section className="home-section home-builder-panel">
      <div className="home-section-heading compact">
        <div>
          <p className="home-kicker">Public Opinion</p>
          <h2 className="home-section-title"><T zh="舆情分析" en="Opinion signals" /></h2>
        </div>
        <Link href="/public-opinion" className="home-section-more no-underline">
          <T zh="工作台" en="Dashboard" /> <span aria-hidden="true">→</span>
        </Link>
      </div>

      <HomeOpinionSignals />

      <div className="home-builder-group">
        <p className="home-builder-subtitle"><T zh="站长成就" en="Owner highlights" /></p>
        <div className="home-achievement-list">
          <HomeOpenClawAchievement />
          {HOME_ACHIEVEMENT_LINKS.map((item) => (
            <AchievementMiniCard key={item.title} item={item} />
          ))}
        </div>
      </div>

      <div className="home-builder-group">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="home-builder-subtitle mb-0">
            <T zh={`主要平台 · ${SOCIAL_MEDIA_TOTALS.followers} 关注`} en={`Main channels · ${SOCIAL_MEDIA_TOTALS.followers} followers`} />
          </p>
          <Link href="/about" className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--site-faint)] no-underline hover:text-[var(--site-ink)]">
            <T zh="履历 →" en="About →" />
          </Link>
        </div>
        <div className="home-social-grid">
          <div className="home-social-priority-grid">
            {PRIMARY_SOCIAL_MEDIA_LINKS.map((item) => (
              <SocialMediaCard key={item.label} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function ProfileCard() {
  return (
    <section id="personal" className="home-profile scroll-mt-24" aria-label="Profile">
      <div className="home-profile-inner">
        <div className="home-profile-spacex-bg" aria-hidden="true">
          <Image
            src="/images/brand/spacex-logo.webp"
            alt=""
            width={3840}
            height={480}
            unoptimized
            className="home-profile-spacex-mark"
          />
        </div>
        <div className="home-profile-heading">
          <div>
            <p className="home-kicker">03 · About</p>
            <h2 className="home-section-title"><T zh="站长" en="Site owner" /></h2>
          </div>
          <Link href="/about" className="home-section-more no-underline">
            <T zh="更多" en="More" /> <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="home-profile-top">
          <Link
            href="/about"
            className="home-profile-person"
            data-analytics-event="entry_click"
            data-analytics-surface="home_profile"
            data-analytics-destination-kind="page"
            data-analytics-destination-id="/about"
          >
            <div className="home-avatar-wrap">
              <Image
                src={AVATAR_PATH}
                alt="TUARAN"
                width={160}
                height={200}
                priority
                unoptimized
                sizes="112px"
                className="h-auto w-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="home-profile-name"><T zh="涂阿燃" en="TUARAN" /></p>
              <p className="home-profile-role">
                <T
                  zh={
                    <>
                      <span className="home-profile-role-line">输入决定输出</span>
                      <span className="home-profile-role-pause">，</span>
                      <span className="home-profile-role-line home-profile-role-line-end">输出暴露输入</span>
                    </>
                  }
                  en={
                    <>
                      <span className="home-profile-role-line">Input shapes output</span>
                      <span className="home-profile-role-pause">;</span>{' '}
                      <span className="home-profile-role-line home-profile-role-line-end">output reveals input</span>
                    </>
                  }
                />
              </p>
            </div>
          </Link>
          <HomeSpacexEgg />
        </div>
        <div className="home-profile-days">
          <DaysSince compact />
        </div>
      </div>
    </section>
  )
}

function CompanyOfficialLink({ children }) {
  return (
    <a
      href={MATRIXLINK_URL}
      target="_blank"
      rel="noreferrer"
      className="home-company-link no-external-arrow"
    >
      {children}
    </a>
  )
}

function FounderCompanyText() {
  return (
    <T
      zh={<>Founder @<CompanyOfficialLink>矩联科技</CompanyOfficialLink></>}
      en={<>Founder @<CompanyOfficialLink>Julian Tech</CompanyOfficialLink></>}
    />
  )
}

function DigitalCommonsHero() {
  return (
    <section className="commons-hero" aria-labelledby="commons-title">
      <div className="commons-hero-image" aria-hidden="true" />
      <div className="commons-hero-shade" aria-hidden="true" />
      <a href="https://2aran.com" className="commons-stable-link">
        <span>BETA</span>
        <T zh="返回稳定版" en="Back to stable" />
        <i aria-hidden="true">↗</i>
      </a>

      <div className="commons-hero-copy">
        <p className="commons-eyebrow">
          <span>2ARAN DIGITAL COMMONS</span>
          <span>PUBLIC BUILD · 2026</span>
        </p>
        <h1 id="commons-title" className="commons-equation">
          <span>AI</span>
          <b>+</b>
          <span>WEB3</span>
          <b>==</b>
          <em><T zh="共产" en="COMMONS" /></em>
          <i aria-hidden="true">🔨</i>
        </h1>
        <p className="commons-lead">
          <T
            zh={<>机器扩大生产力，协议记录贡献，<strong>知识与工具由创造者共同建设。</strong></>}
            en={<>Machines expand production, protocols record contribution, and <strong>creators build shared knowledge and tools.</strong></>}
          />
        </p>
        <div className="commons-actions">
          <Link href="/articles" className="commons-button commons-button-primary">
            <T zh="进入数字公社" en="Enter the digital commons" />
            <span aria-hidden="true">→</span>
          </Link>
          <Link href="/onchain-blog" className="commons-button commons-button-secondary">
            <T zh="了解共建机制" en="How the commons works" />
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>

      <div className="commons-principle" aria-label="数字公社运行原则">
        <span><b>AI</b><T zh="生产" en="Produce" /></span>
        <i aria-hidden="true">×</i>
        <span><b>WEB3</b><T zh="协作" en="Coordinate" /></span>
        <i aria-hidden="true">→</i>
        <span><b>COMMONS</b><T zh="共享" en="Share" /></span>
      </div>

    </section>
  )
}

function HomeOwnerStory() {
  return (
    <section id="personal" className="home-story-slide home-owner-story" aria-labelledby="home-owner-title">
      <div className="home-owner-portrait">
        <Image
          src={AVATAR_PATH}
          alt="TUARAN"
          width={720}
          height={900}
          priority
          unoptimized
          sizes="(min-width: 1024px) 38vw, 90vw"
        />
        <span>TUARAN · ANTHONY</span>
      </div>
      <div className="home-owner-copy">
        <p className="home-kicker">04 · The Builder</p>
        <h2 id="home-owner-title"><T zh="涂阿燃" en="TUARAN" /></h2>
        <p className="home-owner-role"><T zh="前端工程师、Agent 工程师，也是一个孩子的爸爸。" en="Frontend engineer, agent engineer, and a dad." /></p>
        <p className="home-owner-statement">
          <T
            zh="持续写作，持续创造，把个人经验整理成任何人都能使用的知识与工具。"
            en="Writing and building in public, turning personal experience into knowledge and tools anyone can use."
          />
        </p>
        <div className="home-owner-stats" aria-label="站长公开创作数据">
          <span><strong>1,500+</strong><T zh="公开内容" en="Public works" /></span>
          <span><strong>600w+</strong><T zh="全网阅读" en="Total reads" /></span>
          <span><strong>20 年</strong><T zh="长期投入" en="Long horizon" /></span>
        </div>
        <Link href="/about" className="home-owner-link">
          <T zh="认识站长" en="Meet the builder" /> <span aria-hidden="true">→</span>
        </Link>
      </div>
      <p className="home-slide-index" aria-hidden="true">04 / 04</p>
    </section>
  )
}

function ClassicHomePage({ featuredPicks }) {
  return (
    <main className="home-classic-root mx-auto flex w-full max-w-[1880px] flex-1 flex-col px-4 pt-2 pb-9 sm:px-6 md:pt-3 md:pb-12 lg:px-10">
      <section className="mb-14 flex-1">
        <header className="classic-home-hero relative mb-12 overflow-hidden rounded-[28px] border px-6 py-7 md:px-12 md:py-10">
          <div className="classic-home-hero-glow pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] lg:block" />
          <div className="classic-home-hero-watermark pointer-events-none absolute right-10 top-1/2 hidden -translate-y-1/2 font-mono text-[3.2rem] font-semibold uppercase leading-none tracking-[0.16em] lg:block xl:right-20 2xl:text-[4.4rem]">
            2ARAN.COM
          </div>
          <div className="relative max-w-[1260px] space-y-7">
            <div className="space-y-7">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="mb-0 font-mono text-[11px] uppercase tracking-[0.28em] text-[#858779] dark:text-[#9ca5b5] md:text-[15px]">
                      <T zh="涂阿燃｜安东尼 · Agent 工程师" en="TUARAN | Anthony · Agent Engineer" />
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <h1 className="mb-0 max-w-[68rem] font-serif text-[1.72rem] font-semibold leading-[1.28] tracking-[0.03em] text-[#1d1a16] dark:text-[#f3f4f6] md:text-[2.28rem] xl:text-[2.6rem]">
                    <T zh={CLASSIC_SITE_HERO_TAGLINE} en={CLASSIC_SITE_HERO_TAGLINE_EN} />
                  </h1>
                  <p className="mb-0 max-w-[64rem] font-serif text-[1.12rem] font-medium leading-[1.65] tracking-[0.02em] text-[#24251f] dark:text-[#e1e2dc] md:text-[1.48rem]">
                    <HomeHeroGoal variant="classic" />
                    <T zh="。" en="." />
                  </p>
                </div>
              </div>
              <div className="mt-1 flex flex-wrap items-stretch gap-4">
                <a
                  href="https://blogger-alliance.cn/"
                  target="_blank"
                  rel="noreferrer"
                  className="classic-home-hero-cta-primary no-external-arrow group inline-flex w-full items-center gap-4 rounded-xl border px-5 py-4 no-underline hover:-translate-y-0.5 sm:w-auto sm:min-w-[320px] sm:max-w-[400px]"
                >
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: 'var(--hero-cta-icon-bg)', color: 'var(--hero-cta-icon-text)' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M4 7h16M4 12h10M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span className="flex min-w-0 flex-col text-left">
                    <span className="flex items-center gap-1 text-[18px] font-semibold" style={{ color: 'var(--hero-cta-text)' }}>
                      <T zh="加入博主联盟" en="Join Blogger Alliance" />
                      <span className="font-mono text-[12px] tracking-[0.08em] opacity-70">→</span>
                    </span>
                    <span className="mt-1 text-[15px] leading-snug" style={{ color: 'var(--hero-cta-subtext)' }}>
                      <T zh="AI 产品方 ↔ 技术博主 · 品牌增长" en="AI products ↔ tech bloggers · brand growth" />
                    </span>
                  </span>
                </a>
                <a
                  href={weeklySite.href}
                  target="_blank"
                  rel="noreferrer"
                  className="classic-home-hero-cta-secondary no-external-arrow group inline-flex w-full items-center gap-4 rounded-xl border px-5 py-4 no-underline hover:-translate-y-0.5 sm:w-auto sm:min-w-[320px] sm:max-w-[400px]"
                >
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: 'var(--hero-card-icon-bg)', color: 'var(--hero-card-icon-text)' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M4 6l8 8 8-8M4 13l8 8 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="flex min-w-0 flex-col text-left">
                    <span className="flex items-center gap-1 text-[18px] font-semibold" style={{ color: 'var(--hero-card-title)' }}>
                      <T zh="订阅前端周看" en="Subscribe to Frontend Weekly" />
                      <span className="font-mono text-[12px] tracking-[0.08em] opacity-60">↗</span>
                    </span>
                    <span className="mt-1 text-[15px] leading-snug" style={{ color: 'var(--hero-card-subtext)' }}>
                      <T zh={weeklySite.desc} en={weeklySite.descEn} />
                    </span>
                  </span>
                </a>
                <a
                  href={syncblogSite.href}
                  target="_blank"
                  rel="noreferrer"
                  className="classic-home-hero-cta-secondary no-external-arrow group inline-flex w-full items-center gap-4 rounded-xl border px-5 py-4 no-underline hover:-translate-y-0.5 sm:w-auto sm:min-w-[320px] sm:max-w-[400px]"
                >
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: 'var(--hero-card-icon-bg)', color: 'var(--hero-card-icon-text)' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M5 5h14v14H5zM8 9h8M8 13h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="flex min-w-0 flex-col text-left">
                    <span className="flex items-center gap-1 text-[18px] font-semibold" style={{ color: 'var(--hero-card-title)' }}>
                      <T zh="使用AI分发大师" en="Use SyncBlog" />
                      <span className="font-mono text-[12px] tracking-[0.08em] opacity-60">↗</span>
                    </span>
                    <span className="mt-1 text-[15px] leading-snug" style={{ color: 'var(--hero-card-subtext)' }}>
                      <T zh={syncblogSite.desc} en={syncblogSite.descEn} />
                    </span>
                  </span>
                </a>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_480px]">
          <div className="min-w-0 space-y-6">
            <ClassicFeaturedSection items={featuredPicks} />
          </div>

          <aside className="w-full space-y-6">
            <section className="classic-home-surface-panel rounded-[24px] border p-5 shadow-[0_8px_32px_var(--hero-shadow)] dark:border-[#252d36] dark:bg-[#10151d] dark:shadow-none md:p-6">
              <div className="mb-5 border-b border-[#dee0db] pb-5 text-center dark:border-gray-800/80">
                <div className="mx-auto w-[152px] overflow-hidden bg-[var(--page-bg)] dark:bg-[#0f1318] xl:w-[200px]">
                  <Image
                    src={AVATAR_PATH}
                    alt="TUARAN"
                    width={220}
                    height={220}
                    priority
                    unoptimized
                    sizes="(min-width: 1280px) 200px, 152px"
                    className="h-auto w-full object-cover shadow-none"
                  />
                </div>
                <p className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#7e7488] dark:text-gray-400">
                  <T
                    zh={<>FDE・KOL・OPC｜<FounderCompanyText /></>}
                    en={<>FDE · KOL · OPC | <FounderCompanyText /></>}
                  />
                </p>
                <p className="mt-1 text-[12px] tracking-[0.06em] text-[#888] dark:text-gray-500">
                  <T zh="记录 AI 实践、社会洞察、生活随笔" en="AI practice, social insights, life notes" />
                </p>
                <blockquote className="mx-auto mt-3 max-w-[min(280px,100%)]">
                  <p className="font-serif text-[15px] leading-[1.9] tracking-wide text-[#262724] dark:text-gray-200">
                    <T
                      zh={<>选一件值得投入 <span className="font-semibold">20 年</span> 的事，<span className="mt-0.5 block">每日复利，高频迭代。</span></>}
                      en={<>Pick one thing worth <span className="font-semibold">20 years</span>,<span className="mt-0.5 block">compound daily, iterate fast.</span></>}
                    />
                  </p>
                  <div className="mt-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#8e8798] dark:text-gray-500">
                    <span aria-hidden="true" className="h-px flex-1 bg-[#d9d2e2] dark:bg-gray-700" />
                    <span>This time · with LLM</span>
                    <span aria-hidden="true" className="h-px flex-1 bg-[#d9d2e2] dark:bg-gray-700" />
                  </div>
                  <div className="mt-2.5 flex justify-center">
                    <DaysSince />
                  </div>
                </blockquote>
                <Link
                  href="/articles"
                  className="mt-2 inline-flex items-center rounded-full border border-[#d6d0df] bg-white/[0.78] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#625d70] no-underline transition hover:border-[#b9a6c9] hover:text-[#20172f] dark:border-[#303947] dark:bg-[#151c25] dark:text-gray-300 dark:hover:border-[#435062] dark:hover:text-gray-100"
                >
                  <T zh="查看精选内容" en="Explore selected writing" />
                </Link>
              </div>
              <div className="mt-5 border-t border-[#dee0db] pt-4 dark:border-gray-800/80">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="mb-0 font-mono text-[10px] uppercase tracking-[0.2em] text-[#858779] dark:text-[#8e9ab0]">
                    More
                  </p>
                  <Link
                    href="/help#about-site"
                    className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#646655] no-underline opacity-80 transition-opacity hover:opacity-100 dark:text-[#acaf9d]"
                  >
                    <T zh="站点说明 →" en="About this site →" />
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { href: '/publications', label: '出版', labelEn: 'Books' },
                    { href: '/about', label: '站长', labelEn: 'Owner' },
                    { href: '/works', label: '产品', labelEn: 'Products' },
                  ].map((card) => (
                    <Link
                      key={card.href}
                      href={card.href}
                      className="no-external-arrow rounded-xl border border-[#d6d7cf] bg-white/70 px-2 py-2 text-center text-[12px] font-medium text-[#52534c] no-underline transition hover:border-[#b9bbad] hover:text-[#15140f] dark:border-[#303947] dark:bg-[#151c25] dark:text-[#aeb8c6] dark:hover:border-[#435062] dark:hover:text-gray-100"
                    >
                      <T zh={card.label} en={card.labelEn} />
                    </Link>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-[#646655] dark:text-[#acaf9d]">
                  <span><T zh="微信 atar24" en="WeChat atar24" /></span>
                  <span aria-hidden="true">·</span>
                  <Link href="/donate" className="text-inherit underline-offset-2 hover:underline">
                    <T zh="请我喝咖啡" en="Buy me a coffee" />
                  </Link>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </section>

      <section>
        <SiteFooter />
      </section>
    </main>
  )
}

function PolishedHomePage({ featuredPicks, inspirations }) {
  return (
    <main className="home-polished-root home-page home-story-root">
      <div className="home-backdrop" aria-hidden="true" />
      <div className="home-story-slide home-story-banner">
        <DigitalCommonsHero />
        <p className="home-slide-index" aria-hidden="true">01 / 04</p>
      </div>
      <section className="home-story-slide home-story-articles" aria-label="文章">
        <HomeFeaturedReadingClient catalog={featuredPicks} kicker="02 · Writing" />
        <p className="home-slide-index" aria-hidden="true">02 / 04</p>
      </section>
      <section className="home-story-slide home-story-inspirations" aria-label="灵感">
        <HomeInspirations items={inspirations} pinnedIds={HOME_PINNED_INSPIRATION_IDS} kicker="03 · Sparks" />
        <p className="home-slide-index" aria-hidden="true">03 / 04</p>
      </section>
      <HomeOwnerStory />
    </main>
  )
}

export default function HomePage() {
  const featuredPicks = getHomeRecommendationCatalog()
  const inspirations = getFeedItemsWithPinned(HOME_PINNED_INSPIRATION_IDS, HOME_RECOMMENDATION_MAX_BATCH_SIZE)

  return <PolishedHomePage featuredPicks={featuredPicks} inspirations={inspirations} />
}
