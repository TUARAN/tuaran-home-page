# A 股公司观察自动化设计

更新日期：2026-08-12

## 目标

维护一个可追溯的 A 股上市公司候选池。每天最多选择一家公司，按当前通用模板生成一篇公司观察文章，并提供 3 天人工复核窗口。

## 数据流

1. `npm run a-share:sync` 从结构化行情列表取得沪市、深市和北交所公司，执行数量、代码和市场完整性校验。
2. 同步结果写入 `data/a-shares/companies.json`，同时重建 `research/companies/2026-07-31-a-share-company-list.md`。
3. `npm run a-share:pick` 优先返回尚未完成的选择；没有待完成项时，从未研究公司中随机选择一家。
4. 自动化读取 `research/templates/a-share-company-research.md` 和当前生效的 `lib/researchStyleTemplates.js`，检索一手资料并写文章。
5. 文章通过最小校验后，运行 `npm run a-share:complete -- --code <代码> --file <文章路径>` 标记完成。

## 线上自动化（2026-08-06 起）

本地流程的云端替代：`lib/aShareResearch.js` + `lib/aShareResearchCore.js`，由 GitHub Actions 定时
POST `https://2aran.com/api/cron/a-share-research`（`x-a-share-secret` 头鉴权）触发，状态全部落 D1。

- 公司池完整 JSON 存 `a_share_pool_snapshot.content`（D1 单行；免费计划 D1 每次调用限 50 个查询，
  逐行 INSERT 5000+ 家会超限，`a_share_pool` 表保留但不参与写入）；默认 7 天过期才重同步
  （巨潮资讯公司列表 + 腾讯行情批量核验，校验口径与本地脚本一致）。
- 每日选题写 `a_share_selections`，草稿写 `a_share_drafts`，运行记录写 `a_share_run_log`。
- 草稿生成走 DeepSeek **Responses API**（`callDeepSeekResponses`，source=`a-share-research` /
  taskType=`daily-draft`），启用服务端 `web_search` 联网检索：模型可在起草时检索主营业务、
  最新财报、公告新闻等公开信息，引用来源写进「十、信息来源与说明」，检索次数与引用数记入
  `deepseek_tasks` 台账 metadata；调用记录自动进台账，后台 `/admin/a-share-research` 可查看
  草稿与运行日志，`/admin/deepseek-tasks` 可查看每次调用的联网检索情况。
- 起草按站内路由规则默认用 `deepseek-v4-flash`（结构化简单任务，单次请求墙钟内可完成）；
  并显式关闭思考模式（Responses API 用 `reasoning: { effort: "none" }`；老
  `/chat/completions` 的 `thinking: disabled` 同样保留给其他调用方；V4 默认会把 token 花在
  reasoning_content 上，不关则墙钟内写不完正文）；
  密钥绑定里给该任务配置 `default_model` 或设置 `DEEPSEEK_MODEL` 可覆盖。
- 单次 Worker 请求有墙钟限制；草稿未完成时后续调度继续同一家公司，最多重试 5 次，
  失败不重复选题（与本地幂等约定一致）。
- 自动生成稿保持 `review_ready: false` / `ad_eligible: false`。草稿进入 `pending` 后提供 72 小时复核窗口；
  站长可提前发布或将其退回为 `rejected`。每日调度先检查过期稿，每次最多自动发布最早到期的一篇，
  已复核、已退回和已发布稿不会进入自动发布。自动发布失败时恢复 `pending` 并保留原到期时间，后续调度重试。
- 人工发布与自动发布共用 `lib/aSharePublisher.js`，通过 GitHub Contents API 提交 `main`，随后由 Cloudflare Pages 构建上线。
- 定时触发见 `.github/workflows/a-share-research.yml`（每天北京时间 01:00）。
- 定时任务失败时（含 GitHub Actions runner 未接单、端点返回非 200），工作流会调用
  `POST /api/automation/alert` 向站长消息中心写入「自动化监控」通知（幂等按 workflow+runId 去重，
  鉴权复用 `AUTOMATION_ALERT_SECRET` / `WEEKLY_SUMMARY_SECRET` / `PUBLIC_OPINION_COLLECT_SECRET` 回退链）。

需要新增的 Cloudflare Pages Secret：`A_SHARE_COLLECT_SECRET`（与 GitHub 仓库 Secret 同值）；
未配置时路由回退复用 `WEEKLY_SUMMARY_SECRET` / `PUBLIC_OPINION_COLLECT_SECRET`。
路由鉴权为「任一已配置 secret 均可放行」，因此 GitHub Actions 侧即使没配专用 Secret、
回退到 `PUBLIC_OPINION_COLLECT_SECRET` 也能触发。

## DeepSeek 密钥管理

自 2026-08-06 起，`lib/deepseek.js` 不再只认环境变量：

- `deepseek_keys` 表（迁移 0059）保存可管理密钥，明文用 `DEEPSEEK_KEYS_ENC_SECRET`
  （AES-GCM，任意长度主密钥经 SHA-256 派生）加密落库，界面只显示掩码。
- 每个密钥可绑定任务（source / taskType），解析优先级：
  精确绑定 > source 绑定 > 全局兜底（空绑定）> 环境变量 `DEEPSEEK_API_KEY`。
- 调用记录通过 `deepseek_tasks.key_id` 关联密钥，`/admin/deepseek-tasks` 可切换
  「调用记录 / 密钥管理」标签页查看。

## 文件职责

| 文件 | 职责 |
|---|---|
| `data/a-shares/companies.json` | 当前公司池快照、数据来源和市场统计 |
| `data/a-shares/research-state.json` | 抽取、重试和完成历史 |
| `research/companies/2026-07-31-a-share-company-list.md` | 面向读者的完整名单 |
| `research/templates/a-share-company-research.md` | 可持续升级的通用写作模板 |
| `scripts/manage-a-share-research.mjs` | 同步、抽取、完成和状态查询 |

## 幂等与失败处理

- 同一时间只保留一个 `selected` 状态。文章没有完成时，后续运行继续处理同一家公司。
- 已有文章通过 frontmatter 的 `stock_code` 识别，即使状态文件重建，也不会再次抽取。
- 同步数据少于 5000 家、多于 8000 家或缺少任一交易所时，拒绝覆盖旧快照。
- 自动生成文章固定使用 `review_ready: false` 和 `ad_eligible: false`。
- 在线草稿进入待复核满 72 小时仍未处理时自动发布；站长在到期前退回可阻止发布。
- 每次定时运行最多自动发布一篇最早到期草稿，状态占用与 GitHub 提交保持幂等，避免人工发布和定时发布重复执行。

## 模板升级

修改模板时递增 `template_version`，并同步修改输出 frontmatter 的 `research_template_version`。历史文章保留原版本号，便于回溯当时的结构和核验要求。

结构有重大变化时，先用一家公司人工演练，再恢复每日自动化。
