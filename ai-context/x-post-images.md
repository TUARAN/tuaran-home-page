# X 自动发布配图与资源池

更新：2026-08-28

## 存储与入口

- 后台：`/admin/morning-greeting`，自动任务时间轴下方的“图片资源池”。
- 问候、朋友图文、文化短故事、加密观点、美区英文共 15 个时段：每次先尝试生成一张，失败或超过 90 秒则从同主题 R2 旧图中随机选择；两边均无图或上传失败时不发送纯文字。提示词生成另有 45 秒超时。超时不代表供应商已取消计算，费用仍以供应商账单为准。
- 图片由现有 Workers AI `AI` binding 调用 `@cf/black-forest-labs/flux-1-schnell`，提示词由现有 DeepSeek 服务根据实际推文生成。文案模式仍可选择 DeepSeek、Ollama 或问候模板。
- 新图文件：R2 `MEDIA` binding → `tuaran-media`，对象前缀 `images/x-posts/<上海日期>/<时段>/<租约 UUID>.<扩展名>`。
- 初始备用素材：本地 Codex imagegen 生成 5 个主题各 10 张，共 50 张。工具未返回可核实的底层模型名，记录为 `Codex imagegen`，与日常在线生成的 FLUX 区分。原图保留于 Codex 生成目录，不加入 Git 或 public；上传脚本 `scripts/upload-x-image-pool.mjs` 将其写入 `images/x-posts/pool/2026-08-28/` 并逐张下载校验 SHA-256。
- 备用池索引：D1 `x_image_pool`；已成功发布的在线生成图也参与同主题随机回退。后台“备用素材池”和“生成与发布记录”分别显示预生成图与任务记录，可筛选、预览、下载。
- 记录：D1 `x_post_assets`，包含文案、提示词、模型、对象键、状态、X 媒体及推文 ID。每个上海自然日、每个时段保留独立记录。
- 旧的 10 张朋友图文素材仍位于 `public/images/x-community/`（约 3.85 MiB），在资源池“历史固定素材”中展示；新回退流程仅查询 R2 素材，不使用这些静态旧图。public 资源增加静态产物大小，不等同于 Worker 代码压缩体积；新增 50 张图片不进入任何构建产物。
- 列表、原图预览、下载 API 均要求站长权限。MEDIA 桶原有公开访问配置保持不变：知道 R2 对象 URL 的人仍可能访问图片。文案与提示词不写入 R2 元数据。

## 重试与状态

先保存文案，再生成并保存图片（失败则记录随机选中的 R2 旧图），最后上传并发布到 X。上传失败重试时复用已保存的文案、提示词和图片，重新获取 X media ID，不重复生图或换图。记录包含 `asset_source`、`pool_asset_id` 和 `fallback_error`。D1 不可用时停止发布，避免绕过暂停和去重。

每个时段使用 10 分钟 D1 租约，并在写入时核对租约 token 与有效期。过期执行不能覆盖新任务的图片或继续发布。

发帖前先持久记录 `publishing`。超时、网络断开、5xx 或成功响应缺少推文 ID 时标为 `publish-unknown`，停止该时段自动重发。需在 X 账号核对后再决定人工处理；不要直接清除记录并盲目重试。已发布的 D1 记录也独立于旧的 last_run 设置阻止重复发帖。

成本面板仅统计现有 X 发帖接口费用，不包括 Workers AI 生图、DeepSeek 提示词、上传和 R2 费用；实际按各服务账单核对。

## 上线顺序

1. 在目标 D1 应用 **仅本次** `migrations/0082_x_post_assets.sql`。不要为本任务批量应用未核对的其他迁移。
2. 确认公开站部署环境有 `DB`、`MEDIA`、`AI` 和原有 DeepSeek / X 凭据；后台环境有指向同一资源的 `DB`、`MEDIA`。`wrangler.toml` 已声明这些绑定，但仍须核对线上环境。
3. 公开站使用 `npm run pages:build:public`；后台使用 `npm run pages:build`，分别发布。自动端点属于公开站，图片管理 API 属于后台站，必须更新两侧。
4. GitHub 工作流的超时调整需要随源代码推送后生效。
5. 观察下一个自然调度：资源池出现新图片、记录变为已发布、X 帖子实际有图。不要为验收额外触发所有 15 个时段。

## 本地验证

2026-08-28 实施记录：50 张原图已上传 R2 并全部回读验证 SHA-256，合计 114.34 MiB、50 个不同哈希、单张最大 3,660,752 字节。通过本机 Wrangler 仅应用 0082 迁移并登记 50 条素材。源代码尚未推送部署，没有额外调用真实 X 发帖。Cloudflare 连接器写权限不足，随后 OAuth 刷新失败；本机 Wrangler 经授权执行成功。

50 项相关测试通过，包括备用图上传失败后重试不再生图，以及站长通过列表地址预览、下载相同 R2 文件和禁用素材不可见；公开站 Pages 构建通过（Worker gzip 2.561 MiB，项目预算余量 0.189 MiB），后台 Pages 构建通过（gzip 1.882 MiB，余量 0.618 MiB）。这些是本地构建验证，不代表线上已切换。

本机素材清单及独立预览保存在 `/Users/tuaran/.codex/visualizations/2026/08/28/01a045d2-ec64-7712-844e-0b0a993385ca/`：`x-image-pool-manifest.json` 与 `x-image-pool.html`。清单包含提示词、原始文件路径、R2 对象键、尺寸和哈希，不包含凭据。

`node --test tests/distribution/x-distribution.test.mjs tests/morning-greeting.test.mjs tests/x-community-posts.test.mjs tests/x-crypto-posts.test.mjs tests/x-us-audience-posts.test.mjs`

覆盖真实 SQLite 迁移、租约抢占与隔离、图片保存和重用、五类发布端点、同主题回退、超时回退、缺失对象跳过、权限、暂停、生成/存储/上传失败及发布结果不明确时的去重。外部 AI、R2 与 X 使用测试替身；不能替代线上生图与真实发帖验收。

API 参考：[Cloudflare FLUX.1 schnell](https://developers.cloudflare.com/workers-ai/models/flux-1-schnell/)、[X 上传媒体](https://docs.x.com/x-api/media/upload-media)、[R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)。
