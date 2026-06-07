---
title: 用 cc-switch 在 Codex 中接入 DeepSeek
category: topics
date: 2026-06-06
tags: [Codex, DeepSeek, cc-switch, 大模型, 工具链]
summary: Codex CLI 用的是 Responses API，DeepSeek 只提供 Chat Completions —— cc-switch 用本地路由做协议翻译，把两边接上。配置不复杂，但启动期间有几个坑会让 Codex 直接起不来。
tldr: cc-switch 在本机 127.0.0.1:15721 起一个网关，把 Codex 发的 `/responses` 请求拦下来翻成 DeepSeek 的 `/chat/completions`，再把响应回译回去。Codex 端只改 `config.toml`，真实 API Key 由 cc-switch 注入。需要 cc-switch ≥ 3.16，且改完 provider 后 `auth.json` 也会被覆盖，回退要一起回。
topic_type: tech
assistance: codex
model: claude-opus-4-7
---

## 一、是什么

[cc-switch](https://github.com/farion1231/cc-switch) 是一个开源、免费的桌面端 GUI，定位是 Claude Code / Codex / Gemini CLI / OpenCode 等命令行 AI 编程工具的"统一切换器"。官方网址只有一个：[ccswitch.io](https://ccswitch.io)（其它收费/索要登录凭证的仿冒站都是假的）。

它原本的核心功能是替你管理多份配置文件 —— 切换 Claude Code 的 API Provider 时，不用手动改 `~/.claude` 下的 settings，点一下 GUI 就完事。从 **v3.16** 开始，cc-switch 多了一个对 Codex 用户特别关键的能力：**内置本地路由（local routing）**，可以把 Codex 的 Responses API 协议在本机翻译成其它厂商（DeepSeek、智谱、通义……）的 Chat Completions 协议，从而让 Codex 直接用第三方模型跑。

在 cc-switch 自己实现本地路由之前，社区一直用一个独立项目 **ccx** 干同样的活；现在 cc-switch 把 ccx 的能力内置了，整条链路只需要一个 GUI 即可。

## 二、为什么重要

直接说痛点：

1. **Codex CLI 没法用 DeepSeek 的 Chat 协议。** Codex 在最近的版本里已经不再支持 `wire_api = "chat"`，启动时会直接报错 `is no longer supported. set wire_api = "responses"`。但 DeepSeek 官方的 OpenAI 兼容端点只实现了 `/chat/completions`，并不提供 `/v1/responses`。两边碰头就是死锁。
2. **想省钱 / 想用国产模型 / 想要长上下文** 的 Codex 用户没有"直连"路径，必须中间塞一个协议翻译层。
3. 自己写 OpenAI Responses ↔ Chat Completions 的适配器并不轻松：需要处理 streaming SSE、工具调用、reasoning summary、`output_text` 拼装等若干细节。cc-switch 把这一层产品化了。

对个人用户而言，意义是：花 0 元从 DeepSeek 充值的几块钱里跑 Codex，而不需要 ChatGPT 订阅。

## 三、关键玩家与生态

| 组件 | 角色 | 备注 |
|---|---|---|
| Codex CLI / Codex 桌面 | 前端 | 读取 `~/.codex/config.toml` 与 `~/.codex/auth.json` |
| cc-switch | GUI + 本地网关 | v3.16+ 内置 local routing，默认监听 `127.0.0.1:15721` |
| ccx | 旧版本独立网关 | 协议翻译器；cc-switch 3.16 之后可以不用了 |
| cc-switch-cli | CLI 版 | [SaladDay/cc-switch-cli](https://github.com/SaladDay/cc-switch-cli)，无 GUI 环境下的替代 |
| cc-switch-web | Web 版 | [Laliet/cc-switch-web](https://github.com/Laliet/cc-switch-web) |
| DeepSeek API | 后端模型 | base URL：`https://api.deepseek.com`，目前只兼容 OpenAI Chat Completions |

cc-switch 自身的预设清单里目前覆盖了 44 个 provider（从 Claude Code 的官方 catalog 翻译过来的），DeepSeek 是其中之一。

## 四、工作原理：四阶段路由

cc-switch 的本地路由把整个链路切成四段：

1. **配置改写**：cc-switch 自动改写 `~/.codex/config.toml`，把 `base_url` 指向 `http://127.0.0.1:15721/v1`，把 `wire_api` 锁定为 `"responses"`。
2. **格式标记**：在 Provider 元数据里写上 `meta.apiFormat = "openai_chat"`，告诉网关上游真实形态是 Chat Completions。
3. **请求转发**：网关拦截 `POST /v1/responses`，根据上一步的标记把请求体翻译成 `POST /v1/chat/completions`，注入真实的 DeepSeek API Key 与真实 base URL，转发到 `https://api.deepseek.com`。
4. **响应回译**：DeepSeek 返回的 Chat 格式响应（含 streaming chunk）重新组装成 Codex 期望的 Responses 格式（`output`、`output_text`、`usage` 等字段）。

几个值得注意的设计取舍：

- **真实 API Key 只存在 cc-switch 自己的 provider 配置里**，不会写到 `config.toml`。Codex 端拿到的是路由地址而非密钥 —— 误传配置文件出去也不会泄露 key。
- **wire_api 必须是 `responses`**：因为 Codex 客户端只会按这个协议构造请求，网关也只会拦这个路径。
- **模型映射在 GUI 中完成**：DeepSeek 预设里自动填好 `deepseek-chat`、`deepseek-reasoner`、`deepseek-v4-flash`、`deepseek-v4-pro` 等 model slug，Codex 端通过 `model_catalog_json` 引用。

## 五、最小配置示例

按官方文档与社区教程归并出来的最小工作集：

**Codex 侧（`~/.codex/config.toml`，由 cc-switch 自动接管）：**

```toml
model_provider = "deepseek"
model = "deepseek-chat"
disable_response_storage = true
model_catalog_json = "cc-switch-model-catalog.json"

[model_providers.deepseek]
name = "DeepSeek"
base_url = "http://127.0.0.1:15721/v1"   # 指向 cc-switch 本地路由
wire_api = "responses"                    # 必须 responses，不能 chat
requires_openai_auth = true
```

**cc-switch 侧：**

1. 设置 → 路由 → 打开"本地路由总开关"，确认服务在 `127.0.0.1:15721` 起来
2. "路由启用"里勾上 **Codex**
3. Provider 列表选 DeepSeek 预设，只填 API Key 保存
4. 重启 Codex 进程（重新加载 `model_catalog_json`）
5. 进 Codex 用 `/model` 命令确认当前模型来自 DeepSeek 预设

环境建议：把 `API_TIMEOUT_MS` 调到 `3000000`（50 分钟），DeepSeek 长任务延迟比 OpenAI 高，原默认超时会被拉断。

## 六、踩坑实录（本机亲测，2026-06-06）

不是抄来的，是这次自己装上又卸下来的：

1. **`wire_api = "chat"` 直接让 Codex 起不来。** 报错原文：`/Users/tuaran/.codex/config.toml:13:12: wire_api = "chat" is no longer supported. How to fix: set wire_api = "responses". More info: https://github.com/openai/codex/discussions/7782`。如果是按老教程或老版本 cc-switch 配的 provider，会卡在这里 —— 必须更新到 cc-switch 3.16+，让它用 responses 协议 + 本地翻译。
2. **`model_catalog_json` 缺字段也会让 Codex 起不来。** Codex 新版本要求 catalog 里每个 model 必须有 `supported_reasoning_levels` 字段，老版 cc-switch 写的 catalog 没这个字段，直接报 `missing field supported_reasoning_levels at line 1 column 264`。最快解决：在 `config.toml` 里把 `model_catalog_json` 这行删掉，让 Codex 回退到内置 catalog；想保留自定义 model 名再补字段。
3. **回退 provider 时 `auth.json` 也要一起回。** cc-switch 切换 provider 时会同时改写 `~/.codex/auth.json`（把真实 key 写进 `OPENAI_API_KEY` 字段，或换成路由用的占位 key），但会留下备份 `auth.json.bak-cc-switch-*-时间戳`。如果只回退 `config.toml` 而没回退 `auth.json`，Codex 会拿着 DeepSeek 的 key 去打 `api.openai.com`，返回 `401 Unauthorized: Incorrect API key provided`。
4. **Codex 桌面 app 暂时不支持多模型自由切换。** 默认只用配置里第一个模型，需要切就改配置重启。
5. **不要拿官方 OpenAI 账号走本地路由。** 路由会把请求改写后发到第三方，理论上 OpenAI 账号 key 会被 cc-switch 看到 —— 个人电脑可信但仍是不必要的暴露面。

## 七、争议与风险

- **协议翻译有损耗**：Responses API 里的 reasoning trace、tool-call 结构、`output_text` 拼装在翻译过程中是有损的。Codex 看到的"思考过程"不是 DeepSeek 原生的，而是网关组装出来的近似形态。复杂 agent 任务可能比直连 OpenAI 表现差一截。
- **本地路由 = 本地中间人**：所有请求/响应都过 cc-switch 一遍。开源代码可审，但默认信任的前提是你跑的是从官方仓库构建的版本。仿冒站点已经出现过 —— 一定从 `farion1231/cc-switch` 装。
- **DeepSeek 不在 Codex 官方支持矩阵里**：未来 Codex 协议升级（比如 Responses v2、新增字段），cc-switch 的翻译层需要跟着更新。版本断层时会有几天到几周的不可用窗口。
- **不适合生产工作流**：API Key 储存、配置改写、自动重启都是 GUI 控制，没有 IaC / 配置版本管理。团队场景建议用直连或自建网关。

## 八、个人结论

- **一句话定性**：cc-switch + DeepSeek 是当前个人用户在 Codex 里用上国产长上下文模型的最低摩擦路径，但代价是引入一个本机网关 + 接受协议翻译有损。
- **是否值得跟进**：值得，作为"备用 provider"配在 cc-switch 里随用随切；不建议作为日常默认，特别是涉及复杂 agent / 工具调用的任务。
- **下一步行动**：
  - 维护一份 `~/.codex/config.openai.toml` 与 `~/.codex/config.deepseek.toml` 双配置，写两个 shell alias 来切，绕开 cc-switch 直接动 live 文件的副作用
  - 关注 cc-switch CHANGELOG，每次升级前检查路由器是否兼容当前 Codex 版本
  - 等 DeepSeek 官方上线原生 Responses API 后，直接 `base_url = "https://api.deepseek.com"` 去掉本地路由

## 九、信息来源

- [farion1231/cc-switch（官方仓库）](https://github.com/farion1231/cc-switch)
- [cc-switch 官方网站 ccswitch.io](https://ccswitch.io)
- [Codex 接入 DeepSeek 官方路由指南](https://github.com/farion1231/cc-switch/blob/main/docs/guides/codex-deepseek-routing-guide-zh.md)
- [SaladDay/cc-switch-cli](https://github.com/saladday/cc-switch-cli)
- [Laliet/cc-switch-web](https://github.com/Laliet/cc-switch-web)
- [JaguarJack：CC Switch 本地路由让 Codex CLI 接入 DeepSeek](https://www.cnblogs.com/catchadmin/p/20247257)
- [Codex 升级后 `wire_api = "chat"` 不再支持的 GitHub Discussion #7782](https://github.com/openai/codex/discussions/7782)
- 本机实测：2026-06-06 在 macOS 上回退 cc-switch 改写过的 Codex 配置
