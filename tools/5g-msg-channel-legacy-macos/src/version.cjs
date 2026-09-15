'use strict';

/**
 * version.cjs — 5g-msg-channel 连接器版本号（唯一来源）
 *
 * 升级流程：
 *   1) 改这里的 VERSION（语义化版本 semver）
 *   2) 同步更新 docs/CHANGELOG.md（如有）
 *   3) 重新分发安装包/更新 README 里的版本引用
 *
 * 版本历史：
 *   1.0.0  (2026-09-07) 初始版本：WS 复用参考包 cmicmaap 协议 + ACP 对接
 *          真实 WorkBuddy；日志模块独立；sessionId 持久化；模拟器 8066 联调
 */

const VERSION = '1.1.0';

module.exports = VERSION;
