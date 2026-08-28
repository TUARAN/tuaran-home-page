# WorkBuddy 换肤工坊：首版方案

日期：2026-08-28。按用户要求先规划、再实现；后续明确付款方式为直接展示收款码，不使用联系弹窗。

## 产品与范围

- 保留现有资源库和燃币权益，增加 `/skins/` 独立入口。
- ¥19.9 一次购买四套原创 CSS 主题、导入说明、恢复说明；不包含 WorkBuddy 会员、模型额度或无限期适配承诺。
- 原创主题：摸鱼办事处、班味清除器、宇宙旷工、周五永动机。不使用游戏角色、第三方壁纸或他人收款码。
- 使用 `comeonzhj/WorkBuddy-theme-skill` 的 Theme Manager 主题 ZIP 协议。管理器由用户从上游自行下载，不重新包装成自研软件。
- 上游 LICENSE 为 MIT（2026 comeonzhj），保留链接及版权通知。主题包以源代码形式交付，无 DRM 或防复制承诺。

## 付款与人工交付

1. 页面直接展示 ¥19.9 和主站已有微信收款码 `public/donate-wechat.jpg`，收款人 `tuaran(**燃)`。普通码需要买家手填金额。
2. 付款后添加微信 `atar24`，加好友码复用 `gptplus-site/qrcodewechat3.png`。两个码分别标明用途。
3. 提示“马上响应”；买家发送付款截图、付款时间、系统和 WorkBuddy 版本。仅复制沟通文本，不收集或上传个人信息。
4. 站长在微信支付账单核实真实到账金额和流水，再通过微信发送对应主题 ZIP 与安装说明。截图不作为唯一到账依据。
5. 不伪造支付成功、订单号、自动到账或自动发货。第一版无订单数据库和支付 API，无额外存储隐私风险。
6. 不提供尚未配置的支付宝选项。退款或适配问题通过同一微信处理，规则上线前由站长确认。

## 实现与验证

- 独立静态 HTML/CSS/JS，沿用现有 Worker assets 发布方式，不迁移架构、不修改资源 API。
- 主题包在静态目录外，构建到忽略目录 `dist/skin-packs/`，不公开托管付费 ZIP。
- 四套预览明确标注“设计预览”，不冒充 WorkBuddy 实机截图。
- 自动检查主题 scope、禁止脚本及外部 URL、原生控件保留、对比度、单主题 ZIP、价格和二维码一致性。
- 使用上游 `validate-theme.mjs` 和 `workbuddy-theme.mjs dry-run` 验证，记录输出。
- 不在未经许可时重启 WorkBuddy 或注入用户正在使用的应用。

## 上线门槛

- 收款码沿用现有文件，未进行实际付款测试。
- 需要 Windows / macOS 实机验证导入、切换和恢复，并明确版本边界。
- 需要站长确认客服“马上响应”的值守安排及退款规则。
- 完成上述检查前，保留未上线提示，不发布收款页面。未经用户请求不提交、不推送。

## 后续升级（不在首版范围）

有商户号及支付接口后，再增加服务器创建订单、签名验证回调、幂等核账及私有文件下载授权。个人收款码本身不提供自动支付确认。

## 首版验证记录

- `node --experimental-sqlite --test workers/workbuddy/tests/*.test.mjs`：30 项通过，包括原有燃币与文件权限回归、新增复制交互、价格与二维码原件一致性、配色对比度、主题作用域、打包哈希。
- `wrangler deploy --dry-run`：通过。仅构建检查，没有发布。
- 本地 `/skins/`：HTTP 200，已打开本地预览；未执行浏览器截图或真实浏览器交互测试。
- 上游固定提交：`4e7dd6e079e8d2169d5bc409f59a4edacb44ffeb`；采用其 `theme-manager/src/main/theme-library.mjs` 和相同的 `adm-zip@0.6.0`，将四个 ZIP 逐一导入独立临时目录，`importThemeArchive` 均返回 `installed: true`，`validateThemeDirectory` 均为 `valid: true`。
- 四套主题同时通过上游 `validate-theme.mjs`（无警告）与 `workbuddy-theme.mjs dry-run`。上游 ZIP 导入只接受特定扩展名，包内许可证已用 `LICENSE.md` 保留原文。
- 已查看一张生成的 1200×750 预览，明确标记 `DESIGN PREVIEW / NOT AN APP SCREENSHOT`。
- 本机检测到 WorkBuddy 5.3.14，但没有重启、注入或改变它。实机应用/切换/恢复、微信实际扫码支付与客服值守均未验证，不能把格式检查视为实机兼容检查。
