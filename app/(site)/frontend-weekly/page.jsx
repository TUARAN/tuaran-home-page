import FrontendWeeklyClient from './FrontendWeeklyClient'
import { getFrontendWeeklyData } from '../../../lib/frontendWeekly'

export const metadata = {
  title: '前端周看 · 周刊、每日与每时新闻',
  description: '前端周刊、AI 每日精选与每时新闻，持续自动同步更新。',
  alternates: { canonical: '/frontend-weekly' },
}

export default function FrontendWeeklyPage() {
  const { weekly, daily, live, dailyEntries } = getFrontendWeeklyData()
  return <FrontendWeeklyClient weekly={weekly} daily={daily} live={live} dailyEntries={dailyEntries} />
}
