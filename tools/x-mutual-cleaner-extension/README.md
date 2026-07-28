# X Mutual Cleanup Assistant

本目录是一个本地 Chrome Manifest V3 扩展，用来清理 X/Twitter 的 Following 列表。

内容脚本只访问 `x.com` / `twitter.com`。右下角面板仅在 Following、Followers 和 Verified Followers
列表页显示；通过 X 的站内导航离开这些页面时会自动隐藏，回到对应列表页时会自动显示。

主功能：你登录 X 并打开自己的 Following 页面后，点击「取消未回关」，扩展会自动向下刷列表，逐个点击没有显示 `Follows you` / `关注了你` 的账号右侧 `Following` 按钮；如果 X 弹出确认框，会继续点击 `Unfollow` / `取消关注`。

测试功能：

- 你打开自己的 Followers / Verified Followers 页面后，点击「回关粉丝」，扩展会慢速批量点击显示 `Follow back` / `回关` 的账号。这个功能只用于回关已经关注你的账号，不会点击普通 `Follow`。
- 你打开任意账号的 Followers / Verified Followers 页面后，点击「关注候选」，扩展会低频点击普通 `Follow`。这是关注候选测试，不建议用于复制他人粉丝列表或无限量增长。

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

3. 点击右下角「取消未回关」。
4. 需要停止时，再点同一个按钮。

## 测试：批量回关粉丝

1. 先在 Chrome 里登录 X。
2. 打开自己的 Followers 或 Verified Followers 页面，例如：

```text
https://x.com/<你的用户名>/followers
```

3. 在右下角面板里找到「功能 2 回关粉丝」，点击「开始」。
4. 扩展只处理同时满足下面条件的行：
   - 有 `Follows you` / `关注了你` 标记。
   - 右侧按钮是 `Follow back` / `回关`。
5. 需要停止时，再点同一个按钮。

## 测试：关注候选

1. 先在 Chrome 里登录 X。
2. 打开任意账号的 Followers 或 Verified Followers 页面，例如：

```text
https://x.com/<目标用户名>/followers
```

3. 在右下角面板里找到「功能 3 关注候选」，点击「开始」。
4. 扩展只处理右侧按钮是普通 `Follow` / `关注` 的账号；已经 Following、Follow back 或无法识别的行会跳过。
5. 当前口径：每批最多 10 个，每个关注动作间隔 30 秒；完成 10 个后自动暂停 15 分钟，按钮显示倒计时；倒计时结束后自动进入下一批，单次运行最多 200 个。
6. 需要停止时，再点同一个按钮。

## 判断规则

- 有 `Follows you` / `关注了你`：跳过。
- 没有 `Follows you` / `关注了你`，且右侧是 `Following` / `正在关注`：点击取消。
- 当前屏没有可处理账号：自动向下滚动继续。

## 回关频率保护

X 对连续关注动作有风控。测试回关功能使用保守节奏：

- 默认每次回关后等待 5 秒。
- 每回关 10 个暂停 1 分钟。
- 单次运行最多回关 50 个。
- 如果 X 列表出现 `Something went wrong`，会先暂停 30 秒，再点击 `Retry` 尝试恢复。
- 切到后台会自动暂停，回到当前标签页后继续。

## 关注候选频率口径

关注候选测试比回关更严格：

- 每批最多关注 10 个。
- 每个关注动作之间等待 30 秒。
- 完成 10 个后自动暂停 15 分钟，按钮显示倒计时。
- 倒计时结束后自动进入下一批。
- 单次运行最多 200 个。
- 如果 X 列表出现 `Something went wrong`，会先暂停 30 秒，再点击 `Retry` 尝试恢复。
- 切到后台会自动暂停，回到当前标签页后继续。
