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

// 手工归档的发射不会随着 Launch Library 2 的“近期任务”窗口滚动消失。
// 后续追溯历史任务时继续按同一结构追加，并为已有影像的任务填写 video。
export const SPACEX_ARCHIVED_LAUNCHES = [
  {
    id: 'spacex-ussf-259-2026-09-17',
    publishedAt: '2026-09-17T01:07:56Z',
    kind: 'launch',
    topic: 'Falcon',
    title: 'USSF-259：分类载荷从范登堡升空',
    titleEn: 'USSF-259: Classified payload launched from Vandenberg',
    summary: 'Falcon 9 从加州范登堡太空军基地 SLC-4E 发射美国太空军 USSF-259 分类载荷，任务细节未公开。一级助推器 B1097 完成第 13 次飞行，并成功着陆“Of Course I Still Love You”无人船。',
    summaryEn: 'A Falcon 9 launched the U.S. Space Force\'s classified USSF-259 payload from SLC-4E at Vandenberg Space Force Base; mission details were not disclosed. Booster B1097 completed its 13th flight and landed on the droneship Of Course I Still Love You.',
    sourceLabel: 'SpaceX · USSF-259',
    sourceUrl: 'https://www.spacex.com/launches/ussf259',
    note: '发射成功 · 加州当地时间 2026.09.16 18:07:56 PDT · 载荷信息分类',
    noteEn: 'Launch successful · September 16, 2026 at 6:07:56 p.m. PDT · Classified payload',
    phase: 'previous',
    status: 'Launch Successful',
    video: {
      src: '/videos/ussf-259-liftoff-2026-09-17.mp4',
      label: 'USSF-259 从 SLC-4E 点火升空（T−0:09 至 T+0:22）',
      credit: '影像：SpaceX',
    },
    originalLanguage: 'en',
    titleOriginal: 'USSF-259: Classified payload launched from Vandenberg',
    summaryOriginal: 'A Falcon 9 launched the U.S. Space Force\'s classified USSF-259 payload from SLC-4E at Vandenberg Space Force Base; mission details were not disclosed. Booster B1097 completed its 13th flight and landed on the droneship Of Course I Still Love You.',
    noteOriginal: 'Launch successful · September 16, 2026 at 6:07:56 p.m. PDT · Classified payload',
    titleTranslated: 'USSF-259：分类载荷从范登堡升空',
    summaryTranslated: 'Falcon 9 从加州范登堡太空军基地 SLC-4E 发射美国太空军 USSF-259 分类载荷，任务细节未公开。一级助推器 B1097 完成第 13 次飞行，并成功着陆“Of Course I Still Love You”无人船。',
    noteTranslated: '发射成功 · 加州当地时间 2026.09.16 18:07:56 PDT · 载荷信息分类',
  },
  {
    id: 'spacex-starlink-15-27-2026-09-20',
    publishedAt: '2026-09-20T01:47:00Z',
    kind: 'launch',
    topic: 'Starlink',
    title: 'Starlink 15-27：27 颗卫星进入低地球轨道',
    titleEn: 'Starlink 15-27: 27 satellites launched to low Earth orbit',
    summary: 'Falcon 9 从加州范登堡太空军基地 SLC-4E 发射。一级助推器 B1093 完成第 17 次飞行，并在“Of Course I Still Love You”无人船着陆；任务使用的一枚整流罩半体完成第 40 次飞行。',
    summaryEn: 'A Falcon 9 lifted off from SLC-4E at Vandenberg Space Force Base. Booster B1093 completed its 17th flight and landed on the droneship Of Course I Still Love You; one payload fairing half completed its 40th flight.',
    sourceLabel: 'Spaceflight Now · Starlink 15-27',
    sourceUrl: 'https://spaceflightnow.com/2026/09/19/live-coverage-spacex-to-launch-27-starlink-v2-mini-satellites-on-falcon-9-rocket-from-vandenberg/',
    note: '发射成功 · 加州当地时间 2026.09.19 18:47 PDT',
    noteEn: 'Launch successful · September 19, 2026 at 6:47 p.m. PDT',
    phase: 'previous',
    status: 'Launch Successful',
    video: {
      src: '/videos/starlink-15-27-fairing-separation-2026-09-20.mp4',
      label: '整流罩分离后的在轨画面（T+3:05）',
      credit: '影像：SpaceX',
    },
    originalLanguage: 'en',
    titleOriginal: 'Starlink 15-27: 27 satellites launched to low Earth orbit',
    summaryOriginal: 'A Falcon 9 lifted off from SLC-4E at Vandenberg Space Force Base. Booster B1093 completed its 17th flight and landed on the droneship Of Course I Still Love You; one payload fairing half completed its 40th flight.',
    noteOriginal: 'Launch successful · September 19, 2026 at 6:47 p.m. PDT',
    titleTranslated: 'Starlink 15-27：27 颗卫星进入低地球轨道',
    summaryTranslated: 'Falcon 9 从加州范登堡太空军基地 SLC-4E 发射。一级助推器 B1093 完成第 17 次飞行，并在“Of Course I Still Love You”无人船着陆；任务使用的一枚整流罩半体完成第 40 次飞行。',
    noteTranslated: '发射成功 · 加州当地时间 2026.09.19 18:47 PDT',
  },
]

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
  const archivedLaunchTimes = SPACEX_ARCHIVED_LAUNCHES.map((entry) => Date.parse(entry.publishedAt))
  const uniqueLaunches = Array.from(new Map(launches.map((entry) => [entry.id, entry])).values())
    .filter((entry) => !archivedLaunchTimes.some((time) => Math.abs(Date.parse(entry.publishedAt) - time) < 60_000))
  const entries = [...SPACEX_ARCHIVED_LAUNCHES, ...SPACEX_EDITORIAL_ENTRIES, ...uniqueLaunches].sort(
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
