import AdminPageGate from '../../(admin)/components/AdminPageGate'
import ContentPvBeacon from '../components/ContentPvBeacon'
import QuizClient from './QuizClient'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '2026 年党建知识题库｜学习与考试',
  description: '100 道党建知识单选题与 1 道入党誓词填空题，支持学习模式与计时考试模式。',
  keywords: ['党建知识', '题库', '学习模式', '考试模式', '仅站长'],
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default function QuizPage() {
  return (
    <AdminPageGate
      label="2026 年党建知识题库"
      returnTo="/quiz"
      description="站长个人学习与考试题库，仅站长本人可见。"
    >
      <ContentPvBeacon category="rich-page" slug="quiz" />
      <QuizClient />
    </AdminPageGate>
  )
}
