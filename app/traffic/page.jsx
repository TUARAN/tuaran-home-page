import SettingsButton from '../components/SettingsButton'

export const dynamic = 'force-static'

export default function TrafficPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="mb-8 border-b border-[#eee] pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[#555]">流量统计</h1>
            <p className="text-sm text-[#666] mt-2">实时查看网站的访问数据。</p>
          </div>
          <SettingsButton />
        </div>
      </header>

      <section>
        <iframe
          src="https://cloud.umami.is/share/3mOsBgzrmb9wY8bI"
          title="TUARAN 网站访问统计"
          loading="lazy"
          style={{ width: '100%', height: '620px', border: 0 }}
        />
      </section>
    </div>
  )
}
