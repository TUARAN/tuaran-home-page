/**
 * 读取「开放现金购买」的资源 key 集合，供文章列表 / 详情页自动派生「付费解锁」角标。
 *
 * 不 import D1：由调用方传入 getD1 / D1 句柄，避免 Edge 打包链与纯 node 单测冲突。
 * 只读、fail-open：D1 未绑定或查询失败时返回空数组，绝不因为角标功能挡住内容或让整页报错。
 * 价格改在后台「内容定价」，改完下一次请求即可生效，无需重新部署、无需写文章 frontmatter。
 *
 * @param {Function|object} getDb getD1 函数，或直接是 D1 句柄（单测用）
 * @returns {Promise<string[]>}
 */
export async function readPaidResourceKeys(getDb) {
  try {
    const conn = typeof getDb === 'function' ? getDb() : getDb
    if (!conn) return []
    const result = await conn
      .prepare('SELECT resource_key FROM gated_resources WHERE price_fen > 0')
      .all()
    return (result?.results || [])
      .map((row) => String(row.resource_key || '').trim())
      .filter(Boolean)
  } catch {
    return []
  }
}
