# 付费解锁内容上线手册

单篇内容「读到这里要付费」的最小实现。权益与燃币共用 `resource_unlocks`，现金通路只多了订单表和一个网关适配器。

## 一、能做什么

- 给任意 `resourceKey` 配现金价（分）：`gated_resources.price_fen`
- 已登录用户下单 → 网关二维码 → 支付成功 → 回调验签 → 写权益 → 页面自动解锁
- `price_fen > 0` 的内容不再自动扣燃币，燃币变成墙上的次选按钮
- 后台可按订单号补单，覆盖回调丢失、到账延迟

## 二、上线步骤

1. 执行迁移：`npx wrangler d1 migrations apply DB --remote`（本地预览用 `--local`）
2. 配 Secret（Cloudflare Pages → Settings → Environment variables，Production 与 Preview 都要）：
   - `XUNHUPAY_APPID`
   - `XUNHUPAY_SECRET`
3. 虎皮椒后台建应用，填站点域名与服务器 IP；**建好与站内定价一致的「价格表」金额**（10 元就建 10.00）
4. 配价：见下一节
5. 用 1 元或 0.01 元档先自测一单，确认「支付 → 回调 → 解锁 → 重复访问不重复收钱」

## 三、配价与查看订单

后台接口（需要站长身份）：

```bash
# 设置某篇 10 元
curl -X POST https://2aran.com/api/admin/pay/orders \
  -H 'Content-Type: application/json' -b '<站长 cookie>' \
  -d '{"action":"price","resourceKey":"research:companies:xxx","priceFen":1000}'

# 关掉现金购买，只留燃币
# priceFen 传 0

# 看最近订单
curl 'https://2aran.com/api/admin/pay/orders?status=pending' -b '<站长 cookie>'
```

也可以直接改库：

```bash
npx wrangler d1 execute DB --remote \
  --command "UPDATE gated_resources SET price_fen=1000 WHERE resource_key='research:companies:xxx'"
```

注意：`gated_resources` 里没有这条记录时，先插入一条（`cost_points` 是燃币价，`price_fen` 是现金价，0 表示不开放现金）。

## 四、补单

回调丢了、用户说已付但没解锁时：

```bash
curl -X POST https://2aran.com/api/admin/pay/orders \
  -H 'Content-Type: application/json' -b '<站长 cookie>' \
  -d '{"action":"grant","outTradeNo":"T20261123..."}'
```

补单会写 `source='admin'` 的权益并标记订单 paid，账号立刻可读。

## 五、验收清单

- [ ] `GET /api/points/unlock?resourceKey=...` 返回 `priceFen` 与 `unlocked`
- [ ] 未登录点购买会跳登录，登录后回到原页
- [ ] 二维码能在页面内展示（PC 端用 `url_qrcode`，不再跳外站）
- [ ] 支付成功后 3 秒内自动解锁，不用手动刷新
- [ ] 已购用户换设备/换浏览器仍可读
- [ ] 篡改 `total_fee` 的回调被拒绝（`AMOUNT_MISMATCH`）
- [ ] 重放同一回调不会重复写权益
- [ ] 网关未配置时页面提示「支付通道正在配置」，不报 500

## 六、已知限制（第一版）

付费墙仍然是**软墙**：正文已经在静态 HTML 里，视觉截断而非加密。付费用户正常，但技术用户可以翻 DOM 看到全文。

要真正防白看，第二步做「付费段构建期加密 + 解锁后下发」：复用 `RESEARCH_ENCRYPTION_PASSWORD` 与 `lib/longCompass/crypto.js` 的 AES-GCM 管道，密码只在 Worker 里，`GET /api/content/full` 校验权益后返回明文。这一步需要改内容构建管线，建议只对试点那 10 篇做。

## 七、坑

- **IP 白名单**：Cloudflare Workers 出口是轮换的海外 IP，虎皮椒要求填服务器 IP 时，直连会 403。解法是国内小 VPS 做一层固定 IP 中转，或换只校验域名的通道。
- **金额必须精确**：价格表匹配到账，10.0 和 10.00 视为不同；改价先在网关后台建好金额。
- **退款**：虎皮椒个人版没有退款接口，页面已写明「数字内容，解锁后不支持退款」。真需要退，走微信/支付宝手动转。
- **合规**：个人收款码做经营性收款不合规；有执照优先走官方商户号，本适配器只换 `lib/pay/gateways/` 一个文件。
