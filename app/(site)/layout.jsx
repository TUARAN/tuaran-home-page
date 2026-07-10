import Script from 'next/script'

import LayoutChrome from './components/LayoutChrome'
import { LocaleProvider } from './components/LocaleProvider'
import { SessionProvider } from './components/SessionProvider'
import { ThemeProvider } from './components/ThemeProvider'

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
  sameAs: [
    'https://juejin.cn/user/1521379823340792',
    'https://github.com/TUARAN',
    'https://www.xiaohongshu.com/user/profile/68b313f9000000001901d07e',
  ],
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
        strategy="afterInteractive"
      />
      <ThemeProvider>
        <LocaleProvider>
          <SessionProvider>
            <LayoutChrome>{children}</LayoutChrome>
          </SessionProvider>
        </LocaleProvider>
      </ThemeProvider>
    </>
  )
}
