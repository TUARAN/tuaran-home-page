import { getOwnerOrReject } from '../../../../../lib/adminAuth'
import { getD1 } from '../../../../../lib/d1'
import { callOllama } from '../../../../../lib/ollama'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function cleanText(value, length) {
  return String(value || '').trim().slice(0, length)
}

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => null)
  const providerId = cleanText(body?.id, 120)
  const model = cleanText(body?.model, 160)
  const prompt = cleanText(body?.prompt, 8000)
  if (!providerId) return Response.json({ error: 'MISSING_ID', detail: '请选择 Ollama 服务。' }, { status: 400 })
  if (!model) return Response.json({ error: 'MISSING_MODEL', detail: '请选择要测试的模型。' }, { status: 400 })
  if (!prompt) return Response.json({ error: 'MISSING_PROMPT', detail: '请输入测试提示词。' }, { status: 400 })

  const startedAt = Date.now()
  try {
    const result = await callOllama({
      providerId,
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      maxTokens: 1024,
      reasoningEffort: 'none',
      timeoutMs: 120000,
      task: {
        source: 'admin-llm-provider',
        taskType: 'direct-test',
        title: 'Ollama 直接调用测试',
        actorId: guard.user?.id || guard.user?.login || '',
        actorName: guard.user?.name || guard.user?.login || 'TUARAN',
        inputSummary: `后台直接测试 ${model}，提示词 ${prompt.length} 字符；不记录完整 Prompt。`,
      },
    })
    const checkedAt = Date.now()
    await getD1().prepare(
      "UPDATE llm_providers SET last_checked_at = ?, last_check_status = 'succeeded', last_check_detail = ?, updated_at = ? WHERE id = ?",
    ).bind(checkedAt, `直接调用 ${result.model || model} 成功：${result.content.slice(0, 120)}`, checkedAt, providerId).run()
    return Response.json({
      ok: true,
      model: result.model || model,
      content: result.content,
      usage: result.usage || null,
      taskId: result.taskId,
      durationMs: Date.now() - startedAt,
    })
  } catch (error) {
    const checkedAt = Date.now()
    const detail = String(error?.message || error).slice(0, 500)
    try {
      await getD1().prepare(
        "UPDATE llm_providers SET last_checked_at = ?, last_check_status = 'failed', last_check_detail = ?, updated_at = ? WHERE id = ?",
      ).bind(checkedAt, `直接调用 ${model} 失败：${detail}`, checkedAt, providerId).run()
    } catch {}
    return Response.json({
      error: error?.code || 'OLLAMA_DIRECT_TEST_FAILED',
      detail,
      durationMs: Date.now() - startedAt,
    }, { status: error?.status || 502 })
  }
}
