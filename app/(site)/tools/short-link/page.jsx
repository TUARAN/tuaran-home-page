import ShortLinkTool from './ShortLinkTool'

export const dynamic = 'force-static'

export const metadata = {
  title: '站内转短',
  description: '2aran.com 站内短链工具，用于把链接转换成 2aran.com 短链并维护历史记录。',
  keywords: ['短链', '站内转短', 'URL shortener', '2aran'],
  alternates: {
    canonical: '/tools/short-link',
  },
}

export default function ShortLinkToolPage() {
  return <ShortLinkTool />
}
