# X Mutual Cleanup Assistant

本目录是一个本地 Chrome Manifest V3 扩展，用来辅助清理 X/Twitter 的 Following 列表。

它不会读取密码，不调用 X 私有 API，也不会后台静默运行。扩展只在 `x.com` / `twitter.com` 页面注入一个右下角面板，由你手动点击“开始取消”后，才会逐个取消关注没有显示 `Follows you` 的账号。

## 安装

1. 打开 Chrome：`chrome://extensions/`
2. 开启右上角「开发者模式」。
3. 点击「加载已解压的扩展程序」。
4. 选择本目录：

```text
tools/x-mutual-cleaner-extension
```

## 使用

1. 先在 Chrome 里登录 X。
2. 打开自己的 Following 页面，例如：

```text
https://x.com/<你的用户名>/following
```

3. 右下角会出现 `X Mutual Cleaner` 面板。
4. 点击「扫描」查看当前可见区域候选数量。
5. 设置「最多取消」和「间隔毫秒」。
6. 点击「开始取消」。
7. 需要随时中断时，点击「停止」。

## 判断规则

扩展只会处理同时满足这些条件的用户行：

- 当前行有 `Following` / `正在关注` 按钮。
- 当前行没有 `Follows you` / `关注了你` 标记。
- 当前页面路径形如 `/<用户名>/following`。
- 页面看起来处于已登录状态。

## 注意

- X 的页面 DOM 经常变化。如果面板无法识别按钮或确认弹窗，需要更新选择器。
- 不建议一次取消太多。建议保留较大的间隔，例如 2000ms 以上，避免触发平台风控。
- 这个工具的行为可能受 X 平台规则限制；使用前请自行判断账号风险。
