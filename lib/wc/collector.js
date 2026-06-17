/**
 * 采集器: 把数据源抽象层的数据写进 D1
 * 给 app/api/wc/collect/route.js 和 scripts/fetch-world-cup.mjs 复用
 *
 * 入参: db (D1 binding), log (fn)。openfootball 无 key,不需要 apiKey。
 * 返回: { matches, standings, scorers, assists, cards, durationMs }
 *
 * 当前源: openfootball/worldcup.json
 *   - 一次性拉全 104 场
 *   - standings 从 matches 现场算
 *   - scorers 从 matches.goals 聚合
 *   - assists / cards 源不提供,返回 0 行
 */

import {
  fetchMatches,
  fetchStandings,
  fetchTopScorers,
  fetchTopAssists,
  fetchCards,
} from './dataSource.js'

const COLLECT_TS = () => Math.floor(Date.now() / 1000)

export async function runCollect({ db, log = () => {} }) {
  const apiKey = undefined // openfootball 无 key;保留变量名让下游 fetch 签名不变
  const t0 = Date.now()
  const stats = { matches: 0, standings: 0, scorers: 0, assists: 0, cards: 0 }

  /* ━━━ 1. matches ━━━ */
  log('fetching matches…')
  const matches = await fetchMatches(apiKey)
  log(`  → ${matches.length} matches`)
  if (matches.length) {
    await upsertMatches(db, matches)
    stats.matches = matches.length
  }

  /* ━━━ 2. standings (从 matches 现场算) ━━━ */
  log('computing standings from matches…')
  const standings = await fetchStandings(apiKey)
  log(`  → ${standings.length} rows across ${new Set(standings.map((s) => s.group_label)).size} groups`)
  if (standings.length) {
    await upsertStandings(db, standings)
    stats.standings = standings.length
  }

  /* ━━━ 3. top scorers (从 matches.goals 聚合) ━━━ */
  log('aggregating top scorers…')
  const scorers = await fetchTopScorers(apiKey, { limit: 25 })
  log(`  → ${scorers.length} scorers`)
  if (scorers.length) {
    await upsertScorers(db, scorers)
    stats.scorers = scorers.length
  }

  /* ━━━ 4. top assists (源不提供) ━━━ */
  const assists = await fetchTopAssists(apiKey, { limit: 25 })
  log(`  → ${assists.length} assists (source unavailable)`)
  if (assists.length) {
    await upsertAssists(db, assists)
    stats.assists = assists.length
  }

  /* ━━━ 5. cards (源不提供) ━━━ */
  const cards = await fetchCards(apiKey, { limit: 25 })
  log(`  → ${cards.length} card rows (source unavailable)`)
  if (cards.length) {
    await upsertCards(db, cards)
    stats.cards = cards.length
  }

  /* ━━━ 6. meta ━━━ */
  const ts = COLLECT_TS()
  await writeMeta(db, 'last_collect_at', String(ts), ts)
  await writeMeta(db, 'last_collect_status', 'ok', ts)
  await writeMeta(db, 'last_collect_error', '', ts)
  await writeMeta(db, 'data_source', 'openfootball', ts)

  stats.durationMs = Date.now() - t0
  return stats
}

async function writeMeta(db, k, v, ts) {
  await db
    .prepare(
      `INSERT INTO wc_meta (k, v, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(k) DO UPDATE SET v = excluded.v, updated_at = excluded.updated_at`,
    )
    .bind(k, v, ts)
    .run()
}

/* ━━━ upsert helpers ━━━ */

const TS = () => Math.floor(Date.now() / 1000)

function chunk(arr, n) {
  const out = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

async function upsertMatches(db, rows) {
  const ts = TS()
  const sql = `INSERT INTO wc_matches
    (fixture_id, league_id, season, round, group_label, match_date, match_time, match_timestamp,
     venue, city, home_team_id, home_team, home_flag, away_team_id, away_team, away_flag,
     status_short, status_long, status_elapsed,
     home_goals, away_goals, home_goals_et, away_goals_et, home_goals_pen, away_goals_pen,
     updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(fixture_id) DO UPDATE SET
      round = excluded.round,
      group_label = excluded.group_label,
      match_date = excluded.match_date,
      match_time = excluded.match_time,
      match_timestamp = excluded.match_timestamp,
      venue = excluded.venue,
      city = excluded.city,
      home_team = excluded.home_team,
      home_flag = excluded.home_flag,
      away_team = excluded.away_team,
      away_flag = excluded.away_flag,
      status_short = excluded.status_short,
      status_long = excluded.status_long,
      status_elapsed = excluded.status_elapsed,
      home_goals = excluded.home_goals,
      away_goals = excluded.away_goals,
      home_goals_et = excluded.home_goals_et,
      away_goals_et = excluded.away_goals_et,
      home_goals_pen = excluded.home_goals_pen,
      away_goals_pen = excluded.away_goals_pen,
      updated_at = excluded.updated_at`

  for (const group of chunk(rows, 50)) {
    const stmts = await db.batch(
      group.map((r) =>
        db
          .prepare(sql)
          .bind(
            r.fixture_id, r.league_id, r.season, r.round, r.group_label,
            r.match_date, r.match_time, r.match_timestamp,
            r.venue, r.city, r.home_team_id, r.home_team, r.home_flag,
            r.away_team_id, r.away_team, r.away_flag,
            r.status_short, r.status_long, r.status_elapsed,
            r.home_goals, r.away_goals, r.home_goals_et, r.away_goals_et,
            r.home_goals_pen, r.away_goals_pen, ts,
          ),
      ),
    )
    void stmts
  }
}

async function upsertStandings(db, rows) {
  const ts = TS()
  const sql = `INSERT INTO wc_standings
    (group_label, team_id, team_name, team_flag, rank, played, win, draw, lose,
     goals_for, goals_against, goal_diff, points, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(group_label, team_id) DO UPDATE SET
      team_name = excluded.team_name,
      team_flag = excluded.team_flag,
      rank = excluded.rank,
      played = excluded.played,
      win = excluded.win,
      draw = excluded.draw,
      lose = excluded.lose,
      goals_for = excluded.goals_for,
      goals_against = excluded.goals_against,
      goal_diff = excluded.goal_diff,
      points = excluded.points,
      updated_at = excluded.updated_at`

  for (const group of chunk(rows, 50)) {
    await db.batch(
      group.map((r) =>
        db
          .prepare(sql)
          .bind(
            r.group_label, r.team_id, r.team_name, r.team_flag, r.rank,
            r.played, r.win, r.draw, r.lose,
            r.goals_for, r.goals_against, r.goal_diff, r.points, ts,
          ),
      ),
    )
  }
}

async function upsertScorers(db, rows) {
  const ts = TS()
  const sql = `INSERT INTO wc_scorers
    (player_id, player_name, team_id, team_name, team_flag, goals, assists, played, penalties, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(player_id) DO UPDATE SET
      player_name = excluded.player_name,
      team_name = excluded.team_name,
      team_flag = excluded.team_flag,
      goals = excluded.goals,
      assists = excluded.assists,
      played = excluded.played,
      penalties = excluded.penalties,
      updated_at = excluded.updated_at`

  for (const group of chunk(rows, 50)) {
    await db.batch(
      group.map((r) =>
        db
          .prepare(sql)
          .bind(
            r.player_id, r.player_name, r.team_id, r.team_name, r.team_flag,
            r.goals ?? 0, r.assists ?? 0, r.played ?? 0, r.penalties ?? 0, ts,
          ),
      ),
    )
  }
}

async function upsertAssists(db, rows) {
  const ts = TS()
  const sql = `INSERT INTO wc_assists
    (player_id, player_name, team_id, team_name, team_flag, assists, played, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(player_id) DO UPDATE SET
      player_name = excluded.player_name,
      team_name = excluded.team_name,
      team_flag = excluded.team_flag,
      assists = excluded.assists,
      played = excluded.played,
      updated_at = excluded.updated_at`

  for (const group of chunk(rows, 50)) {
    await db.batch(
      group.map((r) =>
        db
          .prepare(sql)
          .bind(
            r.player_id, r.player_name, r.team_id, r.team_name, r.team_flag,
            r.assists ?? 0, r.played ?? 0, ts,
          ),
      ),
    )
  }
}

async function upsertCards(db, rows) {
  const ts = TS()
  const sql = `INSERT INTO wc_cards
    (player_id, player_name, team_id, team_name, team_flag, card_type, count, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(player_id, card_type) DO UPDATE SET
      player_name = excluded.player_name,
      team_name = excluded.team_name,
      team_flag = excluded.team_flag,
      count = excluded.count,
      updated_at = excluded.updated_at`

  for (const group of chunk(rows, 50)) {
    await db.batch(
      group.map((r) =>
        db
          .prepare(sql)
          .bind(
            r.player_id, r.player_name, r.team_id, r.team_name, r.team_flag,
            r.card_type, r.count, ts,
          ),
      ),
    )
  }
}

/* ━━━ error handler ━━━ */

export async function recordCollectError(db, errMsg) {
  const ts = TS()
  await writeMeta(db, 'last_collect_at', String(ts), ts)
  await writeMeta(db, 'last_collect_status', 'error', ts)
  await writeMeta(db, 'last_collect_error', String(errMsg).slice(0, 500), ts)
}
