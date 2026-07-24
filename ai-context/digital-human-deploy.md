# 数字人口播部署

更新日期：2026-07-24

`/tools/digital-human` 使用 Cloudflare Workers AI 生成中文 MP3，使用 Replicate
SadTalker 异步生成口播视频。照片、临时语音和结果视频存入私有 R2。

## 必需配置

1. 创建未启用 `r2.dev` 和公开自定义域的 R2 桶 `tuaran-avatar-private`。
2. 在 Cloudflare Pages 的生产与预览环境绑定：
   - D1：`DB`
   - R2：`AVATAR_MEDIA`
   - Workers AI：`AI`
3. 应用 `migrations/0056_digital_human_jobs.sql`。
4. 添加加密 Secret：
   - `REPLICATE_API_TOKEN`
   - `DIGITAL_HUMAN_SIGNING_SECRET`（建议 32 字节以上随机值）
5. 重新部署 Pages。

可选变量：

- `DIGITAL_HUMAN_ACCESS=owner|authed`：默认 `owner`，稳定后才改为 `authed`。
- `REPLICATE_SADTALKER_VERSION`：覆盖代码内固定的 Replicate 模型版本。

## 数据与清理

- 任务完成或失败后，输入照片和临时 MP3 会立即删除。
- 结果视频默认可访问 7 天，过期访问会返回 `410` 并尝试删除对象。
- 建议同时在 R2 桶配置生命周期规则，删除 `digital-human/` 下超过 7 天的对象，
  用于清理从未再次访问的过期视频和异常中断留下的临时对象。
- Replicate webhook 使用站内 HMAC 签名 URL；`DIGITAL_HUMAN_SIGNING_SECRET`
  不得写入 `wrangler.toml` 或提交到仓库。
