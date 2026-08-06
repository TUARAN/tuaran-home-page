/**
 * A 股公司观察 · 后台发布纯逻辑（无外部依赖，可单测）
 *
 * 草稿发布 = 把 D1 草稿转成 research/companies/<date>-a-share-<code>.md
 * 并提交到仓库 main（Cloudflare 构建后上线）。本文件只做内容组装与校验，
 * GitHub 提交与 D1 状态更新见 app/api/admin/a-share-research/publish/route.js。
 */

/** 校验草稿来源节是否存在（与 aShareResearchCore.validateDraft 同一口径）。 */
export function hasSourceSection(content) {
  return /^## .*(?:信息来源|资料来源|来源与说明)/mu.test(String(content || ''))
}

/**
 * 清除 frontmatter 之前的杂文（模型在联网检索前输出的中间内容）。
 * 找到首个行首为 `---` 的 frontmatter 起点，之前的文本全部丢弃；本身干净则原样返回。
 */
export function stripPreamble(content) {
  const text = String(content || '')
  if (/^---\r?\n/.test(text)) return text
  const match = /\r?\n---\r?\n/u.exec(text)
  if (!match || match.index < 0) return text
  return text.slice(match.index + 1)
}

/**
 * 把生成草稿转成待发布文章：人工复核通过后 review_ready 置 true，
 * 其余 frontmatter 与正文保持原样（ad_eligible 保持 false，广告审查另行处理）。
 */
export function draftToArticleContent(content) {
  const text = stripPreamble(content)
  if (!/^review_ready:\s*false\s*$/mu.test(text)) {
    throw new Error('草稿 frontmatter 缺少 review_ready: false，无法进入发布流程。')
  }
  return text.replace(/^review_ready:\s*false\s*$/mu, 'review_ready: true')
}

/** 发布文件名：沿用本地流水线惯例 <日期>-a-share-<代码>.md。 */
export function publishFileName(draft) {
  const date = String(draft?.draft_date || '').trim()
  const code = String(draft?.code || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`draft_date 非法：${date}`)
  if (!/^\d{6}$/.test(code)) throw new Error(`证券代码非法：${code}`)
  return `${date}-a-share-${code}.md`
}

/** 发布文件对应的公开文章 slug（与 lib/research/loader.js fileToSlug 一致）。 */
export function publishSlug(fileName) {
  const match = /^\d{4}-\d{2}-\d{2}-(.+?)\.md$/u.exec(String(fileName || ''))
  if (!match) throw new Error(`文件名无法推导 slug：${fileName}`)
  return match[1]
}

/** 发布前最小校验：frontmatter 关键字段 + 长度 + 来源节。 */
export function validatePublishContent(content, { code, name } = {}) {
  const text = String(content || '')
  if (text.length < 200) throw new Error('发布内容过短，疑似空响应。')
  if (!/^---\r?\n/u.test(text)) throw new Error('发布内容必须以 frontmatter 开头（存在未清洗的模型中间输出）。')
  if (!hasSourceSection(text)) throw new Error('发布内容缺少结尾来源章节。')
  if (/\{\{[A-Z0-9_]+\}\}/u.test(text)) throw new Error('发布内容仍包含未替换的模板占位符。')

  const required = [
    [/^title:\s*/mu, 'title'],
    [/^category:\s*companies\s*$/mu, 'category 必须为 companies'],
    [/^company_type:\s*a_share\s*$/mu, 'company_type 必须为 a_share'],
    [/^stock_code:\s*"?\d{6}"?\s*$/mu, 'stock_code 必须是 6 位代码'],
    [/^exchange:\s*/mu, 'exchange'],
    [/^board:\s*/mu, 'board'],
    [/^date:\s*"?\d{4}-\d{2}-\d{2}"?\s*$/mu, 'date 必须为 YYYY-MM-DD'],
    [/^tags:\s*\[/mu, 'tags'],
    [/^summary:\s*\S/mu, 'summary'],
    [/^review_ready:\s*true\s*$/mu, 'review_ready 必须为 true（人工复核后发布）'],
    [/^ad_eligible:\s*false\s*$/mu, 'ad_eligible 必须保持 false'],
  ]
  for (const [pattern, label] of required) {
    if (!pattern.test(text)) throw new Error(`发布校验失败：缺少 ${label}。`)
  }
  if (code && !new RegExp(`stock_code:\\s*"?${code}"?`, 'u').test(text)) {
    throw new Error(`发布校验失败：stock_code 与草稿 ${code} 不一致。`)
  }
  if (name && !text.includes(String(name))) {
    throw new Error(`发布校验失败：正文未包含公司名「${name}」。`)
  }
  return true
}
