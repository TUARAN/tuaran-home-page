import { getOwnerOrReject } from '../../../../../lib/adminAuth'
import { getD1 } from '../../../../../lib/d1'
import { callOllama } from '../../../../../lib/ollama'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const body = await req.json().catch(() => null)
  const providerId = String(body?.id || '').trim()
  if (!providerId) return Response.json({ error: 'MISSING_ID' }, { status: 400 })

  const checkedAt = Date.now()
  try {
    const result = await callOllama({
      providerId,
      messages: [{ role: 'user', content: '只回复两个字：正常' }],
      temperature: 0,
      maxTokens: 64,
      reasoningEffort: 'none',
      timeoutMs: 30000,
      task: {
        source: 'admin-llm-provider',
        taskType: 'connection-test',
        title: 'Ollama 服务连通性测试',
        actorId: guard.user?.id || guard.user?.login || '',
        actorName: guard.user?.name || guard.user?.login || 'TUARAN',
        inputSummary: '后台发起最小对话测试，不记录完整 Prompt。',
      },
    })
    await getD1().prepare(
      "UPDATE llm_providers SET last_checked_at = ?, last_check_status = 'succeeded', last_check_detail = ?, updated_at = ? WHERE id = ?",
    ).bind(checkedAt, `模型 ${result.model} 返回：${result.content.slice(0, 120)}`, checkedAt, providerId).run()
    return Response.json({ ok: true, model: result.model, content: result.content, taskId: result.taskId, checkedAt })
  } catch (error) {
    const detail = String(error?.message || error).slice(0, 500)
    try {
      await getD1().prepare(
        "UPDATE llm_providers SET last_checked_at = ?, last_check_status = 'failed', last_check_detail = ?, updated_at = ? WHERE id = ?",
      ).bind(checkedAt, detail, checkedAt, providerId).run()
    } catch {}
    return Response.json({ error: error?.code || 'OLLAMA_TEST_FAILED', detail, checkedAt }, { status: error?.status || 502 })
  }
}
