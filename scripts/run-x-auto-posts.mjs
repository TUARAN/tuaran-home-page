import { pathToFileURL } from 'node:url'
import { writeFile } from 'node:fs/promises'
import { X_POST_SLOTS, xPostingSchedule, isXPostDue } from '../lib/xPostingSchedule.js'

export async function runXAutoPosts({ now = new Date(), period = '', secret, fetchImpl = fetch } = {}) {
  if (!secret) throw new Error('MORNING_GREETING_SECRET is required')
  const schedule = await xPostingSchedule(now)
  if (period && !X_POST_SLOTS.some((slot) => slot.id === period)) throw new Error('INVALID_SLOT')
  const tasks = schedule.filter((task) => period ? task.id === period : isXPostDue(task, now))
  return Promise.all(tasks.map(async (task) => {
    const query = new URLSearchParams({ [task.query]: task.id })
    if (!period) query.set('scheduledDate', task.date)
    try {
      const response = await fetchImpl(`https://2aran.com/api/distribution/x/greeting?${query}`, {
        method: 'POST',
        headers: { 'x-morning-greeting-secret': secret },
        signal: AbortSignal.timeout(540_000),
      })
      const payload = await response.json().catch(() => ({}))
      const ok = response.status === 423
        || (response.ok && payload.ok === true)
        || (response.status === 409 && payload.error === 'X_TASK_IN_PROGRESS')
      return { slot: task.id, ok, status: response.status, error: payload.error || '', reason: payload.reason || '' }
    } catch (error) {
      return { slot: task.id, ok: false, error: error.name || 'FETCH_FAILED' }
    }
  }))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const results = await runXAutoPosts({
      period: process.env.MANUAL_PERIOD || '',
      secret: process.env.MORNING_GREETING_SECRET,
    })
    const summary = JSON.stringify(results)
    await writeFile('/tmp/morning-greeting.json', summary)
    console.log(summary)
    if (results.some((result) => !result.ok)) process.exitCode = 1
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
