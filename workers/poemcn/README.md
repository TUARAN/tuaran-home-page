# 阿燃诗词 Worker

`poemcn.2aran.com` 是独立部署的 Cloudflare Worker。生产运行时只读：D1 提供标题、作者、分类和全文搜索索引，R2 提供不可变的正文 JSON 分片与静态 sitemap。Worker 没有定时写入处理器，也不再边服务边抓取上游数据。

## 数据架构

```text
固定 chinese-poetry commit
        │
        ▼
离线构建：去重、增量、统计、sitemap、预算估算
        │
        ├── D1 release 索引：标题 / 作者 / 朝代 / 分类 / 搜索字段 / body_key
        └── R2 releases/<version>/：正文分片 / sitemap
                                      │
                                      ▼
                         dataset_state 最后一次性切换
```

旧 `poems` 表在迁移期继续作为 `legacy` 只读数据源。`0004_r2_versioned_index.sql` 不做旧表全量回填，避免迁移本身产生大量 D1 写入。新 release 激活后，列表和搜索只查询 `poem_search_index`；详情先按 `(dataset_version, id)` 精确查询 `body_key`，再读取对应 R2 分片。统计直接读取 `dataset_state.stats_json`，sitemap 直接读取构建产物，不在请求时扫描业务表。

## 首次准备

先创建专用 R2 bucket，并在目标 D1 应用独立的新架构 migration：

```bash
npx wrangler r2 bucket create poemcn-content --config workers/poemcn/wrangler.toml
npx wrangler d1 migrations apply china-poetry --local --config workers/poemcn/wrangler.toml
npx wrangler d1 migrations apply china-poetry --remote --config workers/poemcn/wrangler.toml
```

远端 migration 和发布会修改 Cloudflare 数据，必须在 D1 限额恢复后单独执行。部署新 Worker 代码前必须先应用 `0004` 并创建 bucket，否则读取 `dataset_state` 或 R2 binding 会失败。

## 固定版本离线构建

`upstream-lock.json` 只接受完整 40 位 SHA。当前网络只能核实到短前缀 `b8594f8`，因此 `commit` 暂为 `null`；补齐完整 SHA 前，月度任务会安全跳过，构建脚本也拒绝 `master`、tag 或短 SHA。

```bash
npm --prefix workers/poemcn run dataset:fetch -- \
  --commit <40位SHA> \
  --target /private/tmp/chinese-poetry

npm --prefix workers/poemcn run dataset:build -- \
  --commit <40位SHA> \
  --source-dir /private/tmp/chinese-poetry \
  --baseline-catalog /path/to/previous/catalog.ndjson \
  --output /private/tmp/poemcn-release
```

构建产物包含：

- `manifest.json`：来源 commit、对象哈希、统计、增量摘要和预算结论；
- `delta.json`：相对上一份 catalog 的新增、更新、删除与未变 ID；
- `index.sql`：只含 D1 搜索索引数据；
- `activate.sql`：最后切换 active version；
- `r2/releases/<version>/`：正文 JSON 分片和静态 sitemap。

不提供 `--baseline-catalog` 时，所有记录都会被视为新增；这只影响增量报告，不影响完整 release 内容。

## 发布预算门禁

`release-budget.json` 是项目自己的保守门槛。构建时记录实际 R2 对象数、字节数、SQL 字节数和 D1 逻辑行数；发布时重新读取当前门槛、复算写入估计，并校验每个 R2 文件的长度与 SHA-256。任何一项超限都会在首次远端写入前停止。

先执行 dry-run：

```bash
npm --prefix workers/poemcn run dataset:publish -- \
  --manifest /private/tmp/poemcn-release/manifest.json \
  --database china-poetry \
  --bucket poemcn-content
```

人工检查 `manifest.json`、`delta.json` 和预算后，才允许显式发布：

```bash
npm --prefix workers/poemcn run dataset:publish -- \
  --manifest /private/tmp/poemcn-release/manifest.json \
  --database china-poetry \
  --bucket poemcn-content \
  --apply \
  --confirm-version <manifest.version>
```

发布顺序固定为：上传不可变 R2 对象 → 导入未激活 D1 索引 → 校验记录数 → `EXPLAIN QUERY PLAN` → 最后执行 `activate.sql`。中途失败只会留下未激活 release，不改变线上 active version。脚本不会自动清理旧 release，回滚时仍可使用。

每月 1 日的 GitHub Actions 任务会恢复上一份未过期 artifact 的 catalog 作为增量基线，只构建并保留新的 release artifact 60 天，不接触 Cloudflare 生产数据。手动运行可以临时输入完整 commit；计划任务只读取 `upstream-lock.json`。生产发布始终需要本地显式 `--apply` 和版本确认。

## 新 D1 离线构建与切换

完整数据集预计超过当前保守写入门槛时，不应放宽门槛后直接灌入正在服务的库。创建新库并离线验证：

```bash
npx wrangler d1 create china-poetry-next
npx wrangler d1 execute china-poetry-next --remote \
  --file workers/poemcn/migrations/0004_r2_versioned_index.sql
```

随后把 `dataset:publish --database` 指向 `china-poetry-next`。发布脚本会在激活前校验记录数和索引计划；还应抽查标题、分类搜索与若干 R2 详情。全部通过后，把 `wrangler.toml` 的 `DB.database_id` 改成新库 ID 并部署 Worker。旧 D1 不删除；需要回滚时恢复旧 `database_id` 并重新部署。

这个方案把大批写入与线上请求隔离开，但仍受账户 D1 写入配额约束。预算门槛必须根据实际 release 的 manifest、Cloudflare 当前套餐和可接受的发布窗口人工调整，不能靠脚本绕过。

## 测试与部署

```bash
npm --prefix workers/poemcn test
npx wrangler deploy --dry-run --config workers/poemcn/wrangler.toml
npx wrangler dev --config workers/poemcn/wrangler.toml
npx wrangler deploy --config workers/poemcn/wrangler.toml
```

主站的 Cloudflare Pages 构建不会发布该 Worker。共享主站登录仍通过带凭证的 `https://2aran.com/api/subsites/session`；诗词站不复制账号库或签名密钥。发布顺序仍是先发布主站精确来源与回跳白名单，再单独部署诗词 Worker。

`/sitemap.xml` 是 sitemap index；`/sitemaps/pages.xml` 和 `/sitemaps/poems-N.xml` 来自 active release。`robots.txt` 指向正式域名。搜索引擎抓取、收录与排名由各平台决定，不能承诺立即收录或排名。
