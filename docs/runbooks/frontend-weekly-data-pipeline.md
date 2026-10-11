# 前端周刊高频数据流水线

## 边界

前端周刊相关能力分为三层：

| 层级 | 正本 | 内容 |
| --- | --- | --- |
| 产品与读取层 | `TUARAN/tuaran-home-page` | 页面、只读 API、OIDC 写入端点、数据契约、测试和 fallback |
| 编辑与生产层 | `TUARAN/frontend-weekly-digest-cn` | 周刊 Markdown、抓取与筛选脚本、Cloudflare Worker Cron、人工补发 Actions |
| 运行数据层 | Cloudflare R2 `tuaran-content-feed` | 实时流、每日快照、每日索引和周刊索引 |

高频生成数据不再写回两个产品仓库。编辑后的周刊 Markdown 继续保留 Git 历史。

## R2 对象

```text
frontend-weekly/
├── live/current.json
├── daily/index.json
├── daily/YYYY-MM-DD.json
└── weekly/index.json
```

- `live/current.json` 每小时覆盖，缓存 5 分钟。
- 每日快照按日期保存，写入后按不可变对象缓存。
- `daily/index.json` 由写入端点合并，最多保留 400 条。
- `weekly/index.json` 在周刊同步任务完成后更新。

## 调度

- Cloudflare Worker `frontend-weekly-feed` 每小时抓取一次 AI HOT 并覆盖实时流。
- 北京时间 09:00 的同一轮任务额外生成每日快照并更新每日索引。
- GitHub Actions 不再承担实时流和每日精选的生产调度，只保留人工补发入口。
- 周刊同步属于低频编辑任务，完成 Markdown 更新后发布周刊索引。

## 鉴权

人工补发使用 `POST /api/frontend-weekly/ingest`，接口只接受 GitHub Actions OIDC Token。Token 必须同时满足：

- issuer 为 `https://token.actions.githubusercontent.com`；
- audience 为 `https://2aran.com/api/frontend-weekly/ingest`；
- repository 为 `TUARAN/frontend-weekly-digest-cn`；
- ref 为 `refs/heads/main`；
- `workflow_ref` 指向该仓库主分支下的工作流文件；
- RSA 签名、有效期与生效时间校验通过。

因此不需要在 GitHub 与 Cloudflare 之间复制长期写入 Secret。Actions 只需要 `id-token: write`。

## 读取与降级

- `GET /api/frontend-weekly` 返回周刊索引、每日索引与实时流。
- `GET /api/frontend-weekly/daily/:date` 返回指定每日快照。
- `2aran.com` 页面构建时读取 `content/frontend-weekly/fallback.json`，浏览器加载后再获取 R2 数据。
- `frontendnext.com`、`frontendweekly.cn`、`qdzk.site` 与 `fwdc.pages.dev` 可通过受限 CORS 读取同一接口。
- R2 或 API 暂时不可用时，两个前端继续展示仓库内最后一份 fallback，不阻断页面构建。

## 运维

数据迁移日期：2026-07-31。

迁移时已将 59 份每日快照、实时流、每日索引和周刊索引上传至 `tuaran-content-feed`，并抽取四类对象做 SHA-256 逐字节校验。

排查顺序：

1. 查看 Cloudflare Worker `frontend-weekly-feed` 的 Cron 与运行日志。
2. 人工补发时检查 Actions 是否取得 OIDC Token，以及写入端点是否返回 `401`、`400` 或 `503`。
3. 用 Wrangler 检查 R2 对象：

   ```bash
   npx wrangler r2 object get \
     tuaran-content-feed/frontend-weekly/live/current.json \
     --file /tmp/frontend-weekly-live.json \
     --remote
   ```

4. 检查公开读取接口是否返回 `ok: true`。
5. API 故障期间不要恢复自动 Git 提交；fallback 用人工确认后的低频快照更新。
