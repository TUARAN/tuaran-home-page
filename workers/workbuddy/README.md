# WorkBuddy 资源库

`workbuddy.2aran.com` 的独立 Cloudflare Worker。静态界面由 Workers Static Assets 提供，资源目录和燃币权益使用主站 `tuaran-me` D1，可下载文件存放在独立私有桶 `workbuddy-private`。

主站 `tuaran-media` 已启用公开读取，不能用于燃币受控文件。新桶不得启用 r2.dev 或公开自定义域。

2026-08-27 已部署到 `https://workbuddy.2aran.com`。主站身份验证接口已上线，共用游客余额、Cookie 验证、空资源不扣币和来源校验均通过线上联调。初次上线时六项资源为待导入目录。

## 能力

### 换肤工坊（2026-08-28 本地预览，未发布）

`/skins/` 独立页面；先直接展示 ¥19.9 微信收款码，再引导添加微信 `atar24`，提示“马上响应”。不使用联系弹窗，不接入支付 API，不伪造付款成功；人工查账后通过微信发包。微信收款码复用主站 `public/donate-wechat.jpg`，加好友码复用 GPT Plus 的 `qrcodewechat3.png`。不影响资源库燃币权益。

方案、用户最新要求和上线门槛见 `SKIN-PLAN.md`。四套原创主题使用 [WorkBuddy Theme Manager](https://github.com/comeonzhj/WorkBuddy-theme-skill) 的单主题 ZIP 协议，保留 MIT 来源说明，无上游游戏素材。预览标记为设计稿，当前没有实机兼容承诺，页面保留 noindex 和请勿付款提示。

构建主题交付包（需 Node 22、Python 3 + Pillow、系统 zip/unzip；测试也会验证实际打包）：

```bash
node workers/workbuddy/scripts/build-skin-packs.mjs
node --experimental-sqlite --test workers/workbuddy/tests/*.test.mjs
```

输出为 `workers/workbuddy/dist/skin-packs/` 的四个独立 ZIP、安装说明和 SHA-256 清单；该目录被 Git 忽略，不属于 `public/`，不得作为公开静态资源部署。每个 ZIP 包含主题配置、CSS、1200×750 设计预览和许可说明，无脚本。`saleReady: false` 和空 `testedWorkBuddy` 如实记录未完成实机测试。

正式发布收款页面前，必须确认实机导入/切换/恢复、收款码可用、客服值守及退款规则，然后统一更新 `SKIN-PLAN.md`、页面提示和交付说明。仅删除提示不能算完成验证。

### 资源库

- D1 驱动的资源列表、搜索、分类和详情页，每页 24 项，支持加载更多
- 复用 `tuaran_session` / `tuaran_guest`，主站账号无需重新注册
- 游客首次默认获得 50 燃币，读取主站 `ranbi.guestSeed` 规则，无角色门槛
- 同一资源只扣一次燃币，永久保留解锁权益
- 文件尚未导入时禁止空解锁
- PDF 等文件支持 R2 流式输出和浏览器 Range 请求
- 视频课程按课序列出，单播放器按需加载，支持拖动进度与分节下载；关闭详情时暂停播放
- 资源详情链接可直接访问：`/resource/<slug>`

## 本地运行

使用 Node.js 22.12+ 和 Wrangler 4.126.0；较旧的 Wrangler 无法运行本项目的兼容日期。命令均从仓库根目录执行。

先初始化本地 D1：

```bash
pnpm dlx wrangler@4.126.0 d1 migrations apply tuaran-me --local --config workers/workbuddy/wrangler.jsonc
```

无需配置任何主站签名密钥。Worker 通过固定 HTTPS 地址 `https://2aran.com/api/workbuddy/session` 让主站验证会话，仅转发 `tuaran_session` / `tuaran_guest` 两个 Cookie；签名与旧账号映射始终在主站完成。主站接口不可用时，阅读目录仍可使用，扣币和文件访问会拒绝执行。

本地开发同样调用主站验证接口，需要联网；数据库和文件仍默认使用本地模拟。测试通过模拟主站响应运行，不依赖网络或线上账号。

启动：

```bash
pnpm dlx wrangler@4.126.0 dev --config workers/workbuddy/wrangler.jsonc --port 8788
```

## 导入真实资源

### 2026-08-28 原件清单

已完成线上导入与部署，版本 `34b1022d-33cf-4586-b756-9c8fd4e76cc7`。61 个文件全部回读校验 SHA-256；线上核对 11 项详情和 61 条文件记录，并以独立测试游客验证 PDF / 视频的未解锁拒绝访问、重复解锁不扣币、文件首尾 Range 与下载响应。25 项自动测试通过。存储桶未绑定公开域名，r2.dev 公开访问保持关闭。

`imports/2026-08-28.json` 记录 11 项资源、61 个原文件：10 份 PDF（共 308 页）、50 节 MP4（约 308 分钟）和 1 张原资料附带说明图片。图片中的联系方式属于原资料提供方，不作为本站联系方式。原件保留在站长指定目录，不进入 Git 或公开静态目录。

导入脚本逐一校验本地 SHA-256，上传至内容哈希命名的私有 R2 key，再完整下载回读比对。全部通过后才生成 `catalog.sql`，不会自行修改线上数据库。输出目录的 `verified.json` 记录进度，重跑时已记录对象仍会回读核验。

```bash
node workers/workbuddy/scripts/import-resources.mjs \
  '/Users/tuaran/Downloads/WORKBUDDY 保姆级学习手册+视频' \
  workers/workbuddy/imports/2026-08-28.json \
  /private/tmp/workbuddy-import

# 确认全部 61 个文件核验通过后执行；不要提前登记未到位的文件。
pnpm dlx wrangler@4.126.0 d1 execute tuaran-me --remote \
  --config workers/workbuddy/wrangler.jsonc \
  --file /private/tmp/workbuddy-import/catalog.sql
```

原有资源 ID、slug、resource_key 保持不变。已存在的价格、发布状态、首次发布时间与解锁权益不会被导入覆盖；新增 PDF 沿用 5 燃币，整套视频沿用 10 燃币。文件清单可重复导入，不产生重复记录。

### 其他批次

1. 确认资源的传播授权、实际标题和内容，并与原件核对介绍文案。
2. 将文件上传到 `workbuddy-private` 的 `workbuddy/<slug>/` 前缀。
3. 在 `workbuddy_resources` 新增或更新资源元数据。
4. 在 `workbuddy_files` 登记 R2 `object_key`、文件名、类型和交付方式。
5. 在 `gated_resources` 使用相同 `resource_key` 登记燃币价格，`min_role` 设为 `guest`。此表的价格优先于资源目录默认价。

文件登记后，详情页会自动显示阅读/下载按钮。`delivery` 可取：

- `read`：优先浏览器内阅读（仍提供下载；不是 DRM）
- `download`：仅下载
- `both`：阅读与下载

示例：

```sql
INSERT INTO workbuddy_files
  (id, resource_id, label, object_key, file_name, content_type, size_bytes, delivery, sort_order, created_at)
VALUES
  ('wb-beginner-pdf', 'wb-beginner', '完整 PDF',
   'workbuddy/workbuddy-beginner-guide/guide.pdf', 'WorkBuddy-保姆级入门指南.pdf',
   'application/pdf', 1234567, 'both', 10, 1787788800000);
```

## 线上初始化与部署

先发布主站新增的 `/api/workbuddy/session` 接口，再创建私有桶。WorkBuddy **不需要** `NEXTAUTH_SECRET`，也不用寻找、复制或重置主站密钥：

```bash
pnpm dlx wrangler@4.126.0 r2 bucket create workbuddy-private
```

再迁移和部署：

```bash
pnpm dlx wrangler@4.126.0 d1 migrations apply tuaran-me --remote --config workers/workbuddy/wrangler.jsonc
pnpm dlx wrangler@4.126.0 deploy --config workers/workbuddy/wrangler.jsonc
```

部署前确认 `workbuddy.2aran.com` 尚未被其他 Worker 或 Pages 项目占用。迁移会复用主站现有的 `point_ledger`、`user_points`、`gated_resources`、`resource_unlocks` 和 `resource_events` 表。

## 验证

```bash
node --experimental-sqlite --test workers/workbuddy/tests/*.test.mjs tests/rank-site.test.mjs
pnpm dlx wrangler@4.126.0 deploy --dry-run --config workers/workbuddy/wrangler.jsonc
```

测试使用内存 SQLite 执行真实 SQL，覆盖主站验证协议、上游故障拒绝访问、Cookie 最小转发、禁用账号、并发幂等、透支保护、失败回滚、共享价格、文件缺失、受控下载和分页。不会改动线上数据。
