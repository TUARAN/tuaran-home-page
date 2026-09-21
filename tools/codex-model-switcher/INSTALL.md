# Codex 模型切换器

适用于 macOS 13 及以上版本。应用同时支持 Apple Silicon 和 Intel Mac。

## 直接安装

1. 解压下载包，把 `Codex 模型切换器.app` 拖到“应用程序”或 `~/Applications`。
2. 首次启动时 Control 点按应用，选择“打开”，再确认一次。当前社区版未做 Apple Developer ID 公证。
3. GPT 模式复用你已经登录的 OpenAI 账号，并切换到包内的 GPT-5.6 Sol 预设；账号仍需有权使用该模型和服务层级。
4. DeepSeek 模式需要你自己的 API Key 与兼容 Responses API 的端点。请在应用内的“DeepSeek 设置”输入 Key；它只注入当前登录会话，不写入磁盘或钥匙串，重启电脑后需要重新输入。

应用还提供本地用量中心。“同步会话”读取并同步本机 Codex 会话；“上传展示量”会先显示用量和目的地，确认后才发送到 Vibe Cafe。随机或自定展示值不会改写本地会话。

切换会完全退出并重新打开 Codex，正在运行的任务会被中断。

## 用 Skill 安装

把 `install-codex-model-switcher` 文件夹交给 Codex，或者安装到：

```text
~/.codex/skills/install-codex-model-switcher
```

然后告诉 Codex：

```text
请使用 $install-codex-model-switcher 安装并配置模型切换器。
```

Skill 不含任何 API Key，也不会要求你把 Key 粘贴进聊天。Key 在应用内输入，仅用于当前登录会话；切换 Provider 前会备份现有配置。
