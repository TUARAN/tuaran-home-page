import CloudflarePersonalSiteMapClient from './CloudflarePersonalSiteMapClient'
import { SHARE_COPY } from './data'

export const dynamic = 'force-static'

const PAGE_URL = 'https://2aran.com/cloudflare-personal-site-map'

export const metadata = {
  title: SHARE_COPY.title,
  description: SHARE_COPY.lead,
  alternates: {
    canonical: '/cloudflare-personal-site-map',
  },
  openGraph: {
    type: 'article',
    siteName: '2aran.com',
    title: SHARE_COPY.title,
    description: SHARE_COPY.lead,
    url: PAGE_URL,
    publishedTime: '2026-06-09T00:00:00.000Z',
    modifiedTime: '2026-07-02T00:00:00.000Z',
    authors: ['涂阿燃 / Tuaran'],
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: SHARE_COPY.title,
    description: SHARE_COPY.lead,
    creator: '@Anthony404',
    site: '@Anthony404',
  },
}

export default function CloudflarePersonalSiteMapPage() {
  return <CloudflarePersonalSiteMapClient />
}
