import VoiceTasksClient from './VoiceTasksClient'

export const dynamic = 'force-static'

export const metadata = {
  title: '语音记事',
  description: '私有语音任务录入入口：通过浏览器原生语音识别记录任务，并写入站点数据库供授权 AI 程序读取。',
  alternates: {
    canonical: '/voice-tasks',
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function VoiceTasksPage() {
  return (
    <main className="w-full max-w-4xl mx-auto px-4 py-10">
      <header className="mb-8 border-b border-[#eee] pb-5 dark:border-gray-800">
        <h1 className="font-serif text-2xl font-semibold tracking-wide text-[#222] dark:text-gray-100 md:text-3xl">
          语音记事
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#666] dark:text-gray-300">
          手机打开后点击麦克风说话，确认文字后提交为任务。任务只允许站点 owner 写入，授权 AI 程序可通过 token 拉取待执行列表。
        </p>
      </header>

      <VoiceTasksClient />
    </main>
  )
}
