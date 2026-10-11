const LOOPBACK_PERMISSION_NAMES = ['loopback-network', 'local-network-access']

export async function queryBloggerEyeLoopbackPermission(permissions) {
  if (!permissions?.query) return { state: 'unsupported', status: null }

  for (const name of LOOPBACK_PERMISSION_NAMES) {
    try {
      const status = await permissions.query({ name })
      return { state: status.state || 'unsupported', status, name }
    } catch {}
  }

  return { state: 'unsupported', status: null }
}

export function bloggerEyeConnectionFailure(permissionState) {
  if (permissionState === 'denied') {
    return {
      state: 'denied',
      message: '本机权限被拒绝',
      detail: 'Chrome 已阻止本站访问 127.0.0.1。请在地址栏左侧的站点设置中，将“本地网络访问”改为允许，然后重新检测。',
    }
  }
  return {
    state: 'offline',
    message: '服务未连接',
    detail: '无法连接小眼睛本机服务。请确认常驻服务正在运行，再点击“重新连接”。',
  }
}
