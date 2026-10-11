function shortAnonymousMarker(visitorKey) {
  return String(visitorKey || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 6)
}

/**
 * 阅读分析里的匿名标识只用于区分访客，不尝试还原个人信息。
 * visitorKey 对匿名访问来说是服务端生成的 visitor_hash。
 */
export function readingVisitorName({ visitorType, visitorKey, userName }) {
  if (visitorType === 'anonymous') {
    const marker = shortAnonymousMarker(visitorKey)
    return marker ? `匿名访客 · ${marker}` : '匿名访客'
  }

  if (userName) return userName
  return visitorType === 'guest' ? '游客' : '已登录用户'
}
