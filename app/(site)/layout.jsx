import Script from 'next/script'

import LayoutChrome from './components/LayoutChrome'
import { ThemeProvider } from './components/ThemeProvider'

const SITE_URL = 'https://2aran.com'
const SITE_TITLE = '2aran.com｜涂阿燃（tuaran）的网络日志'
const SITE_DESCRIPTION =
  '2aran.com 是涂阿燃（安东尼）的个人主页与网络日志：前端与 AI 工程化、技术情报、知识库、调研与创作者增长。'

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: '涂阿燃',
  alternateName: ['2aran.com', 'tuaran', '掘金安东尼', '安东尼404'],
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
        <LayoutChrome>{children}</LayoutChrome>
      </ThemeProvider>
    </>
  )
}
