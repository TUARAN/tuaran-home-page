import ContentPvBeacon from '../components/ContentPvBeacon'
import QuizClient from './QuizClient'

export const dynamic = 'force-static'

export const metadata = {
  title: '2026 年党建知识题库｜学习与考试',
  description: '100 道党建知识单选题，支持即时反馈的学习模式与计时交卷的考试模式。',
}

export default function QuizPage() {
  return (
    <>
      <ContentPvBeacon category="rich-page" slug="quiz" />
      <QuizClient />
    </>
  )
}
