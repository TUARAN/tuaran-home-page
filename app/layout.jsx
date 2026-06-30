import './globals.css'

import { avatarAbsoluteUrl } from '../lib/avatar'

const SITE_URL = 'https://2aran.com'
const AVATAR_URL = avatarAbsoluteUrl(SITE_URL)
const SITE_TITLE = '2aran.com｜涂阿燃（tuaran）的网络日志'
const SITE_DESCRIPTION =
  '2aran.com 是涂阿燃（安东尼）的个人主页与网络日志：前端与 AI 工程化、技术情报、知识库、调研与创作者增长。'

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s - ${SITE_TITLE}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    '涂阿燃',
    '2aran.com',
    'tuaran',
    'TUARAN',
    '掘金安东尼',
    '安东尼404',
    'SEO',
    '前端博客',
    '前端周刊',
    '前端工程化',
    'AI 智能体',
  ],
  authors: [{ name: '涂阿燃', url: SITE_URL }],
  creator: '涂阿燃',
  publisher: '涂阿燃',
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_TITLE,
    locale: 'zh_CN',
    type: 'website',
    images: [
      {
        url: AVATAR_URL,
        width: 512,
        height: 512,
        alt: '涂阿燃（掘金安东尼）头像',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    creator: '@Anthony404',
    images: [AVATAR_URL],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    other: {
      'baidu-site-verification': 'codeva-RnbvKColnM',
      'msvalidate.01': 'D0E13573AD7CC149454EB7427AB531A3',
    },
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        {/* RSS 自动发现：阅读器 / 浏览器插件在任意页面都能探测到 /rss.xml */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title="涂阿燃（tuaran）的网络日志"
          href="/rss.xml"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var root=document.documentElement;var ui=localStorage.getItem('site-ui-mode');root.dataset.ui=ui==='classic'?'classic':'polished';var rp=localStorage.getItem('reading-palette');var eink=rp==='eink';if(eink){root.dataset.reading='eink';}var th=localStorage.getItem('theme');var v=localStorage.getItem('reading-bg');if(v==='#f1f2ee'){localStorage.removeItem('reading-bg');v='';}if(v&&th==='light'&&!eink){root.style.setProperty('--page-bg',v);}var lm=document.cookie.match(/(?:^|; )site-lang=([^;]+)/);var lang=lm?decodeURIComponent(lm[1]):'';if(lang==='en'||lang==='zh'){root.dataset.lang=lang;root.lang=lang==='en'?'en':'zh-CN';}}catch(e){}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
