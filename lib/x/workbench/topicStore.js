export function cleanTopic(value) {
  return String(value || '').normalize('NFKC').replace(/\s+/g, ' ').trim().slice(0, 30)
}
export async function suggestTopic(db, userId, data, now = Date.now()) {
  const topic = cleanTopic(data?.topic)
  const tweetId = String(data?.tweetId || '')
  if (!topic || !/^\d{5,25}$/.test(tweetId)) return { ok: false, status: 400, error: 'INVALID_TOPIC' }
  if (!await db.prepare('SELECT id FROM x_radar_items WHERE id = ?1').bind(tweetId).first()) return { ok: false, status: 404, error: 'TWEET_NOT_FOUND' }
  const count = await db.prepare("SELECT COUNT(*) AS n FROM x_radar_topic_suggestions WHERE user_id = ?1 AND status = 'pending'").bind(userId).first()
  if (count.n >= 50) return { ok: false, status: 429, error: 'TOPIC_QUEUE_FULL' }
  await db.prepare("INSERT INTO x_radar_topic_suggestions (id, user_id, tweet_id, topic, created_at) VALUES (?1, ?2, ?3, ?4, ?5) ON CONFLICT(user_id, tweet_id, topic) DO NOTHING").bind(crypto.randomUUID(), userId, tweetId, topic, now).run()
  return { ok: true }
}
export async function listTopics(db) {
  const { results } = await db.prepare("SELECT DISTINCT topic FROM x_radar_topic_suggestions WHERE status = 'approved' ORDER BY topic LIMIT 100").all()
  return { ok: true, topics: results.map(r => r.topic) }
}
export async function pendingTopics(db) {
  const { results } = await db.prepare("SELECT id, tweet_id, topic, created_at FROM x_radar_topic_suggestions WHERE status = 'pending' ORDER BY created_at LIMIT 100").all()
  return { ok: true, suggestions: results }
}
export async function reviewTopic(db, data, now = Date.now()) {
  if (!['approved', 'rejected'].includes(data?.decision)) return { ok: false, status: 400, error: 'INVALID_DECISION' }
  const res = await db.prepare("UPDATE x_radar_topic_suggestions SET status = ?2, reviewed_at = ?3 WHERE id = ?1 AND status = 'pending'").bind(String(data.id || ''), data.decision, now).run()
  return res.meta?.changes ? { ok: true } : { ok: false, status: 404, error: 'SUGGESTION_NOT_PENDING' }
}
