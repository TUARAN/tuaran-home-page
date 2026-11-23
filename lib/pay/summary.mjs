/**
 * 支付订单汇总：只做 paid_orders 全表聚合，不依赖网关与账本模块。
 * 独立成文件是为了让后台指标卡逻辑可在 node:test 下直接测试，
 * 不必加载 orders.js -> points.js -> d1.js 这条 Edge 专用依赖链。
 */

export const EMPTY_ORDER_SUMMARY = Object.freeze({
  total: 0,
  paid: 0,
  pending: 0,
  abnormal: 0,
  revenueFen: 0,
})

/**
 * 后台指标卡汇总，查全表聚合，不受订单列表 limit 影响。
 * revenueFen 只累计已支付订单的金额；abnormal 计已关闭/失败状态。
 * @param {{ prepare: (sql: string) => { first: () => Promise<object|null> } }} db D1 数据库绑定
 */
export async function summarizePaidOrders(db) {
  if (!db) return { ...EMPTY_ORDER_SUMMARY }
  const row = await db
    .prepare(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
         SUM(CASE WHEN status IN ('closed', 'failed') THEN 1 ELSE 0 END) AS abnormal,
         COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_fen ELSE 0 END), 0) AS revenue_fen
       FROM paid_orders`
    )
    .first()
  if (!row) return { ...EMPTY_ORDER_SUMMARY }
  return {
    total: Number(row.total || 0),
    paid: Number(row.paid || 0),
    pending: Number(row.pending || 0),
    abnormal: Number(row.abnormal || 0),
    revenueFen: Number(row.revenue_fen || 0),
  }
}
