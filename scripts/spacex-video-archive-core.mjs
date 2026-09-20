const HOUR_MS = 60 * 60 * 1000

const LOCATION_ZH = new Map([
  ['Vandenberg SFB, CA, USA', '加州范登堡太空军基地'],
  ['Cape Canaveral SFS, FL, USA', '佛罗里达州卡纳维拉尔角太空军基地'],
  ['Kennedy Space Center, FL, USA', '佛罗里达州肯尼迪航天中心'],
  ['Starbase, TX, USA', '得州星舰基地'],
])

export function chooseNearestLaunch(launches, timestamp, maxHours = 12) {
  const target = Date.parse(timestamp)
  if (!Number.isFinite(target)) throw new Error('视频没有可用的 UTC creation_time')

  const candidates = launches
    .filter((launch) => Number.isFinite(Date.parse(launch?.net)))
    .map((launch) => ({ launch, deltaMs: Math.abs(Date.parse(launch.net) - target) }))
    .sort((a, b) => a.deltaMs - b.deltaMs)

  if (!candidates.length || candidates[0].deltaMs > maxHours * HOUR_MS) return null
  return candidates[0]
}

function slugify(value) {
  return String(value || 'launch')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64) || 'launch'
}

function payloadCount(description) {
  const match = String(description || '').match(/(?:batch of|launch(?:es|ing)?|carrying)\s+(\d+)\s+(?:starlink\s+)?satellites/i)
  return match ? Number(match[1]) : null
}

function localTime(iso, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    timeZoneName: 'shortOffset',
  })
  const parts = Object.fromEntries(formatter.formatToParts(new Date(iso)).map((part) => [part.type, part.value]))
  const rawOffset = String(parts.timeZoneName || 'GMT+0').replace('GMT', '') || '+0'
  const sign = rawOffset.startsWith('-') ? '-' : '+'
  const [hour, minute = '0'] = rawOffset.replace(/[+-]/, '').split(':')
  return {
    value: `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`,
    timezone: timeZone,
    utcOffset: `${sign}${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
  }
}

function topicFor(name) {
  const text = String(name || '').toLowerCase()
  if (text.includes('starlink')) return 'Starlink'
  if (text.includes('starship')) return 'Starship'
  if (text.includes('dragon') || text.includes('crew')) return 'Dragon'
  return 'Falcon'
}

function launchOutcome(status) {
  if (/successful|success/i.test(status || '')) return 'success'
  if (/partial/i.test(status || '')) return 'partial'
  if (/failure|failed/i.test(status || '')) return 'failure'
  return 'unknown'
}

function landingOutcome(stage) {
  if (!stage?.landing?.attempt) return 'not-attempted'
  if (stage.landing.success === true) return 'success'
  if (stage.landing.success === false) return 'failure'
  return 'unknown'
}

function launchCopy(detail, count) {
  const missionName = detail.mission?.name || detail.name || 'SpaceX 发射任务'
  const location = detail.pad?.location?.name || detail.pad?.name || ''
  const locationZh = LOCATION_ZH.get(location) || location
  const pad = detail.pad?.name || ''
  const stage = detail.rocket?.launcher_stage?.[0]
  const booster = stage?.launcher?.serial_number || ''
  const flight = stage?.launcher_flight_number
  const landingName = stage?.landing?.landing_location?.name || ''
  const classified = /top secret|classified/i.test(`${detail.mission?.type || ''} ${detail.mission?.description || ''}`)
  const starlink = /starlink/i.test(missionName)
  const payloadText = classified
    ? `美国太空军 ${missionName} 分类载荷，任务细节未公开`
    : starlink && count
      ? `${count} 颗 Starlink 卫星`
      : missionName
  const title = classified
    ? `${missionName}：分类载荷从${locationZh.replace(/太空军基地$/, '')}升空`
    : starlink && count
      ? `${missionName.replace(/Group\s*/i, '')}：${count} 颗卫星进入低地球轨道`
      : `${missionName}：从${locationZh}升空`
  const first = `${detail.rocket?.configuration?.name || 'SpaceX 火箭'} 从${locationZh}${pad ? ` ${pad}` : ''}发射${payloadText}。`
  const second = booster && flight
    ? `一级助推器 ${booster} 完成第 ${flight} 次飞行${landingName ? `，并${stage.landing?.success ? '成功' : ''}着陆“${landingName}”${stage.landing?.type?.abbrev === 'ASDS' || /course|instructions|gravitas/i.test(landingName) ? '无人船' : ''}` : ''}。`
    : ''
  return { title, summary: `${first}${second}`, classified }
}

export function buildArchiveDraft(detail, { creationTime, postUrl = '', videoDescription = '' } = {}) {
  if (!detail?.net) throw new Error('任务详情缺少 net')
  const missionName = detail.mission?.name || detail.name
  const stage = detail.rocket?.launcher_stage?.[0]
  const description = detail.mission?.description || ''
  const count = payloadCount(description)
  const timeZone = detail.pad?.location?.timezone_name || 'UTC'
  const local = localTime(detail.net, timeZone)
  const copy = launchCopy(detail, count)
  const date = detail.net.slice(0, 10)
  const infoSources = Array.isArray(detail.info_urls) ? detail.info_urls : []
  const sources = [
    ...(postUrl ? [{ label: 'SpaceX · X', url: postUrl, supports: ['官方视频与帖子文字'] }] : []),
    ...infoSources.slice(0, 2).map((source) => ({ label: source.title || source.publisher || source.source, url: source.url, supports: ['任务页信息'] })),
    { label: 'Launch Library 2', url: detail.url, supports: ['发射时间、地点、火箭、助推器与着陆结果'] },
  ]
  const needsVerification = []
  if (!postUrl) needsVerification.push('补充 SpaceX 官方 X 帖子 URL')
  if (!creationTime) needsVerification.push('视频缺少 creation_time，无法自动核对任务匹配')

  return {
    schemaVersion: 1,
    missionName,
    launchedAtUtc: detail.net,
    launchedAtLocal: local,
    launchSite: { name: detail.pad?.location?.name || '', pad: detail.pad?.name || '' },
    rocket: {
      family: detail.rocket?.configuration?.name || detail.rocket?.configuration?.full_name || '',
      booster: stage?.launcher?.serial_number || null,
      flightNumber: stage?.launcher_flight_number ?? null,
    },
    payload: {
      name: missionName,
      count,
      type: detail.mission?.type || '',
      destination: detail.mission?.orbit?.name || '',
    },
    outcome: {
      launch: launchOutcome(detail.status?.name),
      boosterLanding: landingOutcome(stage),
      landingSite: stage?.landing?.landing_location?.name || '',
    },
    highlights: [],
    video: {
      postUrl,
      account: '@SpaceX',
      descriptionZh: videoDescription || `${missionName} 官方发射影像`,
      recommendedClip: '',
      credit: '影像：SpaceX',
      creationTime: creationTime || null,
    },
    sources,
    needsVerification,
    timelineDraft: {
      id: `spacex-${slugify(missionName)}-${date}`,
      publishedAt: detail.net,
      topic: topicFor(missionName),
      titleZh: copy.title,
      summaryZh: copy.summary,
      noteZh: `发射${launchOutcome(detail.status?.name) === 'success' ? '成功' : '结果待核验'} · 当地时间 ${local.value} ${local.utcOffset}${copy.classified ? ' · 载荷信息分类' : ''}`,
    },
  }
}

export function validateArchiveDraft(record, { allowUnverified = false } = {}) {
  const errors = []
  if (record?.schemaVersion !== 1) errors.push('schemaVersion 必须为 1')
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(record?.launchedAtUtc || '')) errors.push('launchedAtUtc 必须是秒级 UTC ISO 8601')
  for (const field of ['id', 'publishedAt', 'topic', 'titleZh', 'summaryZh', 'noteZh']) {
    if (!record?.timelineDraft?.[field]) errors.push(`timelineDraft.${field} 不能为空`)
  }
  if (record?.timelineDraft?.publishedAt !== record?.launchedAtUtc) errors.push('timelineDraft.publishedAt 必须等于 launchedAtUtc')
  if (!['Starlink', 'Starship', 'Dragon', 'Falcon'].includes(record?.timelineDraft?.topic)) errors.push('timelineDraft.topic 不在允许范围内')
  if (!/^https:\/\/(x|twitter)\.com\/SpaceX\//i.test(record?.video?.postUrl || '')) errors.push('video.postUrl 必须是 SpaceX 官方 X 帖子')
  if (!Array.isArray(record?.sources) || record.sources.length < 2) errors.push('至少需要两个来源')
  if (!allowUnverified && record?.needsVerification?.length) errors.push(`仍有待核验字段：${record.needsVerification.join('；')}`)
  if (record?.outcome?.launch !== 'success') errors.push('自动归档只接受已经成功发射的任务')
  return errors
}

export function timelineEntryFromDraft(record, videoSrc) {
  const draft = record.timelineDraft
  const missionName = record.missionName
  const local = record.launchedAtLocal
  const core = record.rocket?.booster
    ? ` Booster ${record.rocket.booster} completed flight ${record.rocket.flightNumber || 'unknown'}.`
    : ''
  const summaryEn = `${record.rocket?.family || 'SpaceX rocket'} launched ${missionName} from ${record.launchSite?.pad || record.launchSite?.name || 'the launch site'}.${core}`
  const source = record.sources[0]
  return {
    id: draft.id,
    publishedAt: draft.publishedAt,
    kind: 'launch',
    topic: draft.topic,
    title: draft.titleZh,
    titleEn: missionName,
    summary: draft.summaryZh,
    summaryEn,
    sourceLabel: source.label,
    sourceUrl: source.url,
    note: draft.noteZh,
    noteEn: `Launch successful · ${local?.value || record.launchedAtUtc} ${local?.utcOffset || 'UTC'}`,
    phase: 'previous',
    status: 'Launch Successful',
    video: {
      src: videoSrc,
      label: record.video.descriptionZh,
      credit: record.video.credit || '影像：SpaceX',
      postUrl: record.video.postUrl,
    },
    originalLanguage: 'en',
    titleOriginal: missionName,
    summaryOriginal: summaryEn,
    noteOriginal: `Launch successful · ${local?.value || record.launchedAtUtc} ${local?.utcOffset || 'UTC'}`,
    titleTranslated: draft.titleZh,
    summaryTranslated: draft.summaryZh,
    noteTranslated: draft.noteZh,
  }
}
