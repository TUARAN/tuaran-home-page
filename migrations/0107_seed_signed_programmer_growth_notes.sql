-- 燃币礼物铺：作者亲笔签名《程序员成长手记》。
INSERT INTO reward_items
  (id, title, description, emoji, cost_points, item_type, stock, per_user_limit, active, sort_order, created_at, updated_at)
VALUES
  (
    'programmer-growth-notes-signed',
    '作者亲笔签名《程序员成长手记》',
    '使用 200 燃币兑换一本作者亲笔签名的《程序员成长手记》。兑换时请填写收件人、联系方式和寄送地址，每个账号限兑 1 本。',
    '📖',
    200,
    'physical',
    -1,
    1,
    1,
    200,
    1791062400000,
    1791062400000
  )
ON CONFLICT(id) DO NOTHING;
