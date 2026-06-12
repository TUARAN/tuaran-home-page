/**
 * 用户角色常量（无服务端依赖，客户端组件可安全引入）。
 * 服务端读写逻辑在 lib/userDirectory.js；角色语义见迁移 0021。
 */

export const VALID_USER_ROLES = ['member', 'trusted', 'blocked']

export const USER_ROLE_LABELS = {
  member: '普通用户',
  trusted: '信任用户',
  blocked: '已封禁',
}

export function isValidUserRole(value) {
  return typeof value === 'string' && VALID_USER_ROLES.includes(value)
}
