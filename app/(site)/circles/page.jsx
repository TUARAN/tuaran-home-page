import Link from 'next/link'
import { IconArrowRight } from '@tabler/icons-react'

import { DISCUSSION_COMMUNITY_TOPICS } from '../../../lib/communityTopics'
import { COMMUNITY_MEMBERSHIP } from '../../../lib/communityMembership'
import CommunityMembershipCard from '../components/CommunityMembershipCard'
import PageContainer from '../components/PageContainer'

export const dynamic = 'force-static'

export const metadata = {
  title: '圈子',
  description: '涂阿燃主题圈子介绍与加群入口：了解各圈子的主题、参与方式、费用和加群流程。',
  keywords: ['涂阿燃', 'tuaran', '圈子', '社群', '微信群', '加群方式', '专题圈子'],
  alternates: {
    canonical: '/circles',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

const TOPIC_ACCENTS = {
  'x-mutual-aid-circle': '#1d9bf0',
  'xiaohongshu-creator-circle': '#e94b68',
  'juejin-creator-circle': '#1677ff',
}

function TopicCircleCard({ topic, index }) {
  const accent = TOPIC_ACCENTS[topic.id] || topic.accent || 'var(--site-accent)'

  return (
    <Link
      href={topic.href}
      className="community-topic-card no-underline hover:no-underline"
      style={{ '--topic-accent': accent }}
    >
      <div className="community-topic-card-head">
        <span className="community-topic-number">0{index + 1}</span>
        <span className="community-topic-status">{topic.tag}</span>
      </div>
      <div>
        <p className="community-topic-platform">{topic.eyebrow}</p>
        <h3>{topic.label}</h3>
        <p className="community-topic-desc">{topic.desc}</p>
      </div>
      <span className="community-topic-action">
        了解圈子 <IconArrowRight size={16} aria-hidden="true" />
      </span>
    </Link>
  )
}

export default function CirclesPage() {
  return (
    <PageContainer className="py-4 md:py-10">
      <div className="community-page">
        <header className="community-hero">
          <div className="community-hero-copy">
            <p className="community-kicker"><span /> CIRCLES</p>
            <h1>圈子</h1>
            <p className="community-hero-lead">了解各个主题圈子的交流方向、参与规则和加群方式。</p>
            <div className="community-hero-actions">
              <a href="#topic-circles" className="community-primary-button">
                浏览圈子 <IconArrowRight size={17} aria-hidden="true" />
              </a>
              <a href="#join" className="community-secondary-button">
                查看加群方式
              </a>
            </div>
          </div>
          <div className="community-hero-side">
            <div className="community-stats">
              <div className="community-stat"><strong>{DISCUSSION_COMMUNITY_TOPICS.length}</strong><span>主题圈子</span></div>
              <div className="community-stat"><strong>¥{COMMUNITY_MEMBERSHIP.price}</strong><span>每{COMMUNITY_MEMBERSHIP.period}</span></div>
              <div className="community-stat"><strong>微信</strong><span>人工拉群</span></div>
            </div>
          </div>
        </header>

        <section id="topic-circles" className="community-section scroll-mt-24" aria-labelledby="topic-circles-title">
          <div className="community-section-head">
            <div>
              <p className="community-kicker">TOPIC CIRCLES</p>
              <h2 id="topic-circles-title">从共同话题开始</h2>
            </div>
            <p>每个圈子都有明确的主题和参与方式，可以先查看详情再决定是否加入。</p>
          </div>
          <div className="community-topic-grid">
            {DISCUSSION_COMMUNITY_TOPICS.map((topic, index) => (
              <TopicCircleCard key={topic.id} topic={topic} index={index} />
            ))}
          </div>
        </section>

        <section className="community-section" aria-label="加群方式">
          <CommunityMembershipCard id="join" />
        </section>
      </div>
    </PageContainer>
  )
}
