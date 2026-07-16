import PageContainer from '../components/PageContainer'

const UMAMI_SHARE_URL = 'https://cloud.umami.is/share/3mOsBgzrmb9wY8bI'

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
    <PageContainer className="py-12">
      <header className="mb-8 border-b border-[#eee] dark:border-gray-800 pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-wide text-[#222] dark:text-gray-100">访问统计</h1>
            <p className="text-sm text-[#666] dark:text-gray-300 mt-2">实时查看网站的访问数据。</p>
          </div>
        </div>
      </header>

      <section aria-labelledby="traffic-panel-title">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#777] dark:text-gray-400">
          <h2 id="traffic-panel-title" className="font-normal">数据面板由 Umami 提供</h2>
          <a
            href={UMAMI_SHARE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-[#bbb] underline-offset-4 transition-colors hover:text-[#222] dark:decoration-gray-600 dark:hover:text-gray-100"
          >
            面板无法加载？独立打开
          </a>
        </div>
        <iframe
          src={UMAMI_SHARE_URL}
          title="TUARAN 网站访问统计"
          loading="lazy"
          className="block h-[80vh] min-h-[640px] w-full border-0"
        />
      </section>
    </PageContainer>
  )
}
