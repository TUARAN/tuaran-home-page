import Link from 'next/link'

const DISCOVERY_ITEMS = [
  { icon: '📝', label: '工程实践与专题分析', hint: '文章', href: '/articles' },
  { icon: '🧪', label: '原创项目与交互作品', hint: '作品', href: '/works' },
  { icon: '📚', label: 'WorkBuddy 学习手册', hint: '资源', href: 'https://workbuddy.2aran.com/', external: true, analyticsId: 'workbuddy' },
  { icon: '🤝', label: '合作推广与博主联盟', hint: '合作', href: 'https://blogger-alliance.cn/', external: true, analyticsId: 'blogger-alliance' },
  { icon: '🧭', label: '了解作者与长期方向', hint: '关于', href: '/about' },
  { icon: '💬', label: '交友进社群', hint: '圈子', href: '/community' },
  { icon: '🏛️', label: '阿燃诗词', hint: '诗词', href: 'https://poemcn.2aran.com/', external: true },
  { icon: '⚡', label: '低价 CodeX 直冲', hint: '充值', href: 'https://gptplus.2aran.com', external: true },
]

function DiscoveryLink({ item }) {
  const className = 'home-discovery-link no-external-arrow'
  const content = (
    <>
      <span className="home-discovery-icon" aria-hidden="true">{item.icon}</span>
      <span className="home-discovery-label">{item.label}</span>
      <span className="home-discovery-hint">{item.hint} <span aria-hidden="true">→</span></span>
    </>
  )

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        data-analytics-event={item.analyticsId ? 'entry_click' : undefined}
        data-analytics-surface={item.analyticsId ? `home_${item.analyticsId}` : undefined}
        data-analytics-destination-kind={item.analyticsId ? 'external' : undefined}
        data-analytics-destination-id={item.analyticsId}
      >
        {content}
      </a>
    )
  }

  return <Link href={item.href} className={className}>{content}</Link>
}

export default function HomeDiscoveryPanel() {
  const featuredItems = DISCOVERY_ITEMS.slice(0, 4)
  const moreItems = DISCOVERY_ITEMS.slice(4)

  return (
    <section className="home-section home-discovery-panel" aria-labelledby="home-discovery-title">
      <div className="home-section-heading compact">
        <div>
          <p className="home-kicker">Explore</p>
          <h2 id="home-discovery-title" className="home-section-title">发现更多</h2>
        </div>
      </div>
      <nav className="home-discovery-list" aria-label="更多站点入口">
        {featuredItems.map((item) => <DiscoveryLink key={item.href} item={item} />)}
        <details className="home-discovery-more">
          <summary>另外 {moreItems.length} 个入口</summary>
          <div className="home-discovery-more-list">
            {moreItems.map((item) => <DiscoveryLink key={item.href} item={item} />)}
          </div>
        </details>
      </nav>
    </section>
  )
}
