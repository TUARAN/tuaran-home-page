const LL2_BASE_URL = 'https://ll.thespacedevs.com/2.3.0/launches'
const FETCH_OPTIONS = {
  headers: {
    accept: 'application/json',
    'user-agent': '2aran-spacex-timeline/1.0',
  },
  next: { revalidate: 10_800 },
}

export const SPACEX_EDITORIAL_ENTRIES = [
  {
    id: 'musk-multiplanetary-species-2017',
    publishedAt: '2017-06-01T00:00:00Z',
    kind: 'musk',
    topic: '火星',
    title: '把“多行星物种”写成一套运输系统问题',
    titleEn: 'Treating a multiplanetary future as a transportation problem',
    summary: '马斯克在公开论文中把火星目标拆成运力、复用、在轨加注和单位运输成本，长期愿景由此对应到可以持续验证的工程变量。',
    summaryEn: 'Musk frames the Mars goal through capacity, reuse, orbital refueling, and transportation cost, turning a long-term ambition into engineering variables that can be tested.',
    sourceLabel: 'New Space · Elon Musk',
    sourceUrl: 'https://www.liebertpub.com/doi/10.1089/space.2017.29009.emu',
    note: '编辑摘要，不是原话翻译',
    noteEn: 'Editorial summary, not a verbatim quote',
  },
  {
    id: 'spacex-starlink-system',
    publishedAt: '2019-05-24T00:00:00Z',
    kind: 'spacex',
    topic: 'Starlink',
    title: '用低轨星座扩大高速网络覆盖',
    titleEn: 'Expanding high-speed internet coverage with a low-Earth-orbit constellation',
    summary: 'SpaceX 将 Starlink 描述为低轨宽带系统，重点是低延迟、全球覆盖和快速部署；它也为高频发射提供了持续需求。',
    summaryEn: 'SpaceX describes Starlink as a low-Earth-orbit broadband system focused on low latency, broad coverage, and rapid deployment. It also creates recurring demand for launches.',
    sourceLabel: 'SpaceX · Starlink',
    sourceUrl: 'https://www.starlink.com/technology',
    note: '根据官方技术说明整理',
    noteEn: 'Summarized from the official technical overview',
  },
  {
    id: 'spacex-starship-flight-five',
    publishedAt: '2024-10-13T12:25:00Z',
    kind: 'spacex',
    topic: 'Starship',
    title: '首次用发射塔机械臂接住 Super Heavy 助推器',
    titleEn: 'First Super Heavy catch by the launch tower arms',
    summary: '第五次综合飞行测试验证了助推器返回发射场和塔架捕获路径。复用目标从海上回收继续推进到发射场快速周转。',
    summaryEn: 'The fifth integrated flight test demonstrated the booster return-to-launch-site and tower-catch path, extending reuse toward rapid turnaround at the launch site.',
    sourceLabel: 'SpaceX · Starship Flight 5',
    sourceUrl: 'https://www.spacex.com/launches/mission/?missionId=starship-flight-5',
    note: '根据官方任务页整理',
    noteEn: 'Summarized from the official mission page',
  },
  {
    id: 'spacex-mars-system',
    publishedAt: '2025-01-15T00:00:00Z',
    kind: 'spacex',
    topic: '火星',
    title: 'Starship 的最终任务仍指向火星运输',
    titleEn: 'Starship remains aimed at transportation to Mars',
    summary: 'SpaceX 的公开任务说明把 Starship、轨道加注、货运和载人运输放在同一架构中，火星城市依赖的是可重复运行的运输能力。',
    summaryEn: 'SpaceX presents Starship, orbital refueling, cargo, and crew transportation as one architecture. A city on Mars depends on transportation that can operate repeatedly.',
    sourceLabel: 'SpaceX · Mars & Beyond',
    sourceUrl: 'https://www.spacex.com/humanspaceflight/mars/',
    note: '常青页面；日期为本条首次归档时间',
    noteEn: 'Evergreen source; date marks the first archive entry',
  },
].map((entry) => ({
  ...entry,
  originalLanguage: entry.originalLanguage || 'en',
  titleOriginal: entry.titleEn,
  summaryOriginal: entry.summaryEn,
  noteOriginal: entry.noteEn,
  titleTranslated: entry.title,
  summaryTranslated: entry.summary,
  noteTranslated: entry.note,
}))

function cleanText(value, fallback = '') {
  const text = String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text || fallback
}

function launchTopic(name) {
  const normalized = String(name || '').toLowerCase()
  if (normalized.includes('starship')) return 'Starship'
  if (normalized.includes('starlink')) return 'Starlink'
  if (normalized.includes('dragon') || normalized.includes('crew')) return 'Dragon'
  return 'Falcon'
}

const STATUS_ZH = new Map([
  ['Go for Launch', '发射准备就绪'],
  ['Launch Successful', '发射成功'],
  ['Success', '任务成功'],
  ['In Flight', '飞行中'],
  ['Hold', '暂停'],
  ['To Be Confirmed', '时间待确认'],
  ['To Be Determined', '时间待定'],
  ['Launch Failure', '发射失败'],
  ['Failure', '任务失败'],
  ['Partial Failure', '部分失败'],
])

const MISSION_TYPE_ZH = new Map([
  ['Communications', '通信任务'],
  ['Earth Science', '地球科学任务'],
  ['Government/Top Secret', '政府任务'],
  ['Human Exploration', '载人探索任务'],
  ['Navigation', '导航任务'],
  ['Resupply', '补给任务'],
  ['Test Flight', '飞行测试'],
  ['Dedicated Rideshare', '专属拼车发射'],
])

function launchSummaryZh(launch, status, location) {
  const missionType = cleanText(launch.mission?.type)
  const translatedType = MISSION_TYPE_ZH.get(missionType) || (missionType ? `${missionType} 任务` : 'SpaceX 发射任务')
  const translatedStatus = STATUS_ZH.get(status) || status
  return [
    translatedType,
    location ? `发射地点：${location}` : '',
    translatedStatus ? `当前状态：${translatedStatus}` : '',
  ].filter(Boolean).join('。') + '。'
}

export function normalizeLl2Launch(launch, phase) {
  if (!launch?.id || !launch?.net) return null

  const missionName = cleanText(launch.name, 'SpaceX 发射任务')
  const location = cleanText(launch.pad?.location?.name || launch.pad?.name)
  const description = cleanText(launch.mission?.description)
  const status = cleanText(launch.status?.name, phase === 'upcoming' ? '计划中' : '已结束')
  const detailUrl = cleanText(launch.url, `${LL2_BASE_URL}/${launch.id}/`)

  return {
    id: `ll2-${launch.id}`,
    publishedAt: launch.net,
    kind: 'launch',
    topic: launchTopic(missionName),
    title: missionName,
    titleEn: missionName,
    summary: launchSummaryZh(launch, status, location),
    summaryEn: description || [status, location].filter(Boolean).join(' · '),
    sourceLabel: 'Launch Library 2',
    sourceUrl: detailUrl,
    note: [phase === 'upcoming' ? '计划时间可能调整' : status, location].filter(Boolean).join(' · '),
    noteEn: [phase === 'upcoming' ? 'Schedule subject to change' : status, location].filter(Boolean).join(' · '),
    phase,
    status,
    originalLanguage: 'en',
    titleOriginal: missionName,
    summaryOriginal: description || [status, location].filter(Boolean).join(' · '),
    noteOriginal: [phase === 'upcoming' ? 'Schedule subject to change' : status, location].filter(Boolean).join(' · '),
    titleTranslated: missionName,
    summaryTranslated: launchSummaryZh(launch, status, location),
    noteTranslated: [phase === 'upcoming' ? '计划时间可能调整' : STATUS_ZH.get(status) || status, location].filter(Boolean).join(' · '),
  }
}

async function fetchLaunchPage(fetchImpl, phase) {
  const ordering = phase === 'upcoming' ? 'net' : '-net'
  const url = `${LL2_BASE_URL}/${phase}/?limit=8&lsp__name=SpaceX&ordering=${ordering}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12_000)
  try {
    const response = await fetchImpl(url, { ...FETCH_OPTIONS, signal: controller.signal })
    if (!response.ok) throw new Error(`Launch Library 2 returned ${response.status}`)
    const payload = await response.json()
    return (Array.isArray(payload?.results) ? payload.results : [])
      .map((launch) => normalizeLl2Launch(launch, phase))
      .filter(Boolean)
  } finally {
    clearTimeout(timeout)
  }
}

export async function getSpacexTimeline(fetchImpl = fetch) {
  const results = await Promise.allSettled([
    fetchLaunchPage(fetchImpl, 'upcoming'),
    fetchLaunchPage(fetchImpl, 'previous'),
  ])

  const launches = results.flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
  const uniqueLaunches = Array.from(new Map(launches.map((entry) => [entry.id, entry])).values())
  const entries = [...SPACEX_EDITORIAL_ENTRIES, ...uniqueLaunches].sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  )

  return {
    entries,
    launchSourceStatus: results.every((result) => result.status === 'fulfilled')
      ? 'ok'
      : results.some((result) => result.status === 'fulfilled')
        ? 'partial'
        : 'unavailable',
  }
}
