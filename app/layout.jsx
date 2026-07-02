import './globals.css'

import { avatarAbsoluteUrl } from '../lib/avatar'

/**
 * 主题设置版本号：每次「更新主题默认值」（默认明暗 / 墨水屏 / 样式 / 阅读底色等）时 bump 它。
 * 客户端发现本地存的版本与此不一致，就清掉主题相关的 localStorage（theme / reading-palette /
 * site-ui-mode / reading-bg），让新默认对老用户也立即生效；之后用户自己的设置再正常缓存，
 * 直到下次 bump。改默认却不 bump 的话，老用户会被旧缓存卡住、看不到新观感。
 */
const THEME_SETTINGS_VERSION = '2026-06-30-eink-darkhome'

const SITE_URL = 'https://2aran.com'
const AVATAR_URL = avatarAbsoluteUrl(SITE_URL)
const SITE_TITLE = '2aran.com｜涂阿燃（tuaran）的主编札记'
const SITE_DESCRIPTION =
  '2aran.com 是涂阿燃（安东尼）的个人主页与主编札记：前端与 AI 工程化、技术情报、知识库、调研与创作者增长。'

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
          title="涂阿燃（tuaran）的主编札记"
          href="/rss.xml"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var root=document.documentElement;var SV='${THEME_SETTINGS_VERSION}';if(localStorage.getItem('theme-settings-version')!==SV){localStorage.removeItem('theme');localStorage.removeItem('reading-palette');localStorage.removeItem('site-ui-mode');localStorage.removeItem('reading-bg');localStorage.setItem('theme-settings-version',SV);}root.dataset.ui='polished';var rp=localStorage.getItem('reading-palette');var eink=rp!=='default';if(eink){root.dataset.reading='eink';}var th=localStorage.getItem('theme');var v=localStorage.getItem('reading-bg');if(v==='#f1f2ee'){localStorage.removeItem('reading-bg');v='';}if(v&&th==='light'&&!eink){root.style.setProperty('--page-bg',v);}var lm=document.cookie.match(/(?:^|; )site-lang=([^;]+)/);var lang=lm?decodeURIComponent(lm[1]):'';if(lang==='en'||lang==='zh'){root.dataset.lang=lang;root.lang=lang==='en'?'en':'zh-CN';}}catch(e){}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        {children}
        {/* 首页恒为深色：此脚本在 next-themes 初始化之后执行，强制 / 路由首屏走深色，避免闪烁。
            客户端导航与水合由 ForceDarkRoute 守住。 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(location.pathname==='/'){var r=document.documentElement;r.classList.add('dark');r.style.removeProperty('--page-bg');}}catch(e){}})();`,
          }}
        />
      </body>
    </html>
  )
}
