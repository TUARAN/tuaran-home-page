-- 亲笔签名版实体书订单（Issue #613）。
-- 支付主链路完全复用 paid_orders（下单、回调、验签、幂等不变）；
-- 本表只补实体书专属的部分：哪本书、收货信息、发货状态。
-- 签名版不写 resource_unlocks（无数字权益），applyNotify / settleFromGateway
-- 对 signature: 前缀资源键走本表状态流转，见 lib/pay/orders.js 与 lib/pay/settle.mjs。
--
-- status 流转：pending（已下单未支付）→ awaiting_address（已支付待填收货信息）
--   → to_ship（已填地址待发货）→ shipped（已发货）；closed 为人工关闭。

CREATE TABLE IF NOT EXISTS book_orders (
  out_trade_no TEXT PRIMARY KEY,
  book_slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  recipient_name TEXT NOT NULL DEFAULT '',
  recipient_phone TEXT NOT NULL DEFAULT '',
  recipient_address TEXT NOT NULL DEFAULT '',
  tracking_no TEXT NOT NULL DEFAULT '',
  shipped_at INTEGER,
  note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_book_orders_status
  ON book_orders (status, updated_at DESC);

-- 签名版定价：每本书记录划线原价（分）与上架开关。
-- 早鸟价 = round(原价 * 0.88)，由后台保存时同步写入 gated_resources.price_fen
-- 作为实际收款金额（金额校验、幂等沿用支付主链路）。

CREATE TABLE IF NOT EXISTS book_signature_editions (
  book_slug TEXT PRIMARY KEY,
  base_price_fen INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER
);
