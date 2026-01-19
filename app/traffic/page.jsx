import SettingsButton from '../components/SettingsButton'

export const dynamic = 'force-static'

export const metadata = {
  title: '访问统计',
  description: '涂阿燃（tuaran）的站点访问统计面板（Umami）。',
  keywords: ['涂阿燃', 'tuaran', '访问统计', 'Umami', '网站分析', '网络日志'],
  alternates: {
    canonical: '/traffic',
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function TrafficPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="mb-8 border-b border-[#eee] dark:border-gray-800 pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[#555] dark:text-gray-200">访问统计</h1>
            <p className="text-sm text-[#666] dark:text-gray-300 mt-2">实时查看网站的访问数据。</p>
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
