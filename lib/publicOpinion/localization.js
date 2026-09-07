const DEFAULT_BATCH_SIZE = 20

function countMatches(value, pattern) {
  return (String(value || '').match(pattern) || []).length
}

export function needsChineseLocalization(value) {
  const text = String(value || '').trim()
  if (!text) return false
  const chineseCount = countMatches(text, /[\u3400-\u9fff]/g)
  const latinCount = countMatches(text, /[a-z]/gi)
  return chineseCount < 2 || latinCount > chineseCount * 4
}

export function buildLocalizationMessages(posts) {
  const samples = posts.map((post) => ({
    id: post.id,
    title: post.text,
    sourceExcerpt: post.sourceExcerpt || '',
    platform: post.platform,
  }))

  return [
    {
      role: 'system',
      content: [
        '你是中文科技舆情编辑。把英文公开信息改写成自然、准确、简洁的简体中文。',
        '保留人名、公司名、产品名、型号和必要的英文缩写；不添加输入中没有的事实。',
        '每条返回 titleZh 和 summaryZh。titleZh 是中文标题；summaryZh 用 1—2 句说清大致内容。',
        '只输出 JSON 对象：{"items":[{"id":"...","titleZh":"...","summaryZh":"..."}]}。',
      ].join('\n'),
    },
    {
      role: 'user',
      content: `请汉化这些舆情样本：\n${JSON.stringify(samples)}`,
    },
  ]
}

export function applyLocalizedItems(posts, items) {
  const localizedById = new Map(
    (Array.isArray(items) ? items : [])
      .filter((item) => item && typeof item === 'object')
      .map((item) => [String(item.id || ''), item]),
  )
  let translatedCount = 0

  const localizedPosts = posts.map((post) => {
    if (!needsChineseLocalization(post.text)) return post
    const localized = localizedById.get(String(post.id))
    const titleZh = String(localized?.titleZh || '').trim().slice(0, 320)
    const summaryZh = String(localized?.summaryZh || '').trim().slice(0, 500)
    if (needsChineseLocalization(titleZh) || !summaryZh || needsChineseLocalization(summaryZh)) {
      return post
    }
    translatedCount += 1
    return {
      ...post,
      text: titleZh,
      viewpoint: summaryZh,
    }
  })

  return { posts: localizedPosts, translatedCount }
}

export async function localizePublicOpinionPosts(posts, translateBatch, batchSize = DEFAULT_BATCH_SIZE) {
  const candidates = posts.filter((post) => needsChineseLocalization(post.text))
  if (!candidates.length) {
    return { posts, translatedCount: 0, failedBatches: 0, errors: [] }
  }

  const batches = []
  for (let index = 0; index < candidates.length; index += batchSize) {
    batches.push(candidates.slice(index, index + batchSize))
  }

  const results = await Promise.allSettled(batches.map((batch) => translateBatch(batch)))
  let localizedPosts = posts
  let translatedCount = 0
  const errors = []

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      errors.push(result.reason?.message || `第 ${index + 1} 批汉化失败`)
      return
    }
    const applied = applyLocalizedItems(localizedPosts, result.value?.items)
    localizedPosts = applied.posts
    translatedCount += applied.translatedCount
  })

  return {
    posts: localizedPosts,
    translatedCount,
    failedBatches: errors.length,
    errors,
  }
}
