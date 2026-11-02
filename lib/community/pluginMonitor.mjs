export const DISTRIBUTOR_ID = 'ai-distributor'
export const PLUGIN_COMMANDS = ['stop-batch', 'stop-all', 'disable-checkin', 'ext-update']
const id = value => typeof value === 'string' && /^[A-Za-z0-9_-]{8,80}$/.test(value) ? value : ''
const versionAtLeast = (current, expected) => {
  const a = current.split('.').map(Number), b = String(expected).split('.').map(Number)
  if (b.length !== 3 || b.some(n => !Number.isInteger(n))) return false
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i]
  return true
}
const version = value => /^\d+\.\d+\.\d+$/.test(String(value || '')) ? String(value) : ''
const platforms = ['twitter', 'juejin', 'xiaohongshu', 'zhihu', 'weibo', 'wechat', 'csdn', 'segmentfault', 'cnblogs', 'tencentcloud', 'aliyun', 'huaweicloud']
const statuses = ['pending', 'running', 'prepared', 'manual', 'failed', 'interrupted', 'stopped']
const phases = ['running', 'idle', 'stopping', 'generating', 'updating']
const time = (value, now) => Number.isSafeInteger(value) && value > 0 && value <= now + 60000 ? value : now
export function normalizePluginReport(raw, now = Date.now()) {
  if (raw?.pluginId !== DISTRIBUTOR_ID || !id(raw.deviceId) || !version(raw.version) || !raw.snapshot || typeof raw.snapshot !== 'object') throw new RangeError('INVALID_REPORT')
  const s = raw.snapshot
  const batches = (Array.isArray(s.batches) ? s.batches : []).slice(0, 10).filter(b => id(b?.id)).map(b => ({
    id: id(b.id), createdAt: time(b.createdAt, now), type: ['opinion', 'article', 'booklet', 'project'].includes(b.type) ? b.type : 'opinion',
    targets: (Array.isArray(b.targets) ? b.targets : []).slice(0, 12).filter(t => id(t?.id) && platforms.includes(t.platformId) && statuses.includes(t.status)).map(t => ({ id: id(t.id), platformId: t.platformId, status: t.status })),
  }))
  const snapshot = { phase: phases.includes(s.phase) ? s.phase : 'idle', batches,
    tools: { autoCheckin: s.tools?.autoCheckin === true, checkinDay: /^\d{4}-\d{2}-\d{2}$/.test(s.tools?.checkinDay || '') ? s.tools.checkinDay : '', managerRunning: s.tools?.managerRunning === true },
    localUpdate: { installed: raw.version, version: version(s.localUpdate?.version) || raw.version, phase: ['unknown', 'latest', 'updated', 'available', 'waiting', 'applying', 'failed'].includes(s.localUpdate?.phase) ? s.localUpdate.phase : 'unknown' },
  }
  const results = (Array.isArray(raw.results) ? raw.results : []).slice(0, 20).filter(r => id(r?.id) && ['success', 'failed'].includes(r.status)).map(r => ({ id: r.id, status: r.status, result: ['stopped', 'loaded', 'failed', 'interrupted', 'expired'].includes(r.result) ? r.result : 'failed' }))
  const events = (Array.isArray(raw.events) ? raw.events : []).slice(0, 160).filter(e => id(e?.id) && ['distribution', 'checkin', 'manager'].includes(e.kind) && ['prepared', 'manual', 'failed', 'stopped', 'success'].includes(e.outcome) && (!e.platformId || platforms.includes(e.platformId))).map(e => ({ id: e.id, kind: e.kind, outcome: e.outcome, platformId: e.platformId || '', at: time(e.at, now), publicCount: e.kind === 'manager' && Number.isSafeInteger(e.publicCount) ? Math.max(0, Math.min(100000, e.publicCount)) : 0, privateCount: e.kind === 'manager' && Number.isSafeInteger(e.privateCount) ? Math.max(0, Math.min(100000, e.privateCount)) : 0 }))
  return { pluginId: DISTRIBUTOR_ID, deviceId: raw.deviceId, version: raw.version, snapshot, results, events }
}
export async function expirePluginCommands(db, now = Date.now()) {
  await db.prepare("UPDATE plugin_commands SET status = 'expired', finished_at = ? WHERE status IN ('pending','claimed') AND expires_at <= ?").bind(now, now).run()
}
export async function recordPluginReport(db, raw, now = Date.now()) {
  const report = normalizePluginReport(raw, now)
  const { pluginId, deviceId } = report
  await db.prepare(`INSERT INTO plugin_instances(plugin_id,device_id,version,snapshot_json,last_seen_at) VALUES(?,?,?,?,?)
    ON CONFLICT(plugin_id,device_id) DO UPDATE SET version=excluded.version,snapshot_json=excluded.snapshot_json,last_seen_at=excluded.last_seen_at`).bind(pluginId, deviceId, report.version, JSON.stringify(report.snapshot), now).run()
  await expirePluginCommands(db, now)
  const acknowledged = []
  for (const r of report.results) {
    const command = await db.prepare('SELECT command,argument FROM plugin_commands WHERE id=? AND plugin_id=? AND device_id=?').bind(r.id, pluginId, deviceId).first()
    if (command?.command === 'ext-update' && r.status === 'success' && !versionAtLeast(report.version, command.argument)) continue
    await db.prepare("UPDATE plugin_commands SET status=?,result=?,finished_at=? WHERE id=? AND plugin_id=? AND device_id=? AND status='claimed' AND expires_at>?").bind(r.status, r.result, now, r.id, pluginId, deviceId, now).run()
    // Ack only this device's known terminal command; never clear an unrelated outbox item.
    const row = await db.prepare('SELECT status FROM plugin_commands WHERE id=? AND plugin_id=? AND device_id=?').bind(r.id, pluginId, deviceId).first()
    if (row && ['success', 'failed', 'expired'].includes(row.status)) acknowledged.push(r.id)
  }
  for (const e of report.events) await db.prepare('INSERT OR IGNORE INTO plugin_events(id,plugin_id,device_id,kind,platform_id,outcome,public_count,private_count,occurred_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(e.id, pluginId, deviceId, e.kind, e.platformId, e.outcome, e.publicCount, e.privateCount, e.at).run()
  const pending = await db.prepare("SELECT id,command,argument,created_at,expires_at FROM plugin_commands WHERE plugin_id=? AND device_id=? AND status='pending' AND expires_at>? ORDER BY created_at LIMIT 8").bind(pluginId, deviceId, now).all()
  const commands = []
  for (const row of pending.results || []) {
    const result = await db.prepare("UPDATE plugin_commands SET status='claimed',claimed_at=? WHERE id=? AND plugin_id=? AND device_id=? AND status='pending' AND expires_at>?").bind(now, row.id, pluginId, deviceId, now).run()
    if (result.meta?.changes) commands.push({ id: row.id, command: row.command, argument: row.argument, createdAt: row.created_at, expiresAt: row.expires_at })
  }
  return { ok: true, acknowledged, commands }
}
export async function enqueuePluginCommand(db, { pluginId, deviceId, command, argument = '' }, now = Date.now()) {
  if (pluginId !== DISTRIBUTOR_ID || !id(deviceId) || !PLUGIN_COMMANDS.includes(command)) throw new RangeError('INVALID_COMMAND')
  const instance = await db.prepare('SELECT snapshot_json,last_seen_at FROM plugin_instances WHERE plugin_id=? AND device_id=?').bind(pluginId, deviceId).first()
  if (!instance || instance.last_seen_at < now - 300000) throw new RangeError('DEVICE_OFFLINE')
  const snapshot = JSON.parse(instance.snapshot_json)
  if (command === 'stop-batch') {
    if (!id(argument) || !snapshot.batches?.some(b => b.id === argument && b.targets.some(t => ['pending', 'running'].includes(t.status)))) throw new RangeError('INVALID_BATCH')
  } else if (command === 'ext-update') {
    argument = snapshot.localUpdate?.version
    if (!version(argument) || argument === snapshot.localUpdate?.installed || !['available', 'waiting'].includes(snapshot.localUpdate?.phase)) throw new RangeError('NO_LOCAL_UPDATE')
  } else argument = ''
  await expirePluginCommands(db, now)
  const active = await db.prepare("SELECT id FROM plugin_commands WHERE plugin_id=? AND device_id=? AND command=? AND argument=? AND status IN ('pending','claimed') LIMIT 1").bind(pluginId, deviceId, command, argument).first()
  if (active) return { ok: true, id: active.id }
  const commandId = crypto.randomUUID()
  await db.prepare("INSERT OR IGNORE INTO plugin_commands(id,plugin_id,device_id,command,argument,created_at,expires_at) VALUES(?,?,?,?,?,?,?)").bind(commandId, pluginId, deviceId, command, argument, now, now + 120000).run()
  const queued = await db.prepare("SELECT id FROM plugin_commands WHERE plugin_id=? AND device_id=? AND command=? AND argument=? AND status IN ('pending','claimed') LIMIT 1").bind(pluginId, deviceId, command, argument).first()
  return { ok: true, id: queued?.id || commandId }
}
export async function readPluginMonitor(db, { platform = '', date, now = Date.now() } = {}) {
  const selectedDate = date || new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' }).format(now)
  const start = Date.parse(`${selectedDate}T00:00:00+08:00`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate) || !Number.isFinite(start) || new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' }).format(start) !== selectedDate || start > now || start < now - 366 * 86400000 || (platform && !platforms.includes(platform))) throw new RangeError('INVALID_FILTER')
  await expirePluginCommands(db, now)
  const devices = await db.prepare('SELECT * FROM plugin_instances WHERE plugin_id=? ORDER BY last_seen_at DESC LIMIT 100').bind(DISTRIBUTOR_ID).all()
  const commands = await db.prepare('SELECT * FROM plugin_commands WHERE plugin_id=? AND created_at>? ORDER BY created_at DESC LIMIT 200').bind(DISTRIBUTOR_ID, now - 86400000).all()
  const events = await db.prepare('SELECT * FROM plugin_events WHERE plugin_id=? AND occurred_at>=? AND occurred_at<? ORDER BY occurred_at DESC LIMIT 200').bind(DISTRIBUTOR_ID, start, start + 86400000).all()
  const counts = await db.prepare('SELECT device_id,kind,platform_id,outcome,COUNT(*) AS count,SUM(public_count) AS public_count,SUM(private_count) AS private_count FROM plugin_events WHERE plugin_id=? AND occurred_at>=? AND occurred_at<? GROUP BY device_id,kind,platform_id,outcome').bind(DISTRIBUTOR_ID, start, start + 86400000).all()
  return { ok: true, now, selectedDate, devices: (devices.results || []).map(d => ({ deviceId: d.device_id, version: d.version, lastSeenAt: d.last_seen_at, online: d.last_seen_at >= now - 300000, snapshot: JSON.parse(d.snapshot_json), commands: (commands.results || []).filter(c => c.device_id === d.device_id) })), events: (events.results || []).filter(e => !platform || e.platform_id === platform), counts: (counts.results || []).filter(e => !platform || e.platform_id === platform) }
}
