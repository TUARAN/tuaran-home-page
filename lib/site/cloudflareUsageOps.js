import { getD1 } from '../db/d1'
import {
  collectCloudflareUsage,
  evaluateUsageAlerts,
  previousUtcDate,
  usageAlertPressureDays,
  utcDate,
  writeUsageDay,
} from './cloudflareUsage'
import { notifyCloudflareUsageAlerts } from './siteNotifications'

function optionalD1() {
  try {
    return getD1()
  } catch {
    return null
  }
}

export async function persistUsageReport(env, date, { alert = true, fetcher } = {}) {
  const report = await collectCloudflareUsage(env, date, fetcher)
  await writeUsageDay(env.CONTENT_FEED, report)
  let notification = { created: 0, alerts: [] }
  if (alert && date === utcDate()) {
    const db = optionalD1()
    if (db) notification = await notifyCloudflareUsageAlerts(db, report)
  }
  return {
    report,
    notification,
    pressure: evaluateUsageAlerts(report),
  }
}

export async function collectScheduledUsage(env, { fetcher } = {}) {
  const yesterday = previousUtcDate()
  const today = utcDate()
  const archived = await persistUsageReport(env, yesterday, { alert: false, fetcher })
  const live = await persistUsageReport(env, today, { alert: true, fetcher })
  return {
    reports: [
      {
        date: yesterday,
        workers: archived.report.workers.total,
        d1RowsRead: archived.report.d1.rowsRead,
        d1RowsWritten: archived.report.d1.rowsWritten,
        topPaths: archived.report.topPaths.slice(0, 5),
        alerts: archived.pressure,
      },
      {
        date: today,
        workers: live.report.workers.total,
        d1RowsRead: live.report.d1.rowsRead,
        d1RowsWritten: live.report.d1.rowsWritten,
        topPaths: live.report.topPaths.slice(0, 5),
        alerts: live.pressure,
        notified: live.notification.created,
      },
    ],
    notified: live.notification.created,
  }
}

export function usageDashboardMeta(history = []) {
  const today = utcDate()
  const current = history.find((row) => row.date === today) || history[0] || null
  const alerts = current ? evaluateUsageAlerts(current) : []
  const pressureDates = usageAlertPressureDays(history).slice(0, 7)
  return {
    alertPolicy: {
      warnRatio: 0.8,
      criticalRatio: 0.95,
      channel: '站长消息中心 · 自动化监控',
      cadence: '打开本页约每 15 分钟刷新今日；定时任务每 3 小时采集并检查预警',
    },
    currentAlerts: alerts,
    pressureDates,
  }
}
