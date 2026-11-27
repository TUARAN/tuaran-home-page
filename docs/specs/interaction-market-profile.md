# 大互动智能体市场画像（zh / en）

2026-11-27

## 单一正本

- 账号与市场绑定：`lib/interaction/agentPool.js`
- 语言门控规则：`lib/interaction/marketProfile.js`
- 扩展侧名单由 `npm run interaction:sync-agent-pool` 生成到 `tools/x-reply-clipboard-extension/interactionAgentPool.js`

## 规则摘要

| 市场 | 账号池 | 默认行为 |
| --- | --- | --- |
| `zh` | `X_INTERACTION_AGENT_POOL`（现有五个账号均已标记 `market: zh`） | 与改版前一致：关注要求资料含汉字；评论/点赞不额外筛帖文语言 |
| `en` | `X_INTERACTION_AGENT_POOL_EN`（新英文号只加在此） | 关注要求资料为英文（有拉丁字母且无 CJK）；评论首页/大V/评论回复跳过 CJK 帖文；AI 全英文 prompt/user 话术；含 CJK 的生成结果拒绝发送；发帖任务为 **EN发帖**（`poster-en`），从 Hacker News / BBC 等英文源取材，不走知乎/头条热点；**评论大V / 关注候选** 不走 xbangdan 中文榜，优先当天英文首页发现，回退 `lib/interaction/kolSources.js` 的英文内置组（改后跑 `npm run interaction:sync-kol-sources`） |

不在任一侧池内的登录账号：`resolveMarket` 回退为 `zh`（兼容私人号沿用中文规则）。

## 扩展如何识别

1. 读取当前 `@handle`。
2. `interactionAgentPool.js` 查池 → `market`。
3. 顶栏显示「账号 · 市场标签（池内）」。
4. 评论生成请求带 `interactionMarket` 给后台 prompt 选择。

## 新增英文账号

当前英文池试点：`Lantern Vale` · `@mHCncHeboklldif`（英区首个 EN 智能体）。

1. 在 `X_INTERACTION_AGENT_POOL_EN` 追加 `{ name, handle, market: 'en' }`。
2. 运行 `npm run interaction:sync-agent-pool`。
3. 新 Chrome 配置文件登录该 handle，重装/重载扩展。

## 暂不做

- 英文版独立扩展 ID 或单独站点入口（仍同一插件）。
- 英文区第三方公开榜单 API（当前 EN 榜为空，只靠发现 + 内置组；后续可接独立英文榜 URL）。
- 英文长文 / 卡片精品帖（`poster-premium` 等中文形态在 EN 账号侧隐藏）。