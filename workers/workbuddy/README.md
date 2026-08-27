# WorkBuddy 资源库

`workbuddy.2aran.com` 的独立 Cloudflare Worker。静态界面由 Workers Static Assets 提供，资源目录和燃币权益使用主站 `tuaran-me` D1，可下载文件存放在独立私有桶 `workbuddy-private`。

主站 `tuaran-media` 已启用公开读取，不能用于燃币受控文件。新桶不得启用 r2.dev 或公开自定义域。

## 能力

- D1 驱动的资源列表、搜索、分类和详情页，每页 24 项，支持加载更多
- 复用 `tuaran_session` / `tuaran_guest`，主站账号无需重新注册
- 游客首次默认获得 50 燃币，读取主站 `ranbi.guestSeed` 规则，无角色门槛
- 同一资源只扣一次燃币，永久保留解锁权益
- 文件尚未导入时禁止空解锁
- PDF 等文件支持 R2 流式输出和浏览器 Range 请求
- 资源详情链接可直接访问：`/resource/<slug>`

## 本地运行

使用 Node.js 22.12+ 和 Wrangler 4.126.0；较旧的 Wrangler 无法运行本项目的兼容日期。命令均从仓库根目录执行。

先初始化本地 D1：

```bash
pnpm dlx wrangler@4.126.0 d1 migrations apply tuaran-me --local --config workers/workbuddy/wrangler.jsonc
```

在 `workers/workbuddy/.dev.vars` 写入与主站一致的本地签名 Secret（该文件已被 `.gitignore` 排除）：

```dotenv
NEXTAUTH_SECRET=本地开发签名密钥
```

启动：

```bash
pnpm dlx wrangler@4.126.0 dev --config workers/workbuddy/wrangler.jsonc --port 8788
```

## 导入真实资源

1. 确认资源的传播授权、实际标题和内容；当前六项是根据截图建立的待导入目录，介绍文案仍需与原件核对。
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

先创建私有桶，再给 Worker 配置和主站相同的会话签名 Secret：

```bash
pnpm dlx wrangler@4.126.0 r2 bucket create workbuddy-private
pnpm dlx wrangler@4.126.0 secret put NEXTAUTH_SECRET --config workers/workbuddy/wrangler.jsonc
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

测试使用内存 SQLite 执行真实 SQL，覆盖并发幂等、透支保护、失败回滚、共享价格、旧账号映射、禁用账号、文件缺失、受控下载和分页。不会改动线上数据。
