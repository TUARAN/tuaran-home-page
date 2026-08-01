import { getOwnerOrReject } from '../../../../lib/adminAuth'
import {
  AGENT_OPS_EXTERNAL_URL,
  AGENT_OPS_LOCAL_URL,
  AGENT_OPS_ROOT,
  AUTOMATION_REGISTRY,
  OPS_RECENT_RUNS,
  registryEntryText,
} from '../../../../lib/adminOpsRegistry'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const startedAt = Date.now()
  const registry = AUTOMATION_REGISTRY.map((item) => ({
    ...item,
    registryText: registryEntryText(item),
    latestRun: OPS_RECENT_RUNS.find((run) => run.taskId === item.id) || null,
  }))
  const repositoryByTask = new Map(registry.map((item) => [item.id, item.repository]))
  const recentRuns = OPS_RECENT_RUNS.map((run) => ({
    ...run,
    repository: run.repository || repositoryByTask.get(run.taskId) || null,
  }))
  const cloudAutomations = registry.filter((item) => item.scope === 'cloud')
  const localAutomations = registry.filter((item) => item.scope === 'local')
  const autoRunItems = registry.filter((item) => item.autoRun)
  const reviewRequiredItems = registry.filter((item) => item.reviewRequired)
  const pendingReviewRuns = recentRuns.filter((run) => run.reviewStatus === 'pending_review')
  const successRuns = recentRuns.filter((run) => run.status === 'success')

  return Response.json({
    status: 'reachable',
    label: '站内可访问',
    message: '当前请求已通过站内 admin owner 校验。云端与本地自动化已统一进入 Automation Registry。',
    checkedAt: Date.now(),
    latencyMs: Date.now() - startedAt,
    route: '/admin/ops',
    root: AGENT_OPS_ROOT,
    externalUrl: AGENT_OPS_EXTERNAL_URL,
    localUrl: AGENT_OPS_LOCAL_URL,
    registry,
    cloudAutomations,
    localAutomations,
    recentRuns,
    stats: {
      totalTasks: registry.length,
      cloudTasks: cloudAutomations.length,
      localTasks: localAutomations.length,
      autoRun: autoRunItems.length,
      reviewRequired: reviewRequiredItems.length,
      recentRuns: recentRuns.length,
      successRuns: successRuns.length,
      pendingReview: pendingReviewRuns.length,
      artifacts: recentRuns.reduce((sum, run) => sum + (run.artifacts || []).length, 0),
    },
  })
}
