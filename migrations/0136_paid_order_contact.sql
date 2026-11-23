-- 圈子方案免登录支付：订单留存联系邮箱。
-- 加列对旧代码向后兼容（listPaidOrders 用 SELECT * 自动带出，其余查询不引用新列），
-- 上线前先执行本迁移，再部署使用 /api/pay/contact 的新版本。

ALTER TABLE paid_orders ADD COLUMN contact_email TEXT;
ALTER TABLE paid_orders ADD COLUMN contact_email_at INTEGER;
