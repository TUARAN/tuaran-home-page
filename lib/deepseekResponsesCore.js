/**
 * DeepSeek Responses API · 纯解析逻辑（无 Cloudflare 依赖，可单测）
 *
 * Responses API 结构兼容 OpenAI Responses API：
 *   output[] 中 web_search_call 项携带 search_results；
 *   message 项的 content[] 里 output_text 携带 text 与 annotations（url_citation）。
 * 运行时封装（网络调用、密钥、台账）见 lib/deepseek.js。
 */

/** 将 Responses API 的 usage 归一化成 chat/completions 形状，台账统一按 prompt/completion/total 记录。 */
export function normalizeResponsesUsage(usage) {
  if (!usage) return null
  return {
    prompt_tokens: Number(usage?.input_tokens) || Number(usage?.prompt_tokens) || 0,
    completion_tokens: Number(usage?.output_tokens) || Number(usage?.completion_tokens) || 0,
    total_tokens: Number(usage?.total_tokens) || 0,
  }
}

/**
 * 从 Responses API 原始响应里抽取正文、引用与检索信息。
 * @returns {{content: string, citations: Array, searchResults: Array, webSearchCalls: number}}
 */
export function parseResponsesOutput(raw) {
  const output = Array.isArray(raw?.output) ? raw.output : []
  const citations = []
  const searchResults = []
  let webSearchCalls = 0
  // Responses API 在工具调用循环中会产生多个 message：
  // 前面的 message 是模型检索前的中间输出（计划、自言自语），最后一个 message 才是最终回答。
  // 正文只取最后一个含文本的 message，避免把中间输出拼进成稿。
  let finalContent = ''

  for (const item of output) {
    if (item?.type === 'web_search_call') {
      webSearchCalls += 1
      for (const result of item?.search_results || []) {
        searchResults.push({
          title: String(result?.title || '').slice(0, 300),
          url: String(result?.url || '').slice(0, 1000),
        })
      }
      continue
    }
    if (item?.type !== 'message') continue
    const parts = []
    for (const part of item?.content || []) {
      if (part?.type !== 'output_text' && part?.type !== 'text') continue
      if (part?.text) parts.push(String(part.text))
      for (const annotation of part?.annotations || []) {
        if (annotation?.type === 'url_citation' && annotation?.url) {
          citations.push({
            title: String(annotation.title || '').slice(0, 300),
            url: String(annotation.url).slice(0, 1000),
          })
        }
      }
    }
    if (parts.length) finalContent = parts.join('\n')
  }

  return {
    content: finalContent,
    citations,
    searchResults,
    webSearchCalls,
  }
}
