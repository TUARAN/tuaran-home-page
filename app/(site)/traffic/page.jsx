import PageContainer from '../components/PageContainer'

const UMAMI_SHARE_URL = 'https://cloud.umami.is/share/3mOsBgzrmb9wY8bI'

const START_METRICS = [
  {
    name: '有效起点率',
    formula: '首次访问中触发 qualified_start 的会话 ÷ 首次访问会话',
    use: '判断新访客能否进入一次有价值的阅读、搜索、工具或资源行为。',
  },
  {
    name: '首次价值耗时',
    formula: 'landing_view 到 qualified_start 的 time_to_value_seconds 中位数与 P75',
    use: '判断找到入口需要多长时间。',
  },
  {
    name: '无有效行为退出率',
    formula: '首次访问中未触发 qualified_start 的会话 ÷ 首次访问会话',
    use: '发现入口表达不清、搜索无结果和内容错配。',
  },
  {
    name: '7 日回访率',
    formula: '首次访问后 7 日内再次访问的访客 ÷ 首次访客',
    use: '校验首次点击是否形成持续价值。',
  },
]

const EVENT_DEFINITIONS = [
  ['landing_view', '首次落地页及访客阶段'],
  ['menu_open', '主导航菜单被主动打开'],
  ['entry_click', '首页、导航或目录入口被选择'],
  ['filter_apply', '目录筛选维度被使用'],
  ['search_submit', '搜索提交、结果数与零结果状态'],
  ['search_result_click', '搜索结果被打开'],
  ['content_engaged', '前台活跃至少 30 秒且滚动达到 50%'],
  ['resource_action', '资源被打开、下载、订阅或外部访问'],
  ['qualified_start', '每个会话首次出现的有效起点'],
]

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
            <p className="text-sm text-[#666] dark:text-gray-300 mt-2">查看访问趋势、新访客起点和关键行为路径。</p>
          </div>
        </div>
      </header>

      <section aria-labelledby="start-metrics-title" className="mb-10">
        <div className="mb-4 max-w-3xl">
          <h2 id="start-metrics-title" className="text-lg font-semibold text-[#28232d] dark:text-gray-100">新访客起点指标</h2>
          <p className="mt-2 text-sm leading-7 text-[#666] dark:text-gray-300">
            “新访客”按当前浏览器首次观察会话识别。点击不直接等于成功；有效阅读、搜索结果点击、工具启动和资源操作才会形成有效起点。
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {START_METRICS.map((metric) => (
            <article key={metric.name} className="rounded-xl border border-[#e5dfe9] bg-white/70 p-4 dark:border-gray-800 dark:bg-[#121821]">
              <h3 className="font-semibold text-[#28232d] dark:text-gray-100">{metric.name}</h3>
              <p className="mt-2 font-mono text-[11px] leading-5 text-[#725f80] dark:text-[#c5afe8]">{metric.formula}</p>
              <p className="mt-2 text-sm leading-6 text-[#666] dark:text-gray-300">{metric.use}</p>
            </article>
          ))}
        </div>
        <details className="mt-4 rounded-xl border border-[#e5dfe9] bg-white/60 p-4 dark:border-gray-800 dark:bg-[#121821]">
          <summary className="cursor-pointer font-medium text-[#3c3149] dark:text-gray-100">事件口径</summary>
          <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[11rem_minmax(0,1fr)]">
            {EVENT_DEFINITIONS.map(([name, description]) => (
              <div key={name} className="contents">
                <dt className="font-mono text-xs text-[#725f80] dark:text-[#c5afe8]">{name}</dt>
                <dd className="text-[#666] dark:text-gray-300">{description}</dd>
              </div>
            ))}
          </dl>
        </details>
      </section>

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
