# 前端周看 / AI 分发大师子站接入

## Latest deployment status

### Directory information update

Final integrated deployment: `https://cdb9fb2e.tuaran.pages.dev`, based on `4ea3138f24242a02a05f0711ba9e2af32ce90f1c`. It preserves the later Long Compass and X image changes. All 60 selected tests passed; live HTML checks for `/`, `/sites`, and `/about` passed. Earlier deployments below are historical.

The homepage, `/sites`, and `/about` now share the two product descriptions from `lib/secondarySites.js`. Weekly retains its original working URL and an explicit pending-domain label. SyncBlog includes the shared-account scope and preservation of existing AI quotas.

The admin registry was initialized only because no saved registry existed. Its Weekly and SyncBlog descriptions and statuses were read back from D1. No account, balance, permission, or existing registry edit was overwritten.

The updated isolated release uses commit `13b86417c9592f82247e6875e515bdf923ed17cd`. All 27 relevant tests and the full public Pages build passed. Generated HTML for all three public pages was checked. DNS creation still requires a connection with DNS edit permission; Chrome navigation also timed out.

- Main production deployment: `5783a38d-a5b1-4f09-99eb-c862cd4001a8`, based on `e8536c2933877955696008de0b92794a41ca1f6a`. Confirmed through Cloudflare API.
- Previous production deployment: `3e1838d9-b286-4fb9-a5c6-bab855177af0`.
- Main account APIs and SyncBlog are deployed. Eleven core HTTP checks passed, including shared guest balance, trusted CORS, preflight, and rejection of unauthenticated checkin and untrusted origins.
- Weekly Pages domain registration succeeded. Domain ID: `22b60205-394c-473f-8f10-c0be5d52c334`. Status: pending, CNAME record not set.
- Both Wrangler OAuth and the Cloudflare connector lack DNS write access. Required record in the 2aran.com zone: CNAME `weekly` to `fwdc.pages.dev`, proxied, automatic TTL.
- Weekly client deployment and public link changes remain on hold until DNS and HTTPS work.
- Real authenticated browser tests remain incomplete. Browser control timed out. The legacy SyncBlog domain check failed during Python TLS negotiation; this is not recorded as a passing check.
- No new charges, automatic account linking, git commit, or git push.

This section supersedes the historical progress notes below.

核查日期：2026-08-28。用户已确认子域名称、保留旧权益，并先接入统一登录、余额和签到；新增扣费另行定价。AI 分发大师子域与增加型关联表已发布；主站接口三次发布均因网络失败，尚未发布成功；前端周看构建通过，已获域名绑定授权，但 Cloudflare 连接超时。具体发布版本与验收记录见 `subsite-release-2026-08-28.json`。

## 目标与部署边界

| 产品 | 当前代码与线上项目（已通过 Cloudflare API 核实） | 拟用子域 | 处理方式 |
| --- | --- | --- | --- |
| 前端周看 | `TUARAN/frontend-weekly-digest-cn`，`web/`，Pages `fwdc` | `weekly.2aran.com` | 保留独立静态站，添加自定义域和统一账号组件 |
| AI 分发大师 | `TUARAN/md`，`apps/web/`，Worker `md` | `syncblog.2aran.com` | 保留 Vue 应用、Worker 和业务 D1，接入主站身份与燃币 |
| 同步助手 | `TUARAN/cose`，`apps/extension/` | 无 | 已有子域权限，验证新域名的实际桥接兼容性 |
| 主站 | `TUARAN/tuaran-home-page`，Pages `tuaran` | `2aran.com` | 账号、登录、燃币账本唯一正本 |

子域名称已获站长确认。`syncblog.2aran.com` 已绑定并返回 HTTPS 200；`weekly.2aran.com` 尚未绑定。
`frontendnext.com`、`frontendweekly.cn`、`qdzk.site` 与 `syncblog.cn` 先保留，不在初次切换时删除。
主站已有 `/frontend-weekly` 页面和 R2 数据读取入口，不复制采集流水线。

## 已核实的关键事实

- 主站 `edgeSession.js` 已将签名会话和游客 Cookie 作用域设置为 `.2aran.com`；不需要把签名密钥复制给子站。
- 主站登录回跳原来仅允许主站和后台，需要精确加入两个子域，不能放行任意子域。
- WorkBuddy 已采用“子站服务端向主站验证会话”的模式，可参考其 Cookie 筛选、超时和禁止重定向策略。
- 周看使用 Next.js 静态导出；`web/functions` 已有内容 API 代理，没有现成的用户账号体系。
- 周看的 `web/lib/site-matrix.ts` 将品牌域和周刊域分别写死；只改 DNS 会导致阅读链接继续跳回旧域名。
- SyncBlog 使用独立邮箱账号、签名 Cookie、D1 `users`、AI 使用量、到期权益和 `subscriptions`，主键不能直接替换为主站账号 ID。
- SyncBlog 的文章草稿等浏览器数据还需逐项盘点。不同源的 localStorage / IndexedDB 不会随 DNS 或重定向迁移；必须提供原站导出和新站导入，并保留原站入口。
- COSE manifest 已允许 `*.2aran.com`；`content.js` 的 `TRUSTED_BRIDGE_HOSTS` 检查也接受 `2aran.com` 的子域，因此新域名不需要扩大扩展权限，仍需实际验证桥接和分发。

## 上线前必须解决的安全边界

1. SyncBlog `worker/index.ts` 的 `proxyWeixin` 复制原请求全部 headers 后发到 `api.weixin.qq.com`。绑定共享 Cookie 子域前，必须改为明确的请求头白名单，禁止转发主站 Cookie、内部身份头和无关 Authorization。还需检查图床等其他代理。
2. 子站代码属于 `.2aran.com` 会话信任边界，第三方脚本、XSS、代理接口必须一起审计。HttpOnly 不能阻止服务端误转发 Cookie。
3. 不按相同邮箱、昵称自动合并 SyncBlog 与主站账号。关联必须同时证明两边账号的控制权；不从浏览器传入的 `userId` 确认身份。
4. 子站会话接口故障返回 503，禁止转成“登录成功但余额为 0”，也不能绕过扣费或当作游客重新赠送额度。
5. 燃币接口精确校验 Origin；跨站浏览器写操作要求显式可信 Origin。所有账号和余额响应为 `private, no-store`，不得进入 CDN 公共缓存。
6. 主站 `spendPoints` 目前为分步查余额、写流水、更新余额。接入高并发按次 AI 消费前必须实现原子结算、幂等和退款；不能直接扩大当前接口用途。
7. 站点规则规定主站不调用大模型。AI 调用仍留在 SyncBlog Worker，主站仅处理身份和账本。

## 首批已实现：主站账号桥接

### `GET /api/subsites/session`

接受主站以及两个精确子域的带凭证 CORS 请求；也支持服务端直接验证收到的 Cookie。
身份由现有 `getUserFromRequest` 校验并归一为平台账号，封禁查询失败时拒绝继续。
游客使用现有签名游客身份与幂等奖励，不创建第二份钱包。

```json
{
  "version": 1,
  "user": { "id": "acct_...", "name": "读者" },
  "isGuest": false,
  "balance": 123,
  "checkedInToday": false
}
```

游客 `user` 为 `null`，不向浏览器暴露游客 ID。返回值不包含邮箱、签名、后台权限、历史解锁清单。
客户端请求需使用 `credentials: 'include'`。不同根域名不能依靠这个接口共享登录；原域只作为兼容或迁移入口。

### `POST /api/subsites/checkin`

在校验精确 Origin 后调用现有 `/api/points/checkin` 处理器，沿用签到奖励、每日幂等、限流、封禁与待激活邮箱规则。
保留原处理器的 HTTP 状态与 `Retry-After`。不接受调用方指定奖励数量。

### 登录与退出

统一跳转主站 `/login?returnTo=<子站完整地址>` 和 `/api/auth/logout?returnTo=<子站完整地址>`。
`normalizeReturnTo` 已支持两个精确子域，并拒绝带 username/password 的 URL。
子站不签发主站登录 Cookie，也不接触主站 OAuth secret。

接口已完成隔离的完整 Pages 构建和 14 项测试。单元测试不等于真实登录验收；生产验证情况单独记录，未执行的验收项不视为通过。

## 实施分项与剩余验收

### 1. 前端周看

- 增加统一账号 / 燃币 / 签到组件，处理加载、游客、登录、故障状态；不把现有免费内容直接收费。
- 调整 site-matrix、周刊导航、分享、canonical 和 sitemap；旧域迁移采取按路径验证后的重定向。
- 在 Pages `fwdc` 添加子域关联，随后配置 CNAME。不能只建 CNAME 而不注册 Pages 自定义域。
- 预览测试通过后部署；DNS、TLS 和站内阅读路径均通过后，再更新主站的产品链接及子站目录。

### 2. AI 分发大师统一身份

- 先修复所有代理头转发边界；只允许主站固定地址上的会话验证，禁用跳转跟随，设置超时。
- 增加独立账号关联表，主站平台 ID 与 SyncBlog 原 `users.id` 一一映射，不更换业务表外键。
- 设计旧用户双重验证绑定、新用户建档和冲突拒绝流程；关联端点必须防 CSRF、重放与抢绑。
- 同步主站封禁和退出状态；不把接口故障降级为独立登录或免费 AI 通道。
- 新域用主站登录；旧域保留原登录用于证明旧账号所有权和导出本地草稿。
- 显示主站燃币余额，并区分历史 AI 额度，避免把二者误标为同一种资产。
- 修改两份 wrangler 配置（根目录和 `apps/web/`），保留原域，并加入新域。
- 验证 COSE 扩展在新域名的实际分发桥接，不重复扩大现有域名权限。

### 3. 燃币消费（业务规则确认后）

- 主站作为唯一价格和账本来源；子站不直接写 `user_points`，不接受浏览器指定扣币金额。
- 明确计费动作、价格、游客规则、免费额度优先级和旧付费权益优先级。
- 区分一次解锁与按次使用：前者复用既有 resourceKey 约定，后者用服务端请求 ID。
- 原子余额约束和幂等请求记录在同一事务中；并发请求不能超扣，同一请求重试不能重复扣。
- AI 上游失败、超时和流式中断的结算规则必须明确，并实现可核对的一次性退款。
- 对异常请求保留不含 Cookie / token 的审计记录。上线前并发和重复请求测试必过。

## 已确认与当前阻塞

- 已确认使用 `weekly.2aran.com` / `syncblog.2aran.com`；旧账号、付费权益和 AI 额度不自动兑换或清零。
- 新燃币消费范围和价格尚未确认；当前版本不新增扣币。
- 用户已明确授权读取本机 Wrangler OAuth 凭据，仅向 Cloudflare 官方 API 绑定 `weekly.2aran.com` 到 Pages `fwdc` 并添加对应 CNAME；不得输出或保存凭据，也不得将此授权扩大到其他凭据用途。获批脚本已执行，但首次 GET 连接超时，尚未进行域名或 DNS 写入。连接器和无凭据 curl 同样连接失败。

## 发布与回滚

- SyncBlog 新版本已部署到新旧两个域名，D1 仅增加关联表；未自动关联任何旧账号，未修改既有额度或权益。尚未提交或推送 Git。
- 两个产品仓库的任务文件已通过获批的限定范围写入更新；COSE 无需扩大域名权限，尚未完成扩展实际分发验收。
- 主站工作区已有其他任务的首页、样式和 WorkBuddy 改动，不能直接把整个工作区构建发布。
- 发布前保存各项目当前部署版本和业务 D1 备份，只执行增加型账号关联迁移。
- 实际发布先完成 SyncBlog Worker/子域，再发布主站接口与 SyncBlog 入口。前端周看代码只完成本地构建，主站保留原链接，避免导向未绑定的域名。
- 回滚切回上一部署和原域入口，保留映射表及账本审计记录，不回滚或重复发放已发生的权益。

## 验收矩阵

- 主站登录后两个子站均识别同一账号；子站发起登录回到原路径；退出后全部失效。
- 三站余额相同；一处签到后另两处立即刷新，重复签到不重复加币。
- 原邮箱账号、旧付费用户、未激活用户、封禁用户、游客、新注册用户分别验证。
- 本地草稿导出 / 导入，旧收藏链接，周刊 / 每日 / 实时流，COSE 扩展分发实际验证。
- 伪造 Origin / userId、重放、并发扣费、余额不足、D1 故障、AI 故障全部验证。
- Chrome / Safari，桌面 / 手机，DNS / TLS / canonical / 旧域兼容逐项验证。

## 本次验证结果（持续更新）

- `node --test tests/subsite-account.test.mjs tests/credential-auth.test.mjs tests/rank-site.test.mjs`：14 项通过，其中新增账号桥接测试 8 项。
- 对本次修改的 5 个 JavaScript 文件执行 `next lint --file ...`：通过，无 lint 警告或错误。
- `NEXT_DIST_DIR=.next-subsites-check next build --experimental-build-mode compile`：退出码 0，两条新 Edge 路由均进入构建清单。该命令只验证编译阶段，不等于完整 Pages 发布构建或线上验收。
- 构建有 `@cloudflare/next-on-pages` 经 `ownerAuth.js` 引入的 `process.release` Edge 兼容性警告；尚未做生产环境复核。
- `git diff --check`：通过。
- 临时编译产物移至 `/private/tmp/tuaran-subsites-compile-20260828`，不纳入项目提交。

## 参考

- [Cloudflare Pages 自定义域](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Cloudflare Worker 自定义域](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- [MDN：带凭证 CORS 与预检](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)

## AI 分发大师已实施细节

- 新域只使用主站签名会话；会话验证限定主站固定 URL，过滤 Cookie、禁止重定向、设置超时。没有主站登录时不回退到旧站会话。
- `platform_account_links` 对平台 ID 与旧业务用户 ID 双向唯一。关联要求主站登录和原邮箱密码同时验证；新建工作区需要用户明确操作。新域业务接口拒绝未关联身份。
- 原 `users.id`、密码、订阅、使用量、到期权益不更换。迁移前后均为 4 个旧邮箱账号，已关联账号数为 0。
- 微信代理仅转发必要的 Accept / Content-Type，不转发 Cookie 或 Authorization。新域写操作校验精确 Origin。
- 提供文章草稿 JSON 导出/导入，限制 10MB、校验结构、合并而不覆盖；不导出密钥或登录信息。其他工作流本地数据继续保留在原域，并未声称全部浏览器数据已迁移。
- 主站接口 14 项测试通过；SyncBlog 8 项测试通过，使用真实 SQLite 迁移验证关联冲突、旧权益保留、请求边界及草稿合并。SyncBlog 类型检查、限定文件 ESLint、Vite 构建与 Wrangler dry-run 均通过。
- 前端周看完整构建通过（81 个页面）。主站隔离 Pages 完整构建通过（93 条 Edge 路由，Worker gzip 2.611 MiB，预算余量 0.139 MiB）。
- 浏览器工具导航多次超时，未完成真实用户登录、账号关联、签到同步及 COSE 分发的浏览器端到端验收。HTTP 测试不能替代这些操作。

## 发布阻塞与继续执行入口

- 主站部署两次在静态资源上传阶段出现 EPIPE / UND_ERR_CONNECT_TIMEOUT；第三次使用 IPv4 优先解析仍出现 fetch failed。最后核实的生产版本仍是 `056b186f-14ef-46e3-ad34-1b7b6eae9167`，不能将编译成功写成发布成功。
- 已部署的 SyncBlog 依赖主站新接口，统一账号链路尚未达到可验收状态；原 `syncblog.cn` 继续保留。不能向用户宣称统一登录和燃币已全部接通。
- 可继续发布的隔离产物位于 `/private/tmp/tuaran-subsites-release-20260828/.vercel/output/static`，基于 `18ea27e14acde0abeb76a3f660ff3f5b5bef4dcc`。重试前须核实主站是否已有其他更新，避免覆盖更晚的发布。
- 线上 HTTP 验证脚本已准备在 `/private/tmp/verify-subsite-live-20260828.py`，尚未执行。它使用独立的内存 Cookie jar，不读取浏览器会话，不执行账号关联或已登录签到。
- 网络恢复后先完成主站发布与接口核验；获得域名授权后再绑定并部署前端周看、验证 TLS/路径，最后切换首页周看入口。真实登录、账号关联、签到同步与 COSE 分发仍需单独验收。

### 授权后进展

主站出现新提交 `e8536c2933877955696008de0b92794a41ca1f6a`（后台子站管理中心）。已据此生成新的隔离发布目录 `/private/tmp/tuaran-subsites-release-20260828-v2`，不再直接发布旧提交产物。真实生产版本因 Cloudflare 连接器不可达暂未重新核实；网络恢复后仍须先核对最新线上版本。

新隔离发布包完整 Pages 构建成功：93 条 Edge 路由，gzip 2.613 MiB，预算余量 0.137 MiB。主站账号、凭证、子站注册与管理的 27 项测试通过。测试曾在公开构建临时移走后台目录时出现路径不存在；构建完成恢复目录后复测通过。域名绑定两次获批执行均在首次 GET 超时（第二次 IPv4 优先），未执行写入；凭据未输出或写入项目。当前等待 Cloudflare 网络恢复，不再等待用户授权。
