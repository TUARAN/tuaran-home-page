import { getUserFromRequest } from '../../../auth/edgeSession'
import { isOwnerUser } from '../../../auth/ownerAuth'
import { readExtensionMonitor, readRecentXCommands } from '../../../community/communityActions'
import { getD1 } from '../../../db/d1'
import { publicMonitorPayload } from '../monitorPublic'
import { handleWorkbench, workbenchPreflight } from '../workbenchHttp'

const services = { getD1, getUserFromRequest }

// 公开只读：访客看状态与日历；站长登录时附带 device_id、排班规则、指令回执与动作明细。
export function GET(request) {
  return handleWorkbench(request, services, async (db, userId, req) => {
    const url = new URL(req.url)
    const user = userId ? await getUserFromRequest(req) : null
    const owner = isOwnerUser(user)
    try {
      const data = await readExtensionMonitor(db, {
        platform: 'x',
        date: url.searchParams.get('date') || undefined,
        accountHandle: url.searchParams.get('account') || '',
      })
      if (owner) {
        const commands = await readRecentXCommands(db, data.devices.map((device) => device.id))
        const byDevice = new Map()
        for (const item of commands) {
          if (!byDevice.has(item.deviceId)) byDevice.set(item.deviceId, [])
          byDevice.get(item.deviceId).push(item)
        }
        data.devices = data.devices.map((device) => ({ ...device, commands: (byDevice.get(device.id) || []).slice(0, 8) }))
      }
      return { ok: true, ...publicMonitorPayload(data, { owner }) }
    } catch (error) {
      if (error instanceof RangeError && error.message === 'INVALID_DATE') {
        return { ok: false, status: 400, error: 'INVALID_DATE' }
      }
      if (/no such table/i.test(String(error?.message || error))) {
        return { ok: false, status: 503, error: 'MIGRATION_REQUIRED' }
      }
      console.error('Public plugin monitor read failed:', error)
      return { ok: false, status: 500, error: 'MONITOR_READ_FAILED' }
    }
  }, { allowAnonymousGet: true })
}

export function OPTIONS(request) {
  return workbenchPreflight(request, ['GET'])
}
