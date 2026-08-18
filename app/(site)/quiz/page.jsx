import ContentPvBeacon from '../components/ContentPvBeacon'
import PrivateVaultGate from '../components/PrivateVaultGate'
import { getOwnerPageState } from '../../../lib/adminPageAuth'
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

export default async function QuizPage() {
  const { state, localPreview } = await getOwnerPageState()

  if (state !== 'owner') {
    return (
      <PrivateVaultGate
        state={state}
        vaultLabel="2026 年党建知识题库"
        returnTo="/quiz"
        description="站长个人学习与考试题库，仅站长本人可见。"
      />
    )
  }

  return (
    <>
      {localPreview ? (
        <div className="mx-auto mt-4 w-full max-w-[1180px] px-4 sm:px-5 md:px-6">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] leading-6 text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100">
            本地 Admin 预览模式已启用：当前请求在开发环境内临时视为 owner。
          </div>
        </div>
      ) : null}
      <ContentPvBeacon category="rich-page" slug="quiz" />
      <QuizClient />
    </>
  )
}
