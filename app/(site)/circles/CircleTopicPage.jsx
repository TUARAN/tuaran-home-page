import Image from 'next/image'
import Link from 'next/link'

import { COMMUNITY_TOPICS } from '../../../lib/communityTopics'
import ContentEngagement from '../components/ContentEngagement'
import PageContainer from '../components/PageContainer'
import SharePageButton from '../components/SharePageButton'

const SHARED_RULES = [
  '真人、真实账号、真实经验，不交换账号密码。',
  '互评要具体，不只留“支持”“已赞”一类无信息反馈。',
  '不刷量、不骚扰、不搬运，遵守所在平台的社区规则。',
  '可以分享失败和小数据，不用包装成功学。',
]

function InfoSection({ eyebrow, title, items }) {
  return (
    <section className="circle-topic-panel">
      <p className="circle-topic-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <ul className="mt-5 space-y-3">
        {items.map((item, index) => (
          <li key={item} className="flex gap-3 text-sm leading-6 text-[var(--site-muted)]">
            <span className="circle-topic-index">{String(index + 1).padStart(2, '0')}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function CircleTopicPage({ topic }) {
  const related = COMMUNITY_TOPICS.filter((item) => item.id !== topic.id).slice(0, 4)

  return (
    <>
      <PageContainer className="py-8 md:py-12">
        <nav className="mb-5 flex items-center gap-2 text-xs text-[var(--site-faint)]" aria-label="面包屑">
          <Link href="/community" className="no-underline hover:text-[var(--site-ink)]">圈子</Link>
          <span aria-hidden="true">/</span>
          <span>{topic.label}</span>
        </nav>

        <header className="circle-topic-hero" style={{ '--circle-accent': topic.accent }}>
          <div className="relative z-10 max-w-3xl">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="circle-topic-platform">{topic.eyebrow}</span>
              <span className="circle-topic-status">{topic.tag}</span>
            </div>
            <h1>{topic.label}</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--site-muted)] md:text-lg">
              {topic.positioning}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/community#message" className="circle-topic-primary-link">
                登记加入意向
              </Link>
              <SharePageButton
                title={topic.label}
                text={topic.desc}
                url={topic.href}
                exactUrl
                size="md"
                idleLabel="分享圈子"
              />
            </div>
          </div>
        </header>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <InfoSection eyebrow="For whom" title="适合谁" items={topic.audience} />
          <InfoSection eyebrow="Together" title="一起做什么" items={topic.activities} />
          <InfoSection eyebrow="Ground rules" title="共同约定" items={SHARED_RULES} />
        </div>

        <section className="circle-topic-join mt-6">
          <div className="min-w-0 flex-1">
            <p className="circle-topic-eyebrow">Join the circle</p>
            <h2>先认识，再组局</h2>
            <p className="mb-0 mt-3 max-w-2xl text-sm leading-7 text-[var(--site-muted)]">
              这个圈子正在发起中。先在讨论区留下你的平台账号、内容方向和最想解决的问题；也可以加站长微信，备注“{topic.label}”。人数和方向合适后再拉群，避免建成无人说话的二维码仓库。
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/community#message" className="circle-topic-primary-link">去讨论区登记</Link>
              <Link href="/community" className="circle-topic-secondary-link">查看全部社群入口</Link>
            </div>
          </div>
          <figure className="m-0 shrink-0 text-center">
            <div className="circle-topic-qr">
              <Image src="/qrcode-wechat.jpg" alt="站长个人微信二维码" width={132} height={178} className="h-full w-full object-contain" />
            </div>
            <figcaption className="mt-2 text-[11px] text-[var(--site-faint)]">微信 · atar24</figcaption>
          </figure>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="circle-topic-eyebrow">More circles</p>
              <h2 className="mb-0 mt-1 border-0 p-0 text-xl">其他专题圈子</h2>
            </div>
            <Link href="/community" className="text-xs font-semibold text-[var(--site-accent-strong)] no-underline">返回圈子首页 →</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <Link key={item.id} href={item.href} className="circle-topic-related no-underline hover:no-underline">
                <span className="circle-topic-eyebrow">{item.eyebrow}</span>
                <strong className="mt-2 block text-sm text-[var(--site-ink)]">{item.label}</strong>
                <span className="mt-2 block text-xs leading-5 text-[var(--site-muted)]">{item.desc}</span>
              </Link>
            ))}
          </div>
        </section>
      </PageContainer>

      <ContentEngagement contentKey={`resource:${topic.id}`} width="standard" />
    </>
  )
}
