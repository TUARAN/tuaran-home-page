import { loadObservedActions } from '../../interaction/dailyTop/ownActivity.js'
import {
  ACCOUNT_BOARD_LIMIT,
  OBSERVED_AGENTS,
  agentFootnote,
  blankActions,
  hotBoardAccountConclusion,
  hotBoardTweetConclusion,
  statReportDate,
} from './observeCore.js'
import { loadXHotBoard, X_HOT_BOARD_LIMIT } from './xHotBoard.js'

function missingTable(error) {
  return /no such table/i.test(String(error?.message || error))
}

export async function observeHome(db, { hotBoardApiBase = '', fetchImpl } = {}, now = Date.now()) {
  const reportDate = statReportDate(now)
  const gaps = []
  let reportsUnavailable = false

  const hot = await loadXHotBoard({
    apiBase: hotBoardApiBase,
    limit: Math.max(X_HOT_BOARD_LIMIT, ACCOUNT_BOARD_LIMIT),
    fetchImpl,
  })
  gaps.push(...(hot.gaps || []))

  let actionsByHandle = new Map()
  try {
    actionsByHandle = await loadObservedActions(db, {
      handles: OBSERVED_AGENTS.map((agent) => agent.handle),
      reportDate,
    })
  } catch (error) {
    if (!missingTable(error)) throw error
    reportsUnavailable = true
    gaps.push('插件日报暂时读不到，动作次数显示未采集。')
  }

  const tweets = hot.tweets || []
  const accounts = hot.accounts || []
  const radarUnavailable = Boolean(hot.unavailable)

  return {
    ok: true,
    reportDate,
    gaps,
    reportsUnavailable,
    radarUnavailable,
    hotBoardSource: hot.meta?.source || 'unknown',
    hotBoardUpdatedAt: hot.meta?.updatedAt || null,
    hotBoardApiBase: hot.meta?.apiBase || null,
    tweetConclusion: hotBoardTweetConclusion(tweets, { unavailable: radarUnavailable && !tweets.length }),
    tweets: radarUnavailable ? [] : tweets,
    accountConclusion: hotBoardAccountConclusion(accounts),
    accounts: radarUnavailable ? [] : accounts,
    agents: OBSERVED_AGENTS.map((agent) => {
      const key = agent.handle.toLowerCase()
      return {
        name: agent.name,
        handle: agent.handle,
        actions: reportsUnavailable ? blankActions() : (actionsByHandle.get(key) || blankActions()),
      }
    }),
    footnote: agentFootnote({ reportDate }),
  }
}