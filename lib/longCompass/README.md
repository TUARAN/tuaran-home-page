# `lib/longCompass`

长期罗盘的端到端加密 isomorphic 模块层。**所有加密 / 解密 / schema 操作的唯一来源**。

## 模块图

```
crypto.js        Web Crypto API 包装：encryptPayload / decryptPayload / isValidEnvelope
schema.js        明文 payload 形状：KINDS / migrate / validatePlain
api.js           客户端 fetch：fetchEncryptedRecords
loans.js         从已解锁表格提取贷款快照、本金分位计算、分析材料
index.js         统一导出
```

## 两层版本号

| 维度 | 谁管 | 当前 | 何时 +1 |
|---|---|---|---|
| envelope 版本 (`payload.v`) | `crypto.js` | 1 | 换算法 / 改 KDF / 加 AAD |
| plain schema 版本 (`plain.schemaVersion`) | `schema.js` | 2 | 加字段 / 改字段语义 |

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

## 负债管理 / 贷款快照

继续使用 v2 的 Markdown content，不增加明文字段或写入 API。负债管理只读取解锁后的资产快照；每次选择一份完整盘点，不累加不同日期的同一笔贷款。

识别契约（表头须完全一致）：

- 元数据：`快照日期`（YYYY-MM-DD）、可选的 `原图加权年化`、`原图预计月供(元)`。
- 唯一的贷款表：`机构/产品`、`原始本金(元)`、`待还本金(元)`、`年化估算`、`状态`；可加 `借款日期`、`还款方式`、`剩余期数`、`备注`。
- 可选计划表：`计划月份`、`原图计划金额(元)`、`原图项目`。仅作未核实的原图摘录。

本金按整数分计算，金额最多两位小数；不能识别的金额保留为空并暂停汇总。余额加权年化排除零余额贷款，仍是原表利率的算术估算，不是合同实际 APR。历史图表模块保持原来的整元口径。

大模型功能当前为可审阅、可复制的分析材料，默认隐藏机构名，但金额仍为敏感数据。不调用模型，不保存到浏览器存储，不自动外发，不执行还款。完整原文保留当时策略，不从旧快照推断当前现金、净资产或到期日。

### 增量导入

把一个或多个 v2 原始记录放在 Git 忽略的 `private/` JSON 数组文件中（与 `private/long-compass-seed.json` 形状一致）：

```sh
node scripts/append-long-compass.mjs private/your-snapshot.json --validate-only
node scripts/append-long-compass.mjs private/your-snapshot.json
```

第二条命令在本地 TTY 无回显读取统一解锁口令。先解密验证现有罗盘、检测同标题同时间记录，然后仅追加密文并回读验证。不会重建、覆盖或删除历史记录；重复导入会跳过，内容冲突则拒绝。导入文件须自行并入本地原始种子以便恢复。远端操作需要已登录 Cloudflare 的 Wrangler；不要同时运行多个导入进程。SQL 临时文件仅含密文并限制权限。

导入工具会通过 `site_users` 把站长的历史 GitHub 身份解析为当前 `platform_id`，读写必须落在页面 API 使用的同一平台账号下；无法解析账号时直接中止，不回退到旧身份分区。

页面仍为站长鉴权后的只读界面。前端代码发布与私密数据导入是两件事；本地文件存在不等于线上已保存。
