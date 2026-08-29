# X 自动发布配图与资源池

更新：2026-08-29

## 排程与发布形式

- 15 个原始时间节点保持不变，每天按上海日期和时段计算前后 30 分钟内的随机计划时间。同一天重试沿用原计划，跨日重新计算。
- GitHub 工作流每 5 分钟运行 `scripts/run-x-auto-posts.mjs`，只请求到期任务。排程统一由 `lib/xPostingSchedule.js` 计算；自动请求携带上海日期，服务端再次核对日期和时间窗口。计划时间后一小时内允许补跑，跨上海自然日停止；GitHub 排队、生成耗时和失败重试可能使实际发帖更晚。手动 workflow_dispatch 仍立即执行所选时段，保留每日去重。
- 每条新文案保存时以 50% 概率选择图文、50% 选择纯文本。形式和文案一起持久化，重试不重新抽取；升级前已有文案、提示词或图片的任务继续走图文流程。
- 纯文本使用现有 `asset_source = 'text'` 标识，跳过图片提示词、生图、R2 和媒体上传，共用原有租约、发布状态和去重机制，不需要新迁移。图文任务仍必须取得图片，不因图片失败改发纯文本。

## 存储与入口

- 后台：`/admin/morning-greeting`，自动任务时间轴下方的“图片资源池”。
- 问候、朋友图文、文化短故事、加密观点、美区英文共 15 个时段中的图文任务：尚无已保存配图时，用随机数等概率选择两种策略。小于 0.5 时生成优先，失败或超过 90 秒则随机使用同主题 R2 素材兜底；大于等于 0.5 时直接随机选用同主题、已启用的备用素材，不调用提示词生成或生图服务，也不混入历史在线生成图。直接素材分支遇到无可用素材时返回失败，不反向启动生图；任一分支没有图片或上传失败时均不发送纯文字。提示词生成另有 45 秒超时。超时不代表供应商已取消计算，费用仍以供应商账单为准。
- 图片由现有 Workers AI `AI` binding 调用 `@cf/black-forest-labs/flux-1-schnell`，提示词由现有 DeepSeek 服务根据实际推文生成。文案模式仍可选择 DeepSeek、Ollama 或问候模板。
- 每次新建生图提示词时独立随机选择动漫、日式浮世绘、赛博朋克、抽象、现代主义、水彩、剪纸或黑白摄影。画风指令明确媒介、构图、色彩和光线，与推文类型的题材约束分开；同一风格同时传给 DeepSeek 并前置到最终 FLUX 提示词中，最终提示词持久保存。保留无文字、无水印和加密主题的风险约束。概率抽样允许相邻任务抽到相同风格或策略，不强制交替。
- 新图文件：R2 `MEDIA` binding → `tuaran-media`，对象前缀 `images/x-posts/<上海日期>/<时段>/<租约 UUID>.<扩展名>`。
- 初始备用素材：本地 Codex imagegen 生成 5 个主题各 10 张，共 50 张。工具未返回可核实的底层模型名，记录为 `Codex imagegen`，与日常在线生成的 FLUX 区分。原图保留于 Codex 生成目录，不加入 Git 或 public；上传脚本 `scripts/upload-x-image-pool.mjs` 将其写入 `images/x-posts/pool/2026-08-28/` 并逐张下载校验 SHA-256。
- 备用池索引：D1 `x_image_pool`；已成功发布的在线生成图也参与同主题随机回退。后台“备用素材池”和“生成与发布记录”分别显示预生成图与任务记录，可筛选、预览、下载。
- 记录：D1 `x_post_assets`，包含文案、提示词、模型、对象键、状态、X 媒体及推文 ID。每个上海自然日、每个时段保留独立记录。
- 旧的 10 张朋友图文素材仍位于 `public/images/x-community/`（约 3.85 MiB），在资源池“历史固定素材”中展示；新回退流程仅查询 R2 素材，不使用这些静态旧图。public 资源增加静态产物大小，不等同于 Worker 代码压缩体积；新增 50 张图片不进入任何构建产物。
- 列表、原图预览、下载 API 均要求站长权限。MEDIA 桶原有公开访问配置保持不变：知道 R2 对象 URL 的人仍可能访问图片。文案与提示词不写入 R2 元数据。

## 重试与状态

选中图文时，先保存文案，再随机选择生成优先或直接素材，保存图片对象键后上传并发布到 X。上传失败重试时优先复用已保存的文案、提示词和图片，不重新抽策略，重新获取 X media ID，不重复生图或换图；已保存对象丢失时返回错误，不静默换图。尚未保存图片时的重试会重新抽取策略。记录复用现有 `asset_source`、`pool_asset_id` 和 `fallback_error`，无需数据库迁移；直接选素材时 `fallback_error` 为空，生成失败兜底时保存实际失败原因，后台分别显示来源。D1 不可用时停止发布，避免绕过暂停和去重。

每个时段使用 10 分钟 D1 租约，并在写入时核对租约 token 与有效期。过期执行不能覆盖新任务的图片或继续发布。

发帖前先持久记录 `publishing`。超时、网络断开、5xx 或成功响应缺少推文 ID 时标为 `publish-unknown`，停止该时段自动重发。需在 X 账号核对后再决定人工处理；不要直接清除记录并盲目重试。已发布的 D1 记录也独立于旧的 last_run 设置阻止重复发帖。

成本面板仅统计现有 X 发帖接口费用，不包括 Workers AI 生图、DeepSeek 提示词、上传和 R2 费用；实际按各服务账单核对。

## 上线顺序

1. 在目标 D1 应用 **仅本次** `migrations/0082_x_post_assets.sql`。不要为本任务批量应用未核对的其他迁移。
2. 确认公开站部署环境有 `DB`、`MEDIA`、`AI` 和原有 DeepSeek / X 凭据；后台环境有指向同一资源的 `DB`、`MEDIA`。`wrangler.toml` 已声明这些绑定，但仍须核对线上环境。
3. 公开站使用 `npm run pages:build:public`；后台使用 `npm run pages:build`，分别发布。自动端点属于公开站，图片管理 API 属于后台站，必须更新两侧。
4. GitHub 工作流的超时调整需要随源代码推送后生效。
5. 观察自然调度：核对执行时间和发布形式，记录变为已发布；图文有图，纯文本无图。不要为验收额外触发所有 15 个时段。

## 本地验证

2026-08-28 实施记录：50 张原图已上传 R2 并全部回读验证 SHA-256，合计 114.34 MiB、50 个不同哈希、单张最大 3,660,752 字节。通过本机 Wrangler 仅应用 0082 迁移并登记 50 条素材。源代码尚未推送部署，没有额外调用真实 X 发帖。Cloudflare 连接器写权限不足，随后 OAuth 刷新失败；本机 Wrangler 经授权执行成功。

50 项相关测试通过，包括备用图上传失败后重试不再生图，以及站长通过列表地址预览、下载相同 R2 文件和禁用素材不可见；公开站 Pages 构建通过（Worker gzip 2.561 MiB，项目预算余量 0.189 MiB），后台 Pages 构建通过（gzip 1.882 MiB，余量 0.618 MiB）。这些是本地构建验证，不代表线上已切换。

本机素材清单及独立预览保存在 `/Users/tuaran/.codex/visualizations/2026/08/28/01a045d2-ec64-7712-844e-0b0a993385ca/`：`x-image-pool-manifest.json` 与 `x-image-pool.html`。清单包含提示词、原始文件路径、R2 对象键、尺寸和哈希，不包含凭据。

`node --test tests/distribution/x-distribution.test.mjs tests/morning-greeting.test.mjs tests/x-community-posts.test.mjs tests/x-crypto-posts.test.mjs tests/x-us-audience-posts.test.mjs`

覆盖真实 SQLite 迁移、租约抢占与隔离、图片保存和重用、五类发布端点、同主题回退、超时回退、缺失对象跳过、权限、暂停、生成/存储/上传失败及发布结果不明确时的去重。外部 AI、R2 与 X 使用测试替身；不能替代线上生图与真实发帖验收。

API 参考：[Cloudflare FLUX.1 schnell](https://developers.cloudflare.com/workers-ai/models/flux-1-schnell/)、[X 上传媒体](https://docs.x.com/x-api/media/upload-media)、[R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)。
