import CreationCalendarClient from './CreationCalendarClient'
import { buildKnowledgeItems } from '../buildKnowledgeItems'

export const dynamic = 'force-static'

export const metadata = {
  title: '创作日历',
  description: '按时间维度查看知识库的创作分布、统计信息与每日内容列表。',
  alternates: {
    canonical: '/articles/creation-calendar',
  },
}

export default function CreationCalendarPage() {
  const items = buildKnowledgeItems()
  return <CreationCalendarClient items={items} />
}
