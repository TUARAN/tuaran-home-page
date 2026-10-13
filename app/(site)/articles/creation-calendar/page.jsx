import CreationCalendarClient from './CreationCalendarClient'
import { buildKnowledgeItems } from '../buildKnowledgeItems'
import { JUEJIN_ACTIVITY_SNAPSHOT } from '../../../../lib/juejin/activitySnapshot'
import { calendarPage, calendarRecord, isCalendarDate, selectCreationCalendarItems } from '../../../../lib/article/creationCalendar'

export const dynamic = 'force-static'

export const metadata = {
  title: '创作日历',
  description: '按时间维度查看站内知识库与掘金专栏的创作分布、统计信息与每日内容列表。',
  alternates: {
    canonical: '/articles/creation-calendar',
  },
  robots: { index: false, follow: true },
}

export default function CreationCalendarPage() {
  const allItems = buildKnowledgeItems()
  const dates = allItems.filter((item) => isCalendarDate(item.date)).map(({ date }) => ({ date }))
  const years = new Set([...dates.map(({ date }) => date.slice(0, 4)), ...Object.keys(JUEJIN_ACTIVITY_SNAPSHOT.countsByDate).map((date) => date.slice(0, 4))])
  const initialYear = [...years].sort((a, b) => Number(b) - Number(a))[0] || ''
  const initialItems = calendarPage(selectCreationCalendarItems(allItems, { year: initialYear }), 1).map(calendarRecord)
  return <CreationCalendarClient items={dates} initialYear={initialYear} initialItems={initialItems} />
}
