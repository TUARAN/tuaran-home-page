import SettingsButton from '../components/SettingsButton'
import StompPanel from '../components/StompPanel'

export const dynamic = 'force-static'

export const metadata = {
  title: '留言板',
  description: '涂阿燃的留言板。',
  alternates: {
    canonical: '/messages',
  },
}

export default function MessagesPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-12 md:py-14">
      <header className="mb-8 flex flex-col gap-3 border-b border-[#eee] pb-2 dark:border-gray-800 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[#555] dark:text-gray-200">留言板</h1>
          <p className="mt-2 text-sm text-[#666] dark:text-gray-300">写几句近况、建议或合作想法。</p>
        </div>
        <SettingsButton />
      </header>

      <StompPanel />
    </main>
  )
}
