import CreationCalendarClient from './CreationCalendarClient'
import { buildKnowledgeItems } from '../buildKnowledgeItems'

export const dynamic = 'force-static'

export const metadata = {
  title: '站内创作日历',
  description: '按时间维度查看站内知识库的创作分布、统计信息与每日内容列表（不含外部掘金专栏）。',
  alternates: {
    canonical: '/articles/creation-calendar',
  },
}

export default function CreationCalendarPage() {
  const items = buildKnowledgeItems()
  return <CreationCalendarClient items={items} />
}
