import ContentEngagement from '../../components/ContentEngagement'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import PageContainer from '../../components/PageContainer'
import {
  XIAOHONGSHU_COMMUNITY,
  XIAOHONGSHU_COMMUNITY_SLUG,
  xiaohongshuCommunityJsonLd,
} from '../../../../lib/page-data/xiaohongshuCommunity'
import XiaohongshuCommunityView from './XiaohongshuCommunityView'

export const dynamic = 'force-static'

export const metadata = {
  title: XIAOHONGSHU_COMMUNITY.title,
  description: XIAOHONGSHU_COMMUNITY.description,
  keywords: ['小红书社群', '专供小红书社群', '硅基前沿', '种草', '笔记', '群公告', '涂阿燃', 'tuaran'],
  alternates: { canonical: '/resources/xiaohongshu-community' },
  openGraph: {
    title: XIAOHONGSHU_COMMUNITY.title,
    description: XIAOHONGSHU_COMMUNITY.description,
    url: '/resources/xiaohongshu-community',
    type: 'website',
    locale: 'zh_CN',
    siteName: '2aran.com',
  },
  robots: { index: true, follow: true },
}

export default function XiaohongshuCommunityPage() {
  const jsonLd = xiaohongshuCommunityJsonLd()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <PageContainer className="py-6 md:py-8">
        <ContentPvBeacon category="resource" slug={XIAOHONGSHU_COMMUNITY_SLUG} />
        <XiaohongshuCommunityView page={XIAOHONGSHU_COMMUNITY} />
      </PageContainer>
      <ContentEngagement contentKey={`resource:${XIAOHONGSHU_COMMUNITY_SLUG}`} width="standard" />
    </>
  )
}
