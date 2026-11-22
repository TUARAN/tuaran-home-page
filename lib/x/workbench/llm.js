// 工作台使用的模型调用：统一走 DeepSeek（站长自动化方针）。
import { callDeepSeek } from '../../ai/deepseek.js'

export async function workbenchLlm(messages, { temperature = 0.7, maxTokens = 2048, json = false } = {}) {
  const res = await callDeepSeek({
    messages,
    temperature,
    maxTokens,
    disableThinking: true,
    timeoutMs: 45000,
    ...(json ? { responseFormat: { type: 'json_object' } } : {}),
  })
  return { content: res.content }
}
