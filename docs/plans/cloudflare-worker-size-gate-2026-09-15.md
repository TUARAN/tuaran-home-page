# Cloudflare Worker 体积闸门改造计划

日期：2026-09-15

## 背景与结论

公共站与后台站已经通过独立构建减少互相污染，但现有校验仍把 gzip 体积作为平台硬限制：公共 Worker 达到 2.75 MiB、后台 Worker 达到 2.5 MiB 即失败。Cloudflare 当前实际限制按未压缩 Worker 体积计算，Free 与 Paid 均为 64 MiB，并明确说明 gzip 仅供参考，不是平台限制。

近期公共构建约为 11.3 MiB 未压缩、2.75 MiB gzip，距离平台限制尚远，却已经耗尽仓库自设的 gzip 预算。新增普通页面、路由元数据或构建压缩波动都可能触发失败，形成误报。

## 目标

1. 用未压缩体积守住 Cloudflare 平台风险。
2. 用相对基线识别异常增长，不再因微小波动阻断发布。
3. 保留 Public/Admin 隔离、必需路由和泄漏路由校验。
4. 每次构建输出机器可读报告与 Top 20 大文件，便于定位依赖或路由膨胀。
5. 为有意的大体积变更提供显式、可审阅的基线更新流程。

## 规则设计

- 平台限制：64 MiB 未压缩，仅用于报告依据。
- 仓库硬限制：48 MiB 未压缩，为平台保留 25% 余量。
- 回归警告：相对基线增加至少 128 KiB 时提示。
- 回归阻断：未压缩体积同时增加至少 512 KiB 且至少 5% 时失败。
- gzip：继续记录和比较，但只作诊断指标，不作为绝对平台闸门。
- 基线缺失：构建通过但发出警告，避免首次引入机制时锁死流水线。

## 实施步骤

1. 扩展 `scripts/worker-size.cjs`：输出 Top 20、生成 JSON 报告、计算相对路径。
2. 新建共享策略模块 `scripts/worker-size-policy.cjs`：集中维护平台限制、仓库限制及回归判断。
3. 新建 `scripts/worker-size-baselines.json`：分别保存 public/admin 的 raw 与 gzip 基线。
4. 新建 `scripts/update-worker-size-baseline.cjs`：只能显式指定 public 或 admin，根据最近构建报告更新基线。
5. 改造 public/admin verifier：统一调用共享策略，保留原有路由完整性检查。
6. 增加单元测试，覆盖硬限制、微小波动、警告、异常回归和基线缺失。
7. 分别执行专项测试、Public 构建、Admin 构建；根据成功产物写入初始基线，再复跑 verifier。

## 验收标准

- 2.75 MiB gzip 不再直接导致 Public 构建失败。
- 未压缩体积达到 48 MiB 时构建失败。
- 小于 128 KiB 的波动正常通过。
- 增长至少 512 KiB 且至少 5% 时构建失败。
- Public/Admin 构建仍验证各自的路由边界。
- `.vercel/output/worker-size-<target>.json` 包含 totals、limits、delta 与 Top 20 文件。
- `npm run worker-size:baseline -- public|admin` 可以显式更新基线。

## 后续架构方向（不纳入本次改造）

- 将采集、内容解析、OG 生成等重功能拆成独立 Worker，通过 Service Binding 调用。
- 评估 vinext/OpenNext 迁移，但不把框架迁移与本次闸门修正绑定。
- `_routes.json` 继续用于减少不必要的 Function 调用；它不承担缩减 Worker 上传包的职责。

## 执行结果

状态：已完成

- Public 基线：11,754,005 bytes raw；2,882,587 bytes gzip；104 条 Edge 路由；仓库硬限制余量约 36.79 MiB。
- Admin 基线：7,368,881 bytes raw；2,070,560 bytes gzip；81 条 Edge 路由；仓库硬限制余量约 40.97 MiB。
- Public 与 Admin 均完成真实 Cloudflare Pages 构建；路由边界校验通过。
- 两个 verifier 在记录基线后复跑通过，delta 为 0，warnings 与 errors 均为空。
- 体积策略单元测试 5/5 通过；相关页面测试合并执行后总计 7/7 通过。
- 样式检查与 `git diff --check` 通过。
