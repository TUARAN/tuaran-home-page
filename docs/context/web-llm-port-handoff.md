# Web LLM 1:1 移植手册（跨站点复用）

> 这份文档是给「另一个 Claude Code session / 另一个网站仓库」用的迁移指南。
> 目标：把本机参考项目 `/Users/tuaran/Documents/GitHub/webllm` 1:1 集成进任意 Next.js App Router 站点，**不要做复杂改造**。
> 直接把这份文档贴给新 session 当初始上下文即可。

---

## 0. 一句话目标

> 把 `/Users/tuaran/Documents/GitHub/webllm`（vanilla JS + Vite + 原生 DOM 的 WebGPU LLM demo）原样搬进当前 Next.js 站点的 `/web-llm` 路由，**保持它的 UI 与交互完全一致**，不要按 React 习惯做状态拆分、能力增强或站点上下文注入。

---

## 1. 强制原则（先看这条，别绕过去）

1. **JSX 镜像 `index.html`，逻辑放在 `useEffect` 里搬 `src/main.js`。**
   不要把 `main.js` 拆成 `useState / useReducer / 多个 hook / lib/runtime / lib/sessionStore`。整套交互依赖直接 DOM 操作（`getElementById` + `appendChild` + `innerHTML`），就让它继续这样。
2. **CSS 全部以根级 ID 作前缀引入，不要改样式。**
   原始 `* { margin:0; padding:0 }` 和 `body { background: ... }` 在 Next.js 里会污染整站，必须用一个根级 id（推荐 `#web-llm-app-shell`）作前缀；除此之外不要改任何视觉规则。
3. **不要拓展模型菜单。**
   只保留参考项目原有的三个：
   - `onnx-community/Qwen3.5-0.8B-ONNX`
   - `onnx-community/Qwen3.5-2B-ONNX`
   - `onnx-community/Qwen3.5-4B-ONNX`
   不要加 `Qwen2.5-0.5B-Instruct` 那种「文本快版」，已经验证过它会让代码出现两套 runtime 分支并复杂化集成。
4. **不要注入站点 system prompt。**
   不要写 `siteContext.js` 或类似的「把站点摘要塞进对话」逻辑。已经验证过模型回答会变畸形（更短、更套路、跑题）。要做这件事请单独立项。
5. **不要换 IndexedDB schema。**
   保留参考项目的 `DB_NAME = 'QwenChatDB'` / `STORE_NAME = 'chats'` / 主键 `Date.now()`。不要改成 `tuaran-web-llm / sessions` 那套，迁移时主键冲突几率小，但「行为对齐」比「命名好看」重要。
6. **不要加额外的 UI 元数据。**
   不要在消息上加 stage/timings/firstTokenMs/preprocessMs 这些字段。原版只显示 `速度: N tokens/s`，就让它只显示这个。
7. **环境诊断按参考项目语义来。**
   - `WebGPU 不可用` → 提示 + 不让加载
   - `非安全上下文` → 提示
   - `crossOriginIsolated 未启用` → 仅作为提示，**不要当成按钮硬门槛**
   已经验证过：把 `crossOriginIsolated` 当硬门槛会导致按钮无法点击。

---

## 2. 必要的宿主侧适配（这部分允许改）

下列变更**不是行为改动，是 Next.js 宿主必须的包装层**：

| 改动 | 为什么 |
| --- | --- |
| `'use client'` 顶部声明 | App Router 默认 server component，必须显式标客户端 |
| `await import('@huggingface/transformers')` 替代静态 import | 避免 SSR/构建期触发 ONNX/WASM 模块加载 |
| `useRef(false)` 守卫 useEffect 重复执行 | React StrictMode + fast refresh 会双跑 effect |
| `id="app-shell"` → `id="web-llm-app-shell"` | 避免和站点其它路由的潜在 ID 冲突 |
| CSS 所有规则前缀 `#web-llm-app-shell` | 避免 `*` 重置和 `body` 背景污染整站 |
| `@keyframes rise-in` → `web-llm-rise-in` | 避免和站点其它动画重名 |
| JSX 用 `defaultValue`（select）/`style={{display:'none'}}`（file input）| React 语法限制 |
| `<img>` 初始不写 `src` 属性，由 JS 直接 `previewImg.src = ...` | 否则 Next dev 会报「empty string passed to src」警告 |
| `resetPreview` 用 `previewImg.removeAttribute('src')` 而不是 `= ''` | 同上，并避免触发空请求 |
| `next.config.js` 给 `/web-llm/:path*` 配 COOP/COEP header | WebGPU + ONNX 需要 cross-origin isolation |
| 站点 `LayoutChrome` 把 `/web-llm` 加进 `HIDE_CHROME_PATHS`（如果站点有的话）| 参考项目是整屏 sidebar+main 布局，叠在站点 header 上会很怪 |

---

## 3. 文件结构（落到目标仓库长这样）

```
app/web-llm/
  page.jsx                ← 服务端壳，仅声明 metadata，渲染 <WebLlmPageClient />
  WebLlmPageClient.jsx    ← 唯一客户端组件：JSX = index.html，useEffect = main.js
  webllm.css              ← src/styles.css 的内容，所有规则前缀 #web-llm-app-shell
  embed/page.jsx          ← 复用同一组件，给 iframe 嵌入用，metadata 加 robots: noindex
```

```
next.config.js
  → headers(): /web-llm/:path*  和  /web-llm/embed/:path*  设置 COOP/COEP

ai-context/web-llm-1to1-port.md   ← 在新仓库里复制一份本仓库的同名文件作为内部记录
```

如果站点已有「全局浮动按钮 + iframe 模态」的入口需求，再加：

```
app/components/WebLlmModal.jsx   ← iframe 指向 /web-llm/embed
```

---

## 4. 关键代码骨架（直接照抄）

### 4.1 `next.config.js` headers

```js
const webLlmHeaders = [
  { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
]

async headers() {
  return [
    { source: '/web-llm/:path*', headers: webLlmHeaders },
    { source: '/web-llm/embed/:path*', headers: webLlmHeaders },
  ]
}
```

### 4.2 `app/web-llm/page.jsx`

```jsx
import WebLlmPageClient from './WebLlmPageClient'

export const metadata = {
  title: '大模型问答',
  description: '在浏览器端通过 WebGPU 加载 ONNX 大模型，并完成本地会话与流式对话。',
  alternates: { canonical: '/web-llm' },
}

export default function WebLlmPage() {
  return <WebLlmPageClient />
}
```

### 4.3 `app/web-llm/embed/page.jsx`

```jsx
import WebLlmPageClient from '../WebLlmPageClient'

export const metadata = {
  title: '大模型问答',
  alternates: { canonical: '/web-llm' },
  robots: { index: false, follow: false },
}

export default function WebLlmEmbedPage() {
  return <WebLlmPageClient />
}
```

### 4.4 `app/web-llm/WebLlmPageClient.jsx` 骨架

```jsx
'use client'

import { useEffect, useRef } from 'react'
import './webllm.css'

const MODEL_OPTIONS = {
  'onnx-community/Qwen3.5-0.8B-ONNX': { label: 'Qwen3.5-0.8B-ONNX', notes: '...' },
  'onnx-community/Qwen3.5-2B-ONNX': { label: 'Qwen3.5-2B-ONNX', notes: '...' },
  'onnx-community/Qwen3.5-4B-ONNX': { label: 'Qwen3.5-4B-ONNX', notes: '...' },
}
const DB_NAME = 'QwenChatDB'
const STORE_NAME = 'chats'

export default function WebLlmPageClient() {
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    let disposed = false

    // ↓↓↓ 这里把参考项目 src/main.js 几乎逐行搬进来 ↓↓↓
    // - 所有 import { ... } from "@huggingface/transformers"
    //   改成 const { ... } = await import('@huggingface/transformers')
    //   放进 init() / loadModel() / buildConversationAndImages() / ensureStreamerCtor()
    // - DOMTextStreamer 类放在 ensureStreamerCtor() 里第一次用时再 new
    //   （因为它继承 TextStreamer，得等模块 import 完）
    // - 所有 getElementById 直接调用 JSX 里渲染好的 ID
    // - 不要加 React 状态、不要加 stage/timings、不要注入 system prompt
    // ↑↑↑

    return () => { disposed = true }
  }, [])

  return (
    <div id="web-llm-app-shell">
      {/* ← 这里把参考项目 index.html 里 #app-shell 子树照抄成 JSX → */}
      {/* 唯一改动：根 id 改名 + JSX 语法适配（defaultValue / style={{}} / 闭合等）*/}
    </div>
  )
}
```

### 4.5 `app/web-llm/webllm.css`

直接复制 `/Users/tuaran/Documents/GitHub/webllm/src/styles.css`，**所有选择器前面加 `#web-llm-app-shell`**：

- `* { ... }` → `#web-llm-app-shell *, #web-llm-app-shell *::before, #web-llm-app-shell *::after { ... }`
- `body { ... }` → `#web-llm-app-shell { ... }`（注意不要把 `body` 选择器留下）
- `#sidebar { ... }` → `#web-llm-app-shell #sidebar { ... }`
- `.chat-item { ... }` → `#web-llm-app-shell .chat-item { ... }`
- `@keyframes rise-in` → `@keyframes web-llm-rise-in`，对应 `animation: ...` 也要改
- 媒体查询里的所有规则同样前缀

---

## 5. 依赖

目标仓库 `package.json` 需要：

```json
{
  "dependencies": {
    "@huggingface/transformers": "next"
  }
}
```

`next` 是 dist-tag，对应 transformers.js 的下一代版本，必须用这个，参考项目就是它。

---

## 6. 验收清单（拷给另一个 session 当 test plan）

1. 用 Chrome / Edge 打开 `http://localhost:3000/web-llm`
2. 页面是「整屏 sidebar + main」布局，没有站点 header 叠加
3. select 默认选中 `Qwen3.5-0.8B-ONNX`，点「加载模型」弹模态框
4. 模态框显示「下载中... N%」并且 `<progress>` 条往前走
5. 加载完成后底部输入框可输入，Enter 发送
6. 模型流式吐字，结束后右下角显示 `速度: N tokens/s`
7. 上传图片 → 输入框上方出现预览缩略图 + 红色 ✕ 按钮
8. 发送带图问题，模型有图文回复
9. 左侧「+ 新建对话」可建新会话；点击历史会话能切回；hover 显示「删除」
10. 关页面、重开，历史会话从 IndexedDB 恢复
11. 浏览器 console 没有「empty string passed to src」警告
12. 如果站点配置了 iframe 入口（`/web-llm/embed`），同样路径走一遍

---

## 7. 反模式（看到就要警觉）

如果新 session 写出了下面任何一种代码，立刻停下来对照本文档：

- `useState / useReducer` 用来管理 chatHistory、loadProgress、isModelReady 等
- `lib/runtime.js` 把模型加载、推理、streamer 封装成 React 友好的 API
- `lib/sessionStore.js` 把 IndexedDB 拆成独立模块
- `lib/siteContext.js` 把站点摘要拼进 system prompt
- 在消息对象里塞 `stage / timings / firstTokenMs / decodeMs / totalMs`
- 把 `crossOriginIsolated` 写进按钮 `disabled` 的判断
- 模型菜单里出现 `Qwen2.5-0.5B-Instruct` 或其它「文本快版」
- 用 `MAX_NEW_TOKENS = 384`（参考项目是 512）
- 用 Next.js `<Image />` 替代原生 `<img>`（preview 和聊天里的图都用原生）
- IndexedDB 用 `'tuaran-web-llm' / 'sessions'`（不是参考项目的名字）

---

## 8. 给新 session 的开场白模板

> 把本机 `/Users/tuaran/Documents/GitHub/webllm` 这个独立 demo 1:1 集成到当前 Next.js 站点 `/web-llm` 路由。
>
> **强制要求**：
> - JSX 直接镜像 `index.html`，所有逻辑放在一个 `useEffect` 里、几乎逐行搬运 `src/main.js`，不要拆成 React 状态/hooks/lib/。
> - CSS 复制 `src/styles.css`，所有规则统一加 `#web-llm-app-shell` 前缀，避免污染整站。
> - 不要扩展模型菜单、不要注入站点 system prompt、不要改 IndexedDB schema、不要给消息加 stage/timings 元信息。
> - 详细规范见这份文档：`ai-context/web-llm-port-handoff.md`，请先完整读一遍再动手。
>
> 完成后写一份 `ai-context/web-llm-1to1-port.md` 记录本仓库的实际落地情况。
