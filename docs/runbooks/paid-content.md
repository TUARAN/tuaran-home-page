# 付费解锁内容上线手册

单篇内容「读到这里要付费」的最小实现。权益与燃币共用 `resource_unlocks`，现金通路只多了订单表和一个网关适配器。

## 一、能做什么

- 给任意 `resourceKey` 配现金价（分）：`gated_resources.price_fen`
- 已登录用户下单 → 网关二维码 → 支付成功 → 回调验签 → 写权益 → 页面自动解锁
- 圈子方案与付费文章统一：游客免登录下单 → 付款当场解锁 + 支付成功页留邮箱（见第七节）
- **现金与燃币互斥**：`price_fen > 0` 时只显示现金购买，不提供燃币旁路（否则注册赠送的燃币可绕过定价）；`price_fen = 0` 时只走燃币。已用燃币解锁过的历史权益仍放行。
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
- [ ] 付费文章未登录点购买不会跳登录，直接出二维码；付完当场可读
- [ ] 圈子方案无需登录即可下单；支付成功页可提交邮箱，后台订单能看到
- [ ] 二维码能在页面内展示（PC 端用 `url_qrcode`，不再跳外站）
- [ ] 支付成功后 3 秒内自动解锁，不用手动刷新
- [ ] 已购用户换设备/换浏览器仍可读
- [ ] 篡改 `total_fee` 的回调被拒绝（`AMOUNT_MISMATCH`）
- [ ] 重放同一回调不会重复写权益
- [ ] 网关未配置时页面提示「支付通道正在配置」，不报 500

## 六、已知限制（第一版）

付费墙仍然是**软墙**：正文已经在静态 HTML 里，视觉截断而非加密。付费用户正常，但技术用户可以翻 DOM 看到全文。

要真正防白看，第二步做「付费段构建期加密 + 解锁后下发」：复用 `RESEARCH_ENCRYPTION_PASSWORD` 与 `lib/longCompass/crypto.js` 的 AES-GCM 管道，密码只在 Worker 里，`GET /api/content/full` 校验权益后返回明文。这一步需要改内容构建管线，建议只对试点那 10 篇做。

## 七、现金内容统一免登录：当场解锁 + 联系邮箱

圈子方案和付费文章走同一套规则：**后台给这条内容配了现金价（`gated_resources.price_fen > 0`），未登录也能下单**。燃币墙（`price_fen = 0`）保持先登录，现金与燃币互斥不变。

- `/api/pay/create` 先读 `readPriceFen`，未登录且 `isGuestPayResource(resourceKey, priceFen)` 为真时，用 `getOrIssueGuest` 签发 `guest:<gid>` 签名 Cookie（与游客评论同一套身份），订单 `user_id` 记该 gid。后台新配价的内容自动适用，不必改代码加白名单。
- 游客付完**当场解锁**：`grantEntitlement` 同样对 `guest:*` 写 `resource_unlocks`（`source = paid`），`/api/points/unlock` 用同一 guest 身份查到 `unlocked: true`，内容墙立即放行。登录时 `mergeGuestFromRequest` 把这条权益迁到正式账号，跨设备继续有效。
- 副作用：`resource_unlocks` 插入会触发 `0088` 的访客目录触发器，该游客计入「已解锁」段位。这里的语义是「付过费或有解锁行为的游客」，统计文案按此理解，不再当污染处理。
- 支付成功页（`PayUnlockPanel`）停在「支付成功，内容已解锁」，可选填邮箱；`POST /api/pay/contact`（`{orderNo, email}`）只接受本人且 `status = paid` 的订单，邮箱落在 `paid_orders.contact_email`。不填也能点「直接阅读」，不挡阅读。
- 网关 `returnTo` 传当前页路径，游客付完回跳不再落到需要登录的 `/account`。
- 游客清 Cookie 即可换 gid，因此下单限流按 IP 收紧（15 分钟 12 次）。
- `0136_paid_order_contact.sql` 已于 2026-11-24 在线上执行；未执行时只有留邮箱接口返回 `CONTACT_UNAVAILABLE`，下单与回调不受影响。

## 八、坑

- **IP 白名单**：Cloudflare Workers 出口是轮换的海外 IP，虎皮椒要求填服务器 IP 时，直连会 403。解法是国内小 VPS 做一层固定 IP 中转，或换只校验域名的通道。
- **金额必须精确**：价格表匹配到账，10.0 和 10.00 视为不同；改价先在网关后台建好金额。
- **退款**：虎皮椒个人版没有退款接口，页面已写明「数字内容，解锁后不支持退款」。真需要退，走微信/支付宝手动转。
- **合规**：个人收款码做经营性收款不合规；有执照优先走官方商户号，本适配器只换 `lib/pay/gateways/` 一个文件。

## 八、进度快照（2026-11-23）

### 已完成

- 代码：`paid_orders` 订单链路、`/api/pay/create|notify|status`、`/api/admin/pay/orders`、`PayUnlockPanel` 扫码面板、`RanbiPaywall` 现金优先分支、`lib/ledger/points.js` 的 `priceFen` 透传。
- 迁移：`0135_paid_content.sql` 及历史遗留的 `0129_plugin_monitor.sql`、`0132_site_memory.sql` 已在线上应用；`paid_orders` 存在，`resource_unlocks` 有 `source`/`order_ref`，`gated_resources` 有 `price_fen`，28117 条燃币权益未受影响。
- 提交：`8f606ed feat(pay): 接入虎皮椒，支持单篇内容现金解锁`，已推送 `main`，`tuaran` 与 `tuaran-admin-git` 两个 Pages 项目均记录了该提交。
- 虎皮椒应用：AppID `201906190303`，店铺 `2aran`，域名 `https://2aran.com`，通道「官方微信支付-不支持微信内支付」。

### 待做

1. **虎皮椒签约（需本人）**：后台签约状态停在 `待提交`，需完成资料提交 + 微信扫码签约，AppSecret 才在「我的支付渠道」的 `AppID/AppSecret` 列出现。
2. **Cloudflare Secret**：拿到 AppSecret 后配 `XUNHUPAY_APPID`、`XUNHUPAY_SECRET`（走 Pages 环境变量/Secret，不落文件）。
3. **线上路由核验**：`https://2aran.com/api/pay/create` 目前返回 404，同站 `/api/points/unlock` 返回 400 业务错误。需确认 Pages 产物是否包含 `/api/pay/*`，必要时手动 `wrangler pages deploy`。
4. **试点定价**：现有 11 条 workbuddy 资源 `price_fen` 全为 0，先给 1 篇配 `1000`（推荐 `workbuddy:workbuddy-complete-guide` 或 `workbuddy-workplace-video-course`），确认现金入口出现。
5. **真实支付验证**：用 1 元以下金额走一遍扫码 → 回调 → 解锁，核对订单 `status=paid`、权益 `source='paid'`。
6. **IP 白名单方案**：若后台强制填服务器 IP，需国内小 VPS 固定 IP 中转，或换只校验域名的通道。
7. 可选：后台可视化订单列表与补单按钮（当前只有 API）；正文加密第二版（构建期加密 + `/api/content/full` 下发）。

### 已知问题

- 本地 `npm run pages:build:public` 失败在 `spawn pnpm ENOENT`：仓库有 `pnpm-lock.yaml`，Vercel CLI 会切到 pnpm，本机未装。排障前先装 pnpm，或用 `corepack enable`。
- 线上 404 与上面这条无必然关系，Cloudflare 构建环境自带 pnpm，需以 Pages 构建日志为准。
