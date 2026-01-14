import SettingsButton from '../../components/SettingsButton'

export const dynamic = 'force-static'

export default function BiographyReadingPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="mb-8 border-b border-[#eee] pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[#555]">读无用书 · 传记</h1>
            <p className="text-sm text-[#666] mt-2">这里会整理传记类的阅读记录。</p>
          </div>
          <SettingsButton />
        </div>
      </header>

      <section className="border border-[#eee] bg-white p-5">
        <p className="text-sm text-[#666]">（待更新）</p>
      </section>
    </div>
  )
}
