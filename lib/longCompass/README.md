# `lib/longCompass`

长期罗盘的端到端加密 isomorphic 模块层。**所有加密 / 解密 / schema 操作的唯一来源**。

## 模块图

```
crypto.js        Web Crypto API 包装：encryptPayload / decryptPayload / isValidEnvelope
schema.js        明文 payload 形状：KINDS / migrate / validatePlain
api.js           客户端 fetch：fetchEncryptedRecords
index.js         统一导出
```

## 两层版本号

| 维度 | 谁管 | 当前 | 何时 +1 |
|---|---|---|---|
| envelope 版本 (`payload.v`) | `crypto.js` | 1 | 换算法 / 改 KDF / 加 AAD |
| plain schema 版本 (`plain.schemaVersion`) | `schema.js` | 1 | 加字段 / 改字段语义 |

迁移路径：
- `decryptPayload(envelope, pw)` → 拿到 plain
- `migrate(plain)` → 升到最新版（必要时改字段）
- React 组件渲染

## 为什么 isomorphic

浏览器（解锁）、Cloudflare Edge（API GET）、Node 20+（本地 `seed-to-d1.mjs`）
都需要做加密相关操作。它们的 Web Crypto API 与 `atob/btoa` 在三个 runtime
里都原生存在，所以本目录的所有文件都可以同时被三方 import，没有 polyfill。

## 增量规则

要给罗盘加新能力时按下面的优先级动文件：

1. **只是加字段** → 改 `schema.js`：`CURRENT_PLAIN_VERSION` +1，写 `migrate()` 分支
2. **加新 kind** → `KINDS / KIND_LABELS` 加一行，前端 tab 自动跟上
3. **加新 API（如分页 / 单条 fetch）** → 改 `api.js`，组件保持不变
4. **换加密算法** → 改 `crypto.js`：`envelopeVersion` +1，新旧分支共存一段时间
5. **完全新的内容形态**（如多块结构化 content）→ Tier 4，先升 schema、再做 UI 适配
