# /web-llm 1:1 移植记录

## 1. 为什么重做

之前 `/web-llm` 是「按 Next.js 风格重写的集成版」：
- 页面拆成 `WebLlmPageClient.jsx` + `lib/constants.js` + `lib/runtime.js` + `lib/sessionStore.js` + `lib/siteContext.js`
- React 状态机管理会话、消息、加载进度，自带 stage/timings/tps 元信息
- 注入站点上下文 `siteContext.js`，让模型偏向回答 tuaran 站内问题
- 引入 `LIGHT_TEXT_MODEL_ID` 这种参考项目里没有的纯文本快版
- 结果就是与参考项目 `/Users/tuaran/Documents/GitHub/webllm` 的实际行为已经差得很远，问答效果也不稳

这次决定不再「按 React 习惯翻译」，直接把参考项目的 `index.html + main.js + styles.css` 1:1 搬进来。

## 2. 当前文件结构

```
app/web-llm/
  page.jsx                ← 服务端壳，只声明 metadata
  WebLlmPageClient.jsx    ← 1:1 移植后的唯一客户端组件
  webllm.css              ← 1:1 移植自参考项目 src/styles.css
  embed/page.jsx          ← 复用同一组件，仅给 iframe 用
```

`lib/` 目录已整体删除（`constants.js / runtime.js / sessionStore.js / siteContext.js` 全部不要了）。

## 3. 与参考项目的对应关系

| 参考项目 (`/Users/tuaran/Documents/GitHub/webllm`) | 本仓库 |
| --- | --- |
| `index.html` 的 `#app-shell` 子树 | `WebLlmPageClient.jsx` 的 JSX 部分 |
| `src/main.js` 全部模块作用域逻辑 | `WebLlmPageClient.jsx` 的 `useEffect` 内部 |
| `src/styles.css` 全部规则 | `app/web-llm/webllm.css` |
| `vite.config.js` 的 COOP/COEP | `next.config.js` 已有的 `/web-llm/:path*` headers |
| `vite dev` 启动 | `next dev`（路由 `/web-llm`） |

## 4. 这次允许的最小偏离（不是行为改动，是宿主适配）

为了能在 Next.js App Router 里跑，做了这些纯包装层修改，没动业务逻辑：

1. `id="app-shell"` → `id="web-llm-app-shell"`
   原始 `app-shell` 命名太通用，避免和站点其它路由的潜在 ID 冲突。CSS 选择器同步改名。
2. CSS 全部加 `#web-llm-app-shell` 前缀
   原始 `* { margin: 0; padding: 0; box-sizing: border-box }` 和 `body { background: ... }` 在 Next.js 下会污染整站，改为根级前缀；`@keyframes rise-in` 也改名 `web-llm-rise-in` 防止和站点其它动画重名。
3. 客户端 import 全部走 `await import('@huggingface/transformers')`
   `'use client'` + 动态 import，确保权重相关模块永远不会跑到 SSR/构建期。
4. `useEffect` + `initializedRef.current` 守卫
   防止 React StrictMode / fast refresh 重复绑定 `addEventListener`。
5. `LayoutChrome.jsx` 把 `/web-llm` 也加进 `HIDE_CHROME_PATHS`
   参考项目是整屏 `min-height: 100vh` 的 sidebar+main 布局，叠在站点 header 上会很怪，所以直接整屏接管。`/web-llm/embed` 早就在白名单里，这次只是对齐。
6. JSX 用 `defaultValue`（select）、`style={{ display: 'none' }}`（file input）
   是 React 语法限制，不是行为差异。

## 5. 显式恢复的「参考项目原貌」

下列以前被「集成版」改掉的地方，这次回退到参考项目原值：

- 模型菜单只剩 3 个选项：
  - `onnx-community/Qwen3.5-0.8B-ONNX`
  - `onnx-community/Qwen3.5-2B-ONNX`
  - `onnx-community/Qwen3.5-4B-ONNX`
  之前的 `Qwen2.5-0.5B-Instruct` 文本快版整体移除。
- IndexedDB 用回参考项目的 `QwenChatDB / chats`，主键就是 `Date.now()`，不再加 `tuaran-web-llm / sessions` 那套。
- 不再注入站点 system prompt（`siteContext.js` 已删）。模型回答行为完全由用户输入决定。
- `max_new_tokens = 512`（参考项目原值），不再用 `MAX_NEW_TOKENS = 384`。
- 推理 streamer 直接用 `TextStreamer.put / on_finalized_text`，不再有 React 用的 rAF 批量化、stage/timings/tps 对象、isAssistantPending UI 等额外抽象。
- 进度条/模态框样式与文案与参考项目一致：
  - `加载模型中` / `正在初始化...` / `下载中... N%` / `加载至 WebGPU... 这可能会需要一段时间`
- 错误反馈用原版 `alert(...)` + `setRuntimeNotice('error', ...)`，不再做单独的 `loadError` 区域和拼接 diagnostic 文案的额外 UI。

## 6. 保留下来的宿主侧依赖

下面这些不是参考项目内容，但是本仓库的部署/导航需求，必须留：

- `next.config.js` 里 `/web-llm/:path*` 和 `/web-llm/embed/:path*` 的 COOP/COEP header
  WebGPU + ONNX 在 Next.js 里仍然需要 cross-origin isolation，否则同样会退化。
- `app/web-llm/embed/page.jsx`
  `WebLlmModal.jsx` 在站点其它页面用 iframe 嵌入 `/web-llm/embed`，所以这个壳必须存在；它直接复用同一个 `WebLlmPageClient`。
- `app/components/WebLlmModal.jsx`
  全局浮动按钮 + iframe 入口，未改。
- `app/sitemap.js` 中 `/web-llm` 条目，未改。

## 7. 维护守则

后续再有人想给 `/web-llm` 加东西，先按这个顺序判断：

1. 想加的功能在参考项目 `/Users/tuaran/Documents/GitHub/webllm` 里有没有？
   - 有 → 优先用参考项目的实现路径；
   - 没有 → 默认拒绝。除非有明确产品需求，否则不加。
2. 想用 React 状态/分层「优化」？不要。
   这就是这次回退的根因。整套交互是基于 DOM 直接操作 + IndexedDB 的，不要再拆 hook/lib。
3. 想加站点上下文注入回来？需要单独评估。
   旧版的 `siteContext.js` 让模型回答畸形（被引导后输出更短、更套路、甚至跑题），这次刻意拿掉，要回归请单独立项。
4. 想加更多模型？
   可以在 `MODEL_OPTIONS` 里追加，但要对齐参考项目的格式：仅 `label / notes` 两个字段，不要再回到 `runtimeType / supportsImage` 那套。
5. 改 CSS？
   规则继续放在 `webllm.css`，所有选择器必须以 `#web-llm-app-shell` 开头。新动画名要带 `web-llm-` 前缀。

## 8. 既往文档关系

`ai-context/web-llm-integration-notes.md` 是上一版集成思路的记录，里面强调的「不要机械照抄参考项目」结论已经被这次重做覆盖。两份文档都保留，作为演进史；判断当前行为时以本文件为准。
