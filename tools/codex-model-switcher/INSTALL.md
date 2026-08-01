# Codex 模型切换器

适用于 macOS 13 及以上版本。应用同时支持 Apple Silicon 和 Intel Mac。

## 直接安装

1. 解压下载包，把 `Codex 模型切换器.app` 拖到“应用程序”或 `~/Applications`。
2. 首次启动时 Control 点按应用，选择“打开”，再确认一次。当前社区版未做 Apple Developer ID 公证。
3. GPT 模式复用你已经登录的 OpenAI 账号，并切换到包内的 GPT-5.6 Sol 预设；账号仍需有权使用该模型和服务层级。
4. DeepSeek 模式还需要你自己的 API Key、Responses API 兼容端点和模型目录。推荐下载配套 Skill，让 Codex 自动检查并配置。

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

Skill 不含任何 API Key，也不会要求你把 Key 粘贴进聊天。配置脚本会在本机终端隐藏输入，并在修改前创建备份。
