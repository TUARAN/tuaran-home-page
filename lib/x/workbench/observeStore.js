import { latestObservedReportUpload, loadObservedActions } from '../../interaction/dailyTop/ownActivity.js'
import { OBSERVED_AGENTS, agentFootnote, blankActions, statReportDate } from './observeCore.js'

function missingTable(error) {
  return /no such table/i.test(String(error?.message || error))
}

/** 公开首页展示账号池里每个自有智能体的当日动作，不混第三方热榜或账号榜。 */
export async function observeHome(db, _options = {}, now = Date.now()) {
  const reportDate = statReportDate(now)
  const gaps = []
  let reportsUnavailable = false

  const poolHandles = OBSERVED_AGENTS.map((agent) => agent.handle)
  let actionsByHandle = new Map()
  let lastUploadedAt = null
  try {
    actionsByHandle = await loadObservedActions(db, { handles: poolHandles, reportDate })
    lastUploadedAt = await latestObservedReportUpload(db, { handles: poolHandles, reportDate })
  } catch (error) {
    if (!missingTable(error)) throw error
    reportsUnavailable = true
    gaps.push('插件日报暂时读不到，动作次数显示未采集。')
  }

  return {
    ok: true,
    reportDate,
    lastUploadedAt,
    gaps,
    reportsUnavailable,
    agents: OBSERVED_AGENTS.map((agent) => {
      const key = agent.handle.toLowerCase()
      return {
        name: agent.name,
        handle: agent.handle,
        actions: reportsUnavailable ? blankActions() : (actionsByHandle.get(key) || blankActions()),
      }
    }),
    footnote: agentFootnote({ reportDate, lastUploadedAt }),
  }
}