# DeepSeek 密钥管理

更新日期：2026-08-06

## 目标

把「哪个 key 值、用于哪些任务、调用记录」统一到后台可视化管理，替代单一环境变量的黑盒模式。

## 数据模型

`deepseek_keys` 表（迁移 `0059_deepseek_keys.sql`）：

| 字段 | 说明 |
|---|---|
| `id` | UUID 主键 |
| `name` | 密钥名称（后台展示） |
| `key_hint` | 掩码，如 `sk-a****5678`，只保留首尾各 4 位 |
| `key_cipher` | AES-GCM 密文 payload `{v, iv, data}`，主密钥 `DEEPSEEK_KEYS_ENC_SECRET` |
| `base_url` / `default_model` | 可选，覆盖调用层默认值 |
| `status` | active / disabled（停用不删除，保留历史） |
| `bound_tasks` | JSON 绑定数组：`[{source, taskType}]` |
| `last_used_at` / `used_count` | 使用统计 |

调用记录表 `deepseek_tasks` 新增 `key_id` / `key_name` 列，每次调用落台账时记录所用密钥。

## 解析优先级

`resolveDeepSeekKey` 按任务匹配：

1. 精确绑定：`source` + `taskType` 都匹配；
2. source 绑定：`taskType` 留空；
3. 全局兜底：`bound_tasks` 为空数组；
4. 环境变量默认密钥 `DEEPSEEK_API_KEY`（兼容旧部署）。

## 后台

- `/admin/deepseek-tasks`：新增「密钥管理」标签页，支持新增 / 编辑 / 停用 / 查看调用，
  密钥输入框默认隐藏明文；「调用记录」标签页可按密钥过滤，任务行显示所用密钥。
- `/api/admin/deepseek-keys`：GET 列表（只回掩码与统计）、POST 新增、PATCH 更新（Key 留空不变）、
  DELETE 软停用。
- `/api/admin/deepseek-tasks`：GET 支持 `key` 过滤参数。

## 上线步骤

1. 应用迁移：`npx wrangler d1 execute tuaran-me --remote --file=migrations/0059_deepseek_keys.sql`
2. Cloudflare Pages Secret 增加 `DEEPSEEK_KEYS_ENC_SECRET`（任意长度随机串；用于派生 AES-256 密钥）。
   配置前数据库密钥功能不可用，调用回退环境变量默认密钥，不影响线上。
3. 在后台新增数据库密钥并绑定任务；旧密钥可继续留在 `DEEPSEEK_API_KEY` 作兜底。

## 安全边界

- 任何接口都不返回完整 Key 或密文；台账不落完整 Prompt。
- 解密只在 Edge 调用层发生，不写入日志。
- 停用密钥不删除行，调用历史通过冗余 `key_name` 保持可读。
