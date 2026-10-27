const isWebUrl = (value) => /^https?:\/\//i.test(value || '')

function newestFirst(entries) {
  return entries.sort((left, right) => right.publishedAt - left.publishedAt)
}

export function normalizeAiHotItems(items = []) {
  return newestFirst(items.filter((item) => isWebUrl(item.links?.original)).map((item) => ({
    id: `ai-hot:${item.id || item.links.original}`,
    source: 'ai-hot',
    title: item.title,
    summary: item.summary,
    link: item.links.original,
    publishedAt: Date.parse(item.publishedAt) || 0,
  })))
}

export function normalizeRuanYifengEntries(entries = []) {
  return newestFirst(entries.filter((entry) => isWebUrl(entry.link)).map((entry) => ({
    id: `ruanyifeng:${entry.guid || entry.link}`,
    source: 'ruanyifeng',
    title: entry.title,
    summary: entry.summary,
    link: entry.link,
    publishedAt: Number(entry.publishedAt) || 0,
  })))
}

// 每个来源保持时间倒序，综合页交替呈现两路内容。
export function interleaveRssPicks(aiHot, ruanYifeng, limit = 8) {
  const mixed = []
  const sources = [aiHot, ruanYifeng]
  let offset = 0
  while (mixed.length < limit && sources.some((source) => offset < source.length)) {
    for (const source of sources) {
      if (source[offset] && mixed.length < limit) mixed.push(source[offset])
    }
    offset += 1
  }
  return mixed
}
