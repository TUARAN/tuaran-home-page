/**
 * 2026 世界杯数据源抽象层
 * 目标: 屏蔽外部 API 差异,统一给采集器和页面提供
 *   - fetchMatches()
 *   - fetchStandings()     ← 从 matches 现场计算
 *   - fetchTopScorers()    ← 从 matches.goals 聚合
 *   - fetchTopAssists()    ← 源没有,返回 []
 *   - fetchCards()         ← 源没有,返回 []
 *
 * 当前实现: openfootball/worldcup.json (GitHub 公共 JSON, 无 key, 无限流)
 *   仓库: https://github.com/openfootball/worldcup.json
 *   文件: https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json
 *
 *   数据现状:
 *     ✅ 全部 104 场赛程 (含 round / group / date / time / venue)
 *     ✅ 已完赛的有 ft/ht 比分 + goals1/goals2 进球明细 (含 penalty/owngoal)
 *     ❌ 积分榜 / 助攻 / 红黄牌 (源不提供)
 *
 * 未来如要换源,新增一个 adapter 切换 default 即可。
 */

const OPENFOOTBALL_URL =
  'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json'

/* ━━━ 数据拉取 ━━━ */

let _cache = null // 同进程内缓存,避免重复拉
let _cacheAt = 0
const CACHE_TTL_MS = 60 * 1000 // 1 分钟

async function loadRaw() {
  const now = Date.now()
  if (_cache && now - _cacheAt < CACHE_TTL_MS) return _cache
  const res = await fetch(OPENFOOTBALL_URL, {
    headers: { 'user-agent': 'tuaran-home-page/wc-collector' },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`openfootball ${res.status}: ${text.slice(0, 200)}`)
  }
  const json = await res.json()
  if (!json || !Array.isArray(json.matches)) {
    throw new Error('openfootball 响应结构异常,缺少 matches 数组')
  }
  _cache = json
  _cacheAt = now
  return json
}

/* ━━━ matches ━━━ */

export async function fetchMatches(/* apiKey 占位,无 key 概念 */ _apiKey, _opts) {
  const raw = await loadRaw()
  return raw.matches.map((m, idx) => normalizeMatch(m, idx))
}

function normalizeMatch(m, idx) {
  // 时间: '13:00 UTC-6' → '13:00' (本地时区展示按前端)
  const timeStr = (m.time || '').split(/\s+/)[0] || ''
  // status: 已有 score 视为 FT,否则 NS
  const hasScore = m.score && m.score.ft && Array.isArray(m.score.ft)
  const status_short = hasScore ? 'FT' : 'NS'
  const status_long = hasScore ? 'Match Finished' : 'Not Started'
  // num: openfootball 用 num 字段;没有时按 idx+1 当临时 ID
  const num = m.num ?? idx + 1
  return {
    fixture_id: num, // 用 num 作为稳定 ID (openfootball 没全局 fixture id)
    league_id: 1,
    season: 2026,
    round: m.round || '',
    group_label: extractGroup(m.group || m.round || ''),
    match_date: m.date || '',
    match_time: timeStr,
    match_timestamp: unixFromDate(m.date, timeStr),
    venue: m.ground || '', // openfootball 用 city/venue 字符串
    city: m.ground || '',
    home_team_id: teamId(m.team1),
    home_team: m.team1 || '',
    home_flag: '',
    away_team_id: teamId(m.team2),
    away_team: m.team2 || '',
    away_flag: '',
    status_short,
    status_long,
    status_elapsed: hasScore ? 90 : 0,
    home_goals: hasScore ? m.score.ft[0] : null,
    away_goals: hasScore ? m.score.ft[1] : null,
    home_goals_et: null,
    away_goals_et: null,
    home_goals_pen: null,
    away_goals_pen: null,
    // 内部用:从 goals 数组还原 events
    _goals1: m.goals1 || [],
    _goals2: m.goals2 || [],
  }
}

function extractGroup(s) {
  // 'Group A' → 'A'; 'Matchday 1' / 'Round of 32' → ''
  const m = /^Group\s+([A-L])$/i.exec(s)
  return m ? m[1].toUpperCase() : ''
}

function teamId(name) {
  if (!name) return 0
  // 用字符串 hash 当 ID (跨调用稳定)
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  return Math.abs(h)
}

function unixFromDate(dateStr, timeStr) {
  if (!dateStr) return 0
  // '2026-06-11' + '13:00' → unix
  const t = Date.parse(`${dateStr}T${timeStr || '00:00'}:00Z`)
  return Number.isFinite(t) ? Math.floor(t / 1000) : 0
}

/* ━━━ standings (从 matches 现场算) ━━━ */

export async function fetchStandings(_apiKey) {
  const raw = await loadRaw()
  // 只算已完赛的小组赛 (status_short === 'FT' 且有 group_label)
  const out = []
  const tableMap = new Map() // group → { teamName → row }
  for (const m of raw.matches) {
    const group = extractGroup(m.group || '')
    if (!group) continue
    if (!m.score || !m.score.ft) continue
    const [h, a] = m.score.ft
    ensureTeam(tableMap, group, m.team1)
    ensureTeam(tableMap, group, m.team2)
    const t1 = tableMap.get(group).get(m.team1)
    const t2 = tableMap.get(group).get(m.team2)
    t1.played++
    t2.played++
    t1.goals_for += h
    t1.goals_against += a
    t2.goals_for += a
    t2.goals_against += h
    if (h > a) {
      t1.win++; t1.points += 3
      t2.lose++
    } else if (h < a) {
      t2.win++; t2.points += 3
      t1.lose++
    } else {
      t1.draw++; t1.points++
      t2.draw++; t2.points++
    }
  }
  for (const [group, teams] of tableMap) {
    const rows = [...teams.values()].map((r) => ({
      ...r,
      goal_diff: r.goals_for - r.goals_against,
    }))
    rows.sort((x, y) => {
      if (y.points !== x.points) return y.points - x.points
      if (y.goal_diff !== x.goal_diff) return y.goal_diff - x.goal_diff
      if (y.goals_for !== x.goals_for) return y.goals_for - x.goals_for
      return x.team_name.localeCompare(y.team_name)
    })
    rows.forEach((r, i) => (r.rank = i + 1))
    rows.forEach((r) =>
      out.push({
        group_label: group,
        team_id: teamId(r.team_name),
        team_name: r.team_name,
        team_flag: '',
        rank: r.rank,
        played: r.played,
        win: r.win,
        draw: r.draw,
        lose: r.lose,
        goals_for: r.goals_for,
        goals_against: r.goals_against,
        goal_diff: r.goal_diff,
        points: r.points,
      }),
    )
  }
  return out
}

function ensureTeam(map, group, name) {
  if (!map.has(group)) map.set(group, new Map())
  const t = map.get(group)
  if (!t.has(name)) {
    t.set(name, {
      team_name: name,
      played: 0, win: 0, draw: 0, lose: 0,
      goals_for: 0, goals_against: 0, points: 0,
    })
  }
}

/* ━━━ top scorers (从 goals 数组聚合) ━━━ */

export async function fetchTopScorers(_apiKey, { limit = 20 } = {}) {
  const raw = await loadRaw()
  const map = new Map() // playerName → row
  for (const m of raw.matches) {
    if (!Array.isArray(m.goals1)) continue
    for (const g of m.goals1) addGoal(map, g, m.team1, m.date)
    for (const g of m.goals2) addGoal(map, g, m.team2, m.date)
  }
  const rows = [...map.values()]
  rows.sort((a, b) => {
    if (b.goals !== a.goals) return b.goals - a.goals
    if (b.penalties !== a.penalties) return a.penalties - b.penalties // 点球少的靠前
    return a.player_name.localeCompare(b.player_name)
  })
  return rows.slice(0, limit).map((r) => ({
    player_id: teamId(r.player_name),
    player_name: r.player_name,
    team_id: teamId(r.team_name),
    team_name: r.team_name,
    team_flag: '',
    goals: r.goals,
    assists: 0, // 源没有
    played: r.played,
    penalties: r.penalties,
  }))
}

function addGoal(map, g, teamName, date) {
  if (!g || !g.name) return
  const name = g.name
  if (!map.has(name)) {
    map.set(name, {
      player_name: name,
      team_name: teamName,
      goals: 0,
      penalties: 0,
      played: 0,
    })
  }
  const r = map.get(name)
  r.goals++
  if (g.penalty) r.penalties++
  // 球员参与场次去重
  if (date) r._dates = r._dates || new Set()
  if (date) r._dates.add(date)
}

/* ━━━ top assists / cards — 源不提供,返回空 ━━━ */

export async function fetchTopAssists(_apiKey, _opts) {
  return []
}

export async function fetchCards(_apiKey, _opts) {
  return []
}

/* ━━━ 比赛 events (从 matches.goals 还原) ━━━ */

export async function fetchFixtureEvents(_apiKey, _fixtureId) {
  // openfootball 没有单独 events 端点,改用 matchEvents(fixture) 直接读
  return []
}

export function matchEvents(matches, fixtureId) {
  // 从已经 normalize 过的 matches 数组里找一个 fixture 还原 events
  const m = matches.find((x) => String(x.fixture_id) === String(fixtureId))
  if (!m) return { goals: [], cards: [] }
  const goals = []
  for (const g of m._goals1 || []) {
    goals.push({
      fixture_id: m.fixture_id,
      minute: parseInt(g.minute, 10) || 0,
      team_id: m.home_team_id,
      team_name: m.home_team,
      player: g.name || '',
      detail: g.penalty ? 'Penalty' : g.owngoal ? 'Own Goal' : 'Normal Goal',
      assist: '',
    })
  }
  for (const g of m._goals2 || []) {
    goals.push({
      fixture_id: m.fixture_id,
      minute: parseInt(g.minute, 10) || 0,
      team_id: m.away_team_id,
      team_name: m.away_team,
      player: g.name || '',
      detail: g.penalty ? 'Penalty' : g.owngoal ? 'Own Goal' : 'Normal Goal',
      assist: '',
    })
  }
  return { goals, cards: [] }
}

/* ━━━ 工具 ━━━ */

export function formatScore(match) {
  if (match.home_goals == null || match.away_goals == null) return null
  let s = `${match.home_goals}-${match.away_goals}`
  if (match.status_short === 'AET' || match.status_short === 'PEN') {
    s += ` (${match.home_goals_et ?? 0}-${match.away_goals_et ?? 0})`
    if (match.status_short === 'PEN') {
      s += ` [点球 ${match.home_goals_pen ?? 0}-${match.away_goals_pen ?? 0}]`
    }
  }
  return s
}
