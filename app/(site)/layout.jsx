import Script from 'next/script'

import LayoutChrome from './components/LayoutChrome'
import { listContactSameAs } from '../../lib/site/contactChannels'
import { LocaleProvider } from './components/LocaleProvider'
import { SessionProvider } from './components/SessionProvider'
import { ThemeProvider } from './components/ThemeProvider'
import MermaidRenderer from './components/MermaidRenderer'
import SiteBehaviorAnalytics from './components/SiteBehaviorAnalytics'
import SiteStatusBanner from './components/SiteStatusBanner'

const SITE_URL = 'https://2aran.com'
const SITE_TITLE = '涂阿燃的网络日志'
const SITE_DESCRIPTION = '前端与 AI 工程、技术情报、知识库与调研。'

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: '涂阿燃',
  alternateName: ['2aran.com', 'tuaran'],
  url: SITE_URL,
  headline: SITE_TITLE,
  description: SITE_DESCRIPTION,
  sameAs: listContactSameAs(),
}

export default function SiteLayout({ children }) {
  return (
    <>
      <Script id="tuaran-structured-data" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(structuredData)}
      </Script>
      <Script
        src="https://cloud.umami.is/script.js"
        data-website-id="8bb48b09-3e10-4ec1-9bbe-c55c87418fa9"
        data-auto-track="true"
        strategy="afterInteractive"
      />
      <ThemeProvider>
        <LocaleProvider>
          <SessionProvider pointsEndpoint="/api/points/me">
            <SiteBehaviorAnalytics />
            <MermaidRenderer />
            <SiteStatusBanner />
            <LayoutChrome>{children}</LayoutChrome>
          </SessionProvider>
        </LocaleProvider>
      </ThemeProvider>
    </>
  )
}
