# X Mutual Cleanup Assistant

本目录是一个本地 Chrome Manifest V3 扩展，用来清理 X/Twitter 的 Following 列表。

它只在 `x.com` / `twitter.com` 页面注入一个右下角面板。你登录 X 并打开自己的 Following 页面后，点击「一键取消未回关」，扩展会自动向下刷列表，逐个点击没有显示 `Follows you` / `关注了你` 的账号右侧 `Following` 按钮；如果 X 弹出确认框，会继续点击 `Unfollow` / `取消关注`。

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

3. 点击右下角「一键取消未回关」。
4. 需要停止时，再点同一个按钮。

## 判断规则

- 有 `Follows you` / `关注了你`：跳过。
- 没有 `Follows you` / `关注了你`，且右侧是 `Following` / `正在关注`：点击取消。
- 当前屏没有可处理账号：自动向下滚动继续。
