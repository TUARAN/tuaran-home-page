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
    <main className="w-full max-w-4xl mx-auto px-4 py-10">
      <header className="mb-10 border-b border-[#eee] dark:border-gray-800 pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-wide text-[#222] dark:text-gray-100">留言板</h1>
            <p className="text-sm text-[#666] dark:text-gray-300 mt-2">写几句近况、建议或合作想法。</p>
          </div>
        </div>
      </header>

      <StompPanel />
    </main>
  )
}
