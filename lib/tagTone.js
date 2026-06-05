/**
 * 站点导航 / 站点地图统一的 tag 着色规则。
 * SiteHeader 和 /map 共用这一份，避免双源漂移。
 *
 * 已有 tone：
 *  - hot       火热项目（深玫瑰，仍克制）
 *  - lock      限制访问（冷灰蓝）
 *  - private   同 lock
 *  - login     可选登录后操作（浅冷灰）
 *  - e2e       端到端加密（冷绿）
 *  - 默认       温暖琥珀（new / 普通强调）
 */
export function getTagToneClass(tag) {
  const normalized = String(tag || '').toLowerCase()
  if (normalized === 'hot') {
    return 'bg-[#f4d4cf] text-[#8b3a36] dark:bg-[#3a1d1c] dark:text-[#ed9d97]'
  }
  if (normalized === 'lock' || normalized === 'private') {
    return 'bg-[#d8dee8] text-[#3f4b5d] dark:bg-[#18202b] dark:text-[#b3c0d1]'
  }
  if (normalized === 'login' || normalized === '登录') {
    return 'bg-[#e9ecf2] text-[#5d6878] dark:bg-[#1f262f] dark:text-[#9aa6b6]'
  }
  if (normalized === 'e2e' || normalized === '端到端加密') {
    return 'bg-[#dcefe7] text-[#17614b] dark:bg-[#122920] dark:text-[#8bd8b9]'
  }
  return 'bg-[#fde6c6] text-[#8b5a1f] dark:bg-[#3a2c14] dark:text-[#f0c776]'
}
