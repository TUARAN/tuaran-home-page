import PublicOpinionClient from './PublicOpinionClient'
import {
  OPINION_POSTS,
  OPINION_TOPICS,
  PUBLIC_OPINION_STACK,
  SOURCE_CONNECTORS,
  TREND_POINTS,
  buildPublicOpinionSnapshot,
} from '../../../lib/publicOpinionData'

export const dynamic = 'force-static'

export const metadata = {
  title: '舆情分析系统 · 全网公开内容监测与观点洞察',
  description:
    '基于公开内容采集、热点聚合、中文文本分析、情绪识别与立场研判的舆情分析工作台。',
  keywords: [
    '舆情分析',
    '公开内容采集',
    '热点话题',
    '情感分析',
    '立场识别',
    '观点抽取',
    'Crawlee',
    'Scrapy',
    'Transformers.js',
    'HanLP',
  ],
  alternates: {
    canonical: '/public-opinion',
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function PublicOpinionPage() {
  const snapshot = buildPublicOpinionSnapshot(OPINION_POSTS, OPINION_TOPICS, SOURCE_CONNECTORS)

  return (
    <PublicOpinionClient
      topics={OPINION_TOPICS}
      posts={OPINION_POSTS}
      connectors={SOURCE_CONNECTORS}
      stack={PUBLIC_OPINION_STACK}
      trendPoints={TREND_POINTS}
      initialSnapshot={snapshot}
      initialGeneratedAt={new Date().toISOString()}
    />
  )
}
