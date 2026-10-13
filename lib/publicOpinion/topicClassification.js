// Classify by evidence in the item itself. Search queries only discover candidates.
const TOPIC_PATTERNS = [
  ['ai-agents', /(?:\bagents?\b|\bagentic\b|\bopenclaw\b|智能体|代理式编程|自主编程)/i],
  ['llm', /(?:\bdeepseek\b|\bqwen\b|\bkimi\b|\bglm(?:-\d+)?\b|\bgpt(?:-\d+(?:\.\d+)?)?\b|\bchatgpt\b|\bclaude\b(?!\s+code\b)|\bgemini\b|\bllama(?:\s*\d+(?:\.\d+)?)?\b|\bmistral\b|\bgrok\b|\bllms?\b|\blarge language models?\b|\bfoundation models?\b|\b(?:openai|anthropic|google|meta|xai)\b.{0,60}(?:\bmodel\b|模型)|深度求索|通义千问|智谱|豆包大模型|文心大模型|混元大模型|大模型|语言模型)/i],
  ['cloud-dev', /(?:\bcloudflare\b|\bvercel\b|\bnext\.js\b|\bdevelopers? tools?\b|\bdevtools\b|开发(?:者)?工具|前端框架)/i],
  ['creator-policy', /(?:\bcreator economy\b|\bcontent creators?\b|\byoutube creators?\b|\bsubstack\b|\bpatreon\b|\bnewsletters?\b|创作者|内容平台|内容分发|自媒体)/i],
]

export function classifyOpinionTopic(text) {
  const title = String(text || '').trim()
  if (!title) return null
  return TOPIC_PATTERNS.find(([, pattern]) => pattern.test(title))?.[0] || null
}

export function classifyOpinionPosts(posts) {
  return posts.flatMap((post) => {
    const topicId = classifyOpinionTopic(post.text)
    return topicId ? [{ ...post, topicId }] : []
  })
}
