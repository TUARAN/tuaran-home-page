# 内容存储改造：上线与恢复

代码和本地验证已准备。以下远程操作未自动执行：D1 备份/迁移、Git 内容发布、R2 上传、网站部署。

## 1. D1 与代码上线顺序

1. 备份线上 D1，并记录当前 Pages 部署版本。公开站和后台站必须使用同一内容数据库。
2. 在现有 migrations 顺序之后应用 `0089_content_documents.sql`。它新增调研快照/别名表，以及普通文章与调研共享短 URL 的冲突保护；不迁移或删除既有正文。
3. 部署本次后台和公开站代码。历史归档仍可读取；未新增 schema 时历史调研兼容读取，但新版发布入口会拒绝写入。不得先依赖新版发布器、后补 schema。
4. 先用一篇普通文章和一篇调研检查发布、详情、主目录、推荐、RSS/sitemap、撤回 404；再逐步导入历史调研。
5. 检查已有 A 股/加密资产定时发布任务。新版专用发布器保存 Git 正本，再写 D1；纯内容提交带 `[CF-Pages-Skip]`，不会触发 Pages 部署。

目录查询不再携带全部正文。草稿、撤回状态与目录索引同事务写入；D1 连接错误不能回落出已撤回的历史正文。

回滚代码前先停止新发布。迁移属于增量 schema，通常保留它及已写入的 D1 数据，不删除表。旧代码无法展示只存在 D1 中的新调研，因此应优先修复并重新部署新版；不得把“回滚部署”误当作完整内容恢复。

## 2. 日常创作与发布

普通文章：后台 `/admin/articles/new` 支持富文本或 Markdown，可导入 `.md`、预览并发布。正文使用现有 `article_posts`；图片按钮继续使用现有 R2 上传。发布过的 slug 在撤回后仍保持不变，首次发布日期也保留。

Git 调研：遵循 `research/README.md` 与现有风格约定，修改 Markdown 正本并 push 到 `main` 后，打开 `/admin/articles?panel=import` 审批发布。后台从 GitHub 读取正文，核对后写入 D1。源哈希用于追踪版本。加密内容只携带密文。冲突时刷新发布状态、核对差异，再决定是否发布。

`data/content-archive.json` 固定迁移当日的 249 篇调研和 7 篇内置文章。不要日常扩充它。新增源文件不会因此自动进入静态正文、旧 RSS 或代码目录。历史文章的 D1 快照优先于归档；下线记录保留，避免归档复活。

## 3. 媒体迁移到 R2

只处理已有 `public/feed`、`images`、`videos`、`audio`；不迁移 ONNX/WASM 运行库。私密、加密或付费媒体不得批准进入公开 MEDIA 桶。

### 清点和审阅

```sh
node scripts/inventory-content-media.mjs --output /tmp/media-inventory.json
```

清单含路径、字节数、SHA-256 和源码字面引用。动态 URL 和外部引用仍需核对。仅对确认可公开迁移的条目设置 `visibility: "public"`、`migrationStatus: "approved"`；其他条目保留 `unreviewed`。

准备迁移计划（把 PUBLIC_MEDIA_ORIGIN 替换为实际 R2 公开地址）：

```sh
node scripts/migrate-content-media.mjs prepare --inventory /tmp/media-inventory.json --base-url PUBLIC_MEDIA_ORIGIN --bucket tuaran-media --plan /tmp/media-plan.json
```

此步只检查本地文件并生成计划，无网络请求。对象使用 `content-media/<SHA-256>/<文件名>`，避免覆盖不同内容；计划固定了源哈希、MIME 和旧 URL。

### 上传与校验

以下命令会写入已配置的公开 MEDIA 桶，执行前核对计划和账户：

```sh
node scripts/migrate-content-media.mjs upload --plan /tmp/media-plan.json
node scripts/migrate-content-media.mjs verify --plan /tmp/media-plan.json
```

上传仅允许 `wrangler.toml` 中 MEDIA 对应的桶；不会写 NSFW_MEDIA 或 AVATAR_MEDIA。文件哈希相同则可复用已有对象。验证要求远端完整字节哈希、MIME 正确，CORS 允许 `https://2aran.com`，音视频支持 Range。缺少 CORS 时先在 R2 配置后重试，不跳过校验。

### 先切换旧地址，再清理

```sh
node scripts/migrate-content-media.mjs activate --plan /tmp/media-plan.json
```

工具再次校验远端，生成 `public/_redirects` 的专属 302 区块和 `data/media-redirects.json`，保留原文件。正文和页面中的旧 URL 不必批量改写。构建脚本会将这些媒体请求排除出 Functions，让 Pages 处理重定向；动态 `/feed/<id>` 不受影响。依据见 [Pages redirects 文档](https://developers.cloudflare.com/pages/configuration/redirects/)。

检查 diff，构建并部署这一阶段，然后检查线上旧 URL。只有确认线上旧地址已返回预期 302，才运行：

```sh
node scripts/migrate-content-media.mjs prune --plan /tmp/media-plan.json --backup /absolute/path/outside-public/media-backup
```

工具会再次校验 R2 和线上旧地址，先备份全部源文件，再删除本地原文件。备份必须放在 `public/` 之外，并保存计划。清理后的代码需要另一次部署才会减小线上静态产物。

当前工具一次处理一个激活计划，不支持叠加多个未完成迁移。不要把迁移计划、校验结果或备份当作可公开下载资源。

### 恢复

```sh
node scripts/migrate-content-media.mjs rollback --plan /tmp/media-plan.json --backup /absolute/path/outside-public/media-backup
```

恢复已清理的文件，去掉本次重定向区块并保留其他规则；检查后重新部署。若本地文件或专属重定向区块已被其他人修改，工具拒绝覆盖，需手工核对。工具不会删除 R2 对象，也不会自动提交或部署。

## 4. 本地回归

先结束 Pages 构建，再运行文件读取型测试：构建脚本会临时移动另一站的路由目录，同时运行测试会出现假性 ENOENT。

```sh
node --test tests/content-storage/*.test.mjs tests/content-management/*.test.mjs tests/seo/*.test.mjs tests/navigation/content-taxonomy.test.mjs tests/a-share-publish-core.test.mjs tests/a-share-publisher.test.mjs tests/crypto-publisher.test.mjs tests/articles/markdown-inline-formatting.test.mjs tests/articles/mermaid-rendering.test.mjs tests/home-recommendation.test.mjs
npm run pages:build
npm run pages:build:public
```

保留仓库现有 gzip 门槛：公开 2.750 MiB，后台 2.500 MiB。新 D1 内容不增加 Worker 代码，但功能代码仍可能使预算超限。
